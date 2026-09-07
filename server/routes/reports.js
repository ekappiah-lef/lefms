// =====================================================================
// Real exports: raw Excel rows (exceljs), a full-detail PDF per work
// order (pdfkit, includes the complete stage history), and a bulk ZIP of
// PDFs (archiver). No stubs, no window.print()   these stream real files.
// =====================================================================
import { Router } from 'express';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import archiver from 'archiver';
import { pool } from '../db.js';
import { getHistory } from '../workflow.js';

const router = Router();

const SELECT = `SELECT w.wo_no, w.wo_type, w.region_name, w.site_name, w.site_code, a.name AS asset, w.title, w.description,
                        w.priority, w.status, cu.full_name AS created_by, eu.full_name AS engineer,
                        w.frequency, w.next_due, w.id AS _id,
                        w.created_at, w.accepted_at, w.completed_at, w.cancelled_at, w.closed_at, w.rejected_at
                 FROM work_orders w LEFT JOIN assets a ON a.id = w.asset_id
                 JOIN users cu ON cu.id = w.created_by JOIN users eu ON eu.id = w.engineer_id`;
const COLUMNS = ['wo_no', 'wo_type', 'region_name', 'site_name', 'site_code', 'asset', 'title', 'description', 'priority', 'status', 'created_by', 'engineer', 'frequency', 'next_due', 'created_at', 'accepted_at', 'completed_at', 'cancelled_at', 'closed_at', 'rejected_at'];

function applyFilters(sql, query) {
  const where = []; const params = [];
  if (query.type) { where.push('w.wo_type = ?'); params.push(query.type); }
  if (query.region) { where.push('w.region_id = ?'); params.push(query.region); }
  if (query.status) { where.push('w.status = ?'); params.push(query.status); }
  if (query.from) { where.push('w.created_at >= ?'); params.push(query.from); }
  if (query.to) { where.push('w.created_at <= ?'); params.push(query.to); }
  return { sql: where.length ? `${sql} WHERE ${where.join(' AND ')}` : sql, params };
}

router.get('/export/excel', async (req, res) => {
  const { sql, params } = applyFilters(SELECT, req.query);
  const [rows] = await pool.query(sql, params);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'LEF MS';
  workbook.created = new Date();
  const sheet = workbook.addWorksheet('Work Orders');
  sheet.columns = COLUMNS.map((c) => ({ header: c.replace(/_/g, ' ').toUpperCase(), key: c, width: 20 }));
  sheet.getRow(1).font = { bold: true };
  rows.forEach((r) => sheet.addRow({ ...r, status: STATUS_LABELS_FULL[r.status] || r.status }));

  const pmIds = rows.filter((r) => r.wo_type === 'PM').map((r) => r._id);
  if (pmIds.length) {
    const [checklistRows] = await pool.query(
      `SELECT w.wo_no, c.task, c.response FROM work_order_checklist c
       JOIN work_orders w ON w.id = c.work_order_id WHERE c.work_order_id IN (?) ORDER BY w.wo_no, c.id`,
      [pmIds]
    );
    const clSheet = workbook.addWorksheet('PM Checklist Answers');
    clSheet.columns = [
      { header: 'WO NO', key: 'wo_no', width: 16 },
      { header: 'QUESTION', key: 'task', width: 50 },
      { header: 'RESPONSE', key: 'response', width: 12 },
    ];
    clSheet.getRow(1).font = { bold: true };
    checklistRows.forEach((r) => clSheet.addRow({ wo_no: r.wo_no, task: r.task, response: r.response || 'Not answered' }));
  }

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="lefms-work-orders-${Date.now()}.xlsx"`);
  await workbook.xlsx.write(res);
  res.end();
});

const STATUS_LABELS_FULL = { CR: 'Created', PR: 'In Process', CO: 'Completed', CL: 'Closed', RJ: 'Rejected', CA: 'Cancelled' };
const HISTORY_LABELS = {
  Create: 'CREATED', accept: 'IN PROCESS', update: 'UPDATED', reassign: 'REASSIGNED',
  complete: 'COMPLETED', cancel: 'CANCELLED', close: 'CLOSED', reject: 'REJECTED',
  rework: 'REJECTED', reopen: 'REASSIGNED', ehs_flagged: 'EHS FLAGGED',
};
const HISTORY_COLORS = {
  Create: '#64748b', accept: '#2563eb', update: '#7c3aed', reassign: '#d97706',
  complete: '#059669', cancel: '#ea580c', close: '#475569', reject: '#dc2626',
  rework: '#dc2626', reopen: '#2563eb', ehs_flagged: '#dc2626',
};

function fmtDateTime(dt) {
  if (!dt) return ' ';
  const d = dt instanceof Date ? dt : new Date(dt);
  if (Number.isNaN(d.getTime())) return String(dt);
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function fmtDate(dt) {
  if (!dt) return ' ';
  const d = dt instanceof Date ? dt : new Date(dt);
  if (Number.isNaN(d.getTime())) return String(dt);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function buildFields(r) {
  const f = [];
  f.push({ label: 'Type', value: r.wo_type });
  f.push({ label: 'Region', value: r.region_name });
  f.push({ label: 'Site', value: `${r.site_code}   ${r.site_name}` });
  if (r.asset) f.push({ label: 'Asset', value: r.asset });
  f.push({ label: 'Priority', value: r.priority });
  f.push({ label: 'Assigned Engineer', value: r.engineer });
  f.push({ label: 'Created By', value: r.created_by });
  if (r.wo_type === 'PM') {
    f.push({ label: 'Frequency', value: r.frequency });
    f.push({ label: 'Next Due', value: fmtDate(r.next_due) });
  }
  f.push({ label: 'Status', value: STATUS_LABELS_FULL[r.status] || r.status });
  f.push({ label: 'Created', value: fmtDateTime(r.created_at) });
  return f;
}

// Every block below reads the current doc.y and writes it back explicitly
// (never relying on PDFKit's implicit cursor advance across positioned
// text calls) so a 2-column grid and boxed text can't drift out of sync.
function ensureSpace(doc, height) {
  if (doc.y + height > doc.page.height - doc.page.margins.bottom) doc.addPage();
}

function sectionTitle(doc, text) {
  ensureSpace(doc, 26);
  const x = doc.page.margins.left;
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#94a3b8').text(text.toUpperCase(), x, doc.y, { characterSpacing: 0.5 });
  doc.moveDown(0.6);
  doc.fillColor('#000');
}

function fieldGrid(doc, fields) {
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const gap = 24;
  const colWidth = (width - gap) / 2;
  const startX = doc.page.margins.left;
  const rows = [];
  for (let i = 0; i < fields.length; i += 2) rows.push([fields[i], fields[i + 1]]);
  rows.forEach((row) => {
    const heights = row.map((f) => (f ? doc.font('Helvetica').fontSize(10).heightOfString(String(f.value ?? ' '), { width: colWidth }) : 0));
    const rowH = Math.max(...heights, 10) + 20;
    ensureSpace(doc, rowH);
    const y = doc.y;
    row.forEach((f, ci) => {
      if (!f) return;
      const x = startX + ci * (colWidth + gap);
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#94a3b8').text(f.label.toUpperCase(), x, y, { width: colWidth, characterSpacing: 0.3 });
      doc.font('Helvetica').fontSize(10).fillColor('#1e293b').text(String(f.value ?? ' '), x, y + 12, { width: colWidth });
    });
    doc.y = y + rowH;
    doc.x = startX;
  });
  doc.moveDown(0.4);
}

// A bordered, shaded box around wrapped text   mirrors the ticket detail
// page's slate description/note boxes.
function boxedText(doc, label, text, { fontSize = 9.5 } = {}) {
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const pad = 10;
  const startX = doc.page.margins.left;
  const bodyText = text && String(text).trim() ? String(text) : ' ';
  const textH = doc.font('Helvetica').fontSize(fontSize).heightOfString(bodyText, { width: width - pad * 2 });
  const boxH = textH + pad * 2;
  ensureSpace(doc, 14 + boxH + 12);
  if (label) {
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#94a3b8').text(label.toUpperCase(), startX, doc.y, { characterSpacing: 0.3 });
    doc.moveDown(0.25);
  }
  const y = doc.y;
  doc.roundedRect(startX, y, width, boxH, 4).fillAndStroke('#f8fafc', '#e2e8f0');
  doc.fillColor('#334155').font('Helvetica').fontSize(fontSize).text(bodyText, startX + pad, y + pad, { width: width - pad * 2 });
  doc.y = y + boxH + 12;
  doc.x = startX;
  doc.fillColor('#000');
}

function historyEntry(doc, h, woType) {
  const startX = doc.page.margins.left;
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const label = HISTORY_LABELS[h.action] || h.action.toUpperCase();
  const color = HISTORY_COLORS[h.action] || '#475569';

  ensureSpace(doc, 18);
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(color).text(label, startX, doc.y, { continued: true, width });
  doc.font('Helvetica').fontSize(9.5).fillColor('#64748b').text(`   ${h.actor} · ${fmtDateTime(h.created_at)}`);
  doc.fillColor('#000');
  doc.moveDown(0.3);

  // Plain text, no border/box   just the note sitting on the sheet.
  ensureSpace(doc, 14);
  const noteText = h.note && String(h.note).trim() ? String(h.note) : ' ';
  doc.font('Helvetica').fontSize(9).fillColor('#334155').text(noteText, startX, doc.y, { width });
  doc.fillColor('#000');
  doc.moveDown(0.5);

  if (woType === 'PM' && h.action === 'complete' && h.checklistSnapshot?.length) {
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#94a3b8').text('CHECKLIST AT COMPLETION', startX, doc.y, { characterSpacing: 0.3 });
    doc.moveDown(0.25);
    h.checklistSnapshot.forEach((c) => {
      ensureSpace(doc, 13);
      doc.font('Helvetica').fontSize(9).fillColor('#334155').text(`${c.response || 'N/A'}   ${c.task}`, startX, doc.y, { width });
    });
    doc.fillColor('#000');
    doc.moveDown(0.4);
  }

  if (h.attachments?.length) {
    ensureSpace(doc, 13);
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#94a3b8').text('ATTACHMENTS', startX, doc.y, { characterSpacing: 0.3 });
    doc.moveDown(0.2);
    h.attachments.forEach((a) => {
      ensureSpace(doc, 12);
      doc.font('Helvetica').fontSize(9).fillColor('#2563eb').text(`• ${a.fileName}`, startX, doc.y, { width });
    });
    doc.fillColor('#000');
    doc.moveDown(0.4);
  }

  ensureSpace(doc, 14);
  doc.moveTo(startX, doc.y).lineTo(startX + width, doc.y).strokeColor('#e2e8f0').lineWidth(1).stroke();
  doc.strokeColor('#000');
  doc.moveDown(0.6);
}

async function buildTicketPdf(id) {
  const [rows] = await pool.query(`${SELECT} WHERE w.id = ?`, [id]);
  const record = rows[0];
  if (!record) return null;
  const history = await getHistory('work_order', id);

  const doc = new PDFDocument({ margin: 50, bufferPages: true });
  const chunks = [];
  doc.on('data', (c) => chunks.push(c));
  const done = new Promise((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))));
  const usableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const startX = doc.page.margins.left;

  doc.font('Helvetica-Bold').fontSize(16).fillColor('#0f172a').text('LEF MS   Work Order', { align: 'center' });
  doc.moveDown(1);

  doc.font('Helvetica-Bold').fontSize(9).fillColor('#94a3b8').text(record.wo_no || '', startX, doc.y);
  doc.moveDown(0.2);
  doc.font('Helvetica-Bold').fontSize(17).fillColor('#0f172a').text(record.title, startX, doc.y, { width: usableWidth });
  doc.x = startX;
  doc.font('Helvetica').fontSize(9).fillColor('#94a3b8').text(`Created ${fmtDateTime(record.created_at)}`, startX, doc.y);
  doc.fillColor('#000');
  doc.moveDown(1);

  sectionTitle(doc, 'Work Order Details');
  fieldGrid(doc, buildFields(record));

  boxedText(doc, 'Description', record.description);

  if (record.wo_type === 'PM') {
    const [checklist] = await pool.query('SELECT task, response FROM work_order_checklist WHERE work_order_id = ? ORDER BY id', [id]);
    if (checklist.length) {
      sectionTitle(doc, 'Checklist');
      checklist.forEach((c) => {
        ensureSpace(doc, 14);
        doc.font('Helvetica').fontSize(9.5).fillColor('#334155').text(`${c.response || 'Not answered'}   ${c.task}`, startX, doc.y, { width: usableWidth });
      });
      doc.fillColor('#000');
      doc.moveDown(1);
    }
  }

  sectionTitle(doc, 'Activity & Process History');
  history.forEach((h) => historyEntry(doc, h, record.wo_type));

  doc.end();
  return done;
}

router.get('/export/pdf/:id', async (req, res) => {
  const buffer = await buildTicketPdf(req.params.id);
  if (!buffer) return res.status(404).json({ error: 'Not found' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="wo-${req.params.id}.pdf"`);
  res.send(buffer);
});

router.post('/export/pdf/bulk', async (req, res) => {
  const { ids } = req.body || {};
  if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ error: 'A non-empty ids array is required' });

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="lefms-work-orders-${Date.now()}.zip"`);
  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.pipe(res);

  for (const id of ids) {
    const buffer = await buildTicketPdf(id);
    if (buffer) archive.append(buffer, { name: `wo-${id}.pdf` });
  }
  await archive.finalize();
});

// EHS Reports   filterable raw export of every EHS record.
router.get('/export/ehs-excel', async (req, res) => {
  const where = []; const params = [];
  if (req.query.status) { where.push('eh.status = ?'); params.push(req.query.status); }
  if (req.query.region) { where.push('w.region_id = ?'); params.push(req.query.region); }
  if (req.query.from) { where.push('eh.created_at >= ?'); params.push(req.query.from); }
  if (req.query.to) { where.push('eh.created_at <= ?'); params.push(req.query.to); }
  const sql = `SELECT eh.ehs_no, w.wo_no, w.wo_type, w.title AS wo_title, w.site_name, w.region_name,
                      eu.full_name AS engineer, eh.status, eh.outcome, su.full_name AS submitted_by, eh.submitted_at,
                      ru.full_name AS reviewed_by, eh.reviewed_at, eh.review_note, eh.created_at
               FROM ehs_records eh JOIN work_orders w ON w.id = eh.work_order_id JOIN users eu ON eu.id = w.engineer_id
               LEFT JOIN users su ON su.id = eh.submitted_by LEFT JOIN users ru ON ru.id = eh.reviewed_by
               ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY eh.created_at DESC`;
  const [rows] = await pool.query(sql, params);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'LEF MS';
  const sheet = workbook.addWorksheet('EHS Records');
  const columns = ['ehs_no', 'wo_no', 'wo_type', 'wo_title', 'site_name', 'region_name', 'engineer', 'status', 'outcome', 'submitted_by', 'submitted_at', 'reviewed_by', 'reviewed_at', 'review_note', 'created_at'];
  sheet.columns = columns.map((c) => ({ header: c.replace(/_/g, ' ').toUpperCase(), key: c, width: 20 }));
  sheet.getRow(1).font = { bold: true };
  rows.forEach((r) => sheet.addRow(r));

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="lefms-ehs-export-${Date.now()}.xlsx"`);
  await workbook.xlsx.write(res);
  res.end();
});

// Spare Reports   current inventory levels plus the full transaction ledger.
router.get('/export/spares-excel', async (req, res) => {
  // No unit_cost here   financials aren't shown on this report, per feedback.
  const [items] = await pool.query(`SELECT sku, name, category, unit, reorder_level, quantity_on_hand, store_location FROM spare_items ORDER BY name`);
  const where = []; const params = [];
  if (req.query.from) { where.push('t.created_at >= ?'); params.push(req.query.from); }
  if (req.query.to) { where.push('t.created_at <= ?'); params.push(req.query.to); }
  if (req.query.type) { where.push('t.type = ?'); params.push(req.query.type); }
  const [ledger] = await pool.query(
    `SELECT si.sku, COALESCE(si.name, t.item_name) AS name, t.type, t.qty, w.wo_no, s.name AS site_name, u.full_name AS performed_by, t.note, t.created_at
     FROM spare_transactions t LEFT JOIN spare_items si ON si.id = t.spare_item_id
     LEFT JOIN work_orders w ON w.id = t.work_order_id LEFT JOIN sites s ON s.id = t.site_id JOIN users u ON u.id = t.performed_by
     ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY t.created_at DESC`, params
  );

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'LEF MS';
  const invSheet = workbook.addWorksheet('Inventory');
  invSheet.columns = ['sku', 'name', 'category', 'unit', 'reorder_level', 'quantity_on_hand', 'store_location'].map((c) => ({ header: c.replace(/_/g, ' ').toUpperCase(), key: c, width: 20 }));
  invSheet.getRow(1).font = { bold: true };
  items.forEach((r) => invSheet.addRow(r));

  const ledgerSheet = workbook.addWorksheet('Inventory Ledger');
  ledgerSheet.columns = ['sku', 'name', 'type', 'qty', 'wo_no', 'site_name', 'performed_by', 'note', 'created_at'].map((c) => ({ header: c.replace(/_/g, ' ').toUpperCase(), key: c, width: 20 }));
  ledgerSheet.getRow(1).font = { bold: true };
  ledger.forEach((r) => ledgerSheet.addRow(r));

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="lefms-spares-export-${Date.now()}.xlsx"`);
  await workbook.xlsx.write(res);
  res.end();
});

export default router;
