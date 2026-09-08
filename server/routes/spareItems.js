// Spare Parts catalog. Add/update one at a time, or bulk-import via Excel.
// quantity_on_hand here is the resting stock level; it only ever changes
// alongside a spare_transactions ledger row (see spareRequests.js), never
// by a bare UPDATE from this file   Restock is the one exception, modeled
// explicitly as its own transaction type below.
import { Router } from 'express';
import multer from 'multer';
import ExcelJS from 'exceljs';
import { pool } from '../db.js';
import { authorize } from '../auth.js';
import { sendError } from '../workflow.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const router = Router();

const SELECT = `SELECT id, sku, name, category, unit, unit_cost, reorder_level, quantity_on_hand, store_location, is_active, created_at FROM spare_items`;

router.get('/', async (req, res) => {
  const where = []; const params = [];
  if (req.query.category) { where.push('category = ?'); params.push(req.query.category); }
  if (req.query.lowStock === 'true') { where.push('quantity_on_hand <= reorder_level'); }
  if (req.query.q) { where.push('(name LIKE ? OR sku LIKE ?)'); params.push(`%${req.query.q}%`, `%${req.query.q}%`); }
  if (req.query.active !== 'all') where.push('is_active = 1');
  const sql = `${SELECT} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY name`;
  const [rows] = await pool.query(sql, params);
  res.json(rows.map(shape));
});

router.get('/:id', async (req, res) => {
  const [rows] = await pool.query(`${SELECT} WHERE id = ?`, [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Spare item not found' });
  const [transactions] = await pool.query(
    `SELECT t.id, t.type, t.qty, t.note, t.created_at, u.full_name AS performed_by,
            t.work_order_id, w.wo_no, t.site_id, s.name AS site_name
     FROM spare_transactions t JOIN users u ON u.id = t.performed_by
     LEFT JOIN work_orders w ON w.id = t.work_order_id LEFT JOIN sites s ON s.id = t.site_id
     WHERE t.spare_item_id = ? ORDER BY t.created_at DESC`, [req.params.id]
  );
  res.json({
    ...shape(rows[0]),
    transactions: transactions.map((t) => ({
      id: t.id, type: t.type, qty: t.qty, note: t.note, createdAt: t.created_at, performedBy: t.performed_by,
      workOrderId: t.work_order_id, woNo: t.wo_no, siteId: t.site_id, siteName: t.site_name,
    })),
  });
});

router.post('/', authorize('Administrator', 'Spare User'), async (req, res) => {
  const b = req.body || {};
  if (!b.sku || !b.name) return res.status(400).json({ error: 'sku and name are required' });
  try {
    const [r] = await pool.query(
      `INSERT INTO spare_items (sku, name, category, unit, unit_cost, reorder_level, quantity_on_hand, store_location) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [b.sku, b.name, b.category || null, b.unit || 'pcs', b.unitCost || 0, b.reorderLevel || 0, b.quantityOnHand || 0, b.storeLocation || null]
    );
    res.status(201).json({ id: r.insertId });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'SKU already exists' });
    sendError(res, e);
  }
});

router.put('/:id', authorize('Administrator', 'Spare User'), async (req, res) => {
  const b = req.body || {};
  const fields = { name: b.name, category: b.category, unit: b.unit, unit_cost: b.unitCost, reorder_level: b.reorderLevel, store_location: b.storeLocation, is_active: b.isActive !== undefined ? (b.isActive ? 1 : 0) : undefined };
  const sets = []; const params = [];
  for (const [col, val] of Object.entries(fields)) { if (val !== undefined) { sets.push(`${col} = ?`); params.push(val); } }
  if (!sets.length) return res.status(400).json({ error: 'No fields to update' });
  params.push(req.params.id);
  await pool.query(`UPDATE spare_items SET ${sets.join(', ')} WHERE id = ?`, params);
  res.json({ ok: true });
});

// Restock: the one place quantity_on_hand is adjusted directly by a
// user rather than via an Issue/Return against a request   still logged
// as a ledger row for traceability.
router.post('/:id/restock', authorize('Administrator', 'Spare User'), async (req, res) => {
  const qty = Number(req.body?.qty);
  if (!qty || qty <= 0) return res.status(400).json({ error: 'A positive qty is required' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('UPDATE spare_items SET quantity_on_hand = quantity_on_hand + ? WHERE id = ?', [qty, req.params.id]);
    await conn.query(
      `INSERT INTO spare_transactions (spare_item_id, type, qty, performed_by, note) VALUES (?, 'Restock', ?, ?, ?)`,
      [req.params.id, qty, req.user.id, req.body?.note || null]
    );
    await conn.commit();
    res.json({ ok: true });
  } catch (e) {
    await conn.rollback();
    sendError(res, e);
  } finally {
    conn.release();
  }
});

router.delete('/:id', authorize('Administrator'), async (req, res) => {
  try {
    await pool.query('DELETE FROM spare_items WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    if (e.code?.startsWith('ER_ROW_IS_REFERENCED')) return res.status(409).json({ error: 'This item has requests/transactions on record   deactivate it instead of deleting.' });
    sendError(res, e);
  }
});

// Bulk import via Excel. Columns: SKU | Name | Category | Unit | Unit Cost
// | Reorder Level | Quantity On Hand | Store Location. Validates every
// row (no duplicate SKU) before inserting anything.
router.post('/bulk-import', authorize('Administrator', 'Spare User'), upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'An Excel file is required' });
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(req.file.buffer);
  } catch {
    return res.status(400).json({ error: 'Could not read that file as an Excel workbook (.xlsx)' });
  }
  const sheet = workbook.worksheets[0];
  if (!sheet) return res.status(400).json({ error: 'The workbook has no sheets' });

  const [existing] = await pool.query('SELECT sku FROM spare_items');
  const existingSkus = new Set(existing.map((s) => s.sku.toLowerCase()));

  const headerRow = sheet.getRow(1).values.map((v) => (v || '').toString().trim().toLowerCase());
  const col = (label) => headerRow.findIndex((h) => h === label);
  const idx = {
    sku: col('sku'), name: col('name'), category: col('category'), unit: col('unit'),
    unitCost: col('unit cost'), reorderLevel: col('reorder level'), qty: col('quantity on hand'), store: col('store location'),
  };
  if (idx.sku < 0 || idx.name < 0) return res.status(400).json({ error: 'Expected columns: SKU, Name (Category, Unit, Unit Cost, Reorder Level, Quantity On Hand, Store Location optional)' });

  const results = []; const toInsert = []; const seenInFile = new Set();
  for (let rowNum = 2; rowNum <= sheet.rowCount; rowNum++) {
    const row = sheet.getRow(rowNum);
    if (row.values.length === 0) continue;
    const cell = (i) => (i >= 0 ? row.getCell(i).value : null);
    const sku = (cell(idx.sku) || '').toString().trim();
    const name = (cell(idx.name) || '').toString().trim();
    if (!sku && !name) continue;

    const errors = [];
    if (!sku) errors.push('Missing SKU');
    if (!name) errors.push('Missing Name');
    if (sku && (existingSkus.has(sku.toLowerCase()) || seenInFile.has(sku.toLowerCase()))) errors.push(`Duplicate SKU "${sku}"`);
    const qty = idx.qty >= 0 ? Number(cell(idx.qty)) || 0 : 0;
    const unitCost = idx.unitCost >= 0 ? Number(cell(idx.unitCost)) || 0 : 0;
    const reorderLevel = idx.reorderLevel >= 0 ? Number(cell(idx.reorderLevel)) || 0 : 0;

    if (errors.length) {
      results.push({ row: rowNum, sku, status: 'failed', errors });
    } else {
      seenInFile.add(sku.toLowerCase());
      toInsert.push({
        sku, name, category: (idx.category >= 0 ? cell(idx.category) : null) || null,
        unit: (idx.unit >= 0 ? cell(idx.unit) : null) || 'pcs', unitCost, reorderLevel, qty,
        store: (idx.store >= 0 ? cell(idx.store) : null) || null,
      });
      results.push({ row: rowNum, sku, status: 'ok' });
    }
  }

  if (toInsert.length) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      for (const s of toInsert) {
        await conn.query(
          `INSERT INTO spare_items (sku, name, category, unit, unit_cost, reorder_level, quantity_on_hand, store_location) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [s.sku, s.name, s.category, s.unit, s.unitCost, s.reorderLevel, s.qty, s.store]
        );
      }
      await conn.commit();
    } catch (e) {
      await conn.rollback();
      return sendError(res, e);
    } finally {
      conn.release();
    }
  }

  res.json({ total: results.length, inserted: toInsert.length, failed: results.filter((r) => r.status === 'failed').length, results });
});

function shape(s) {
  return {
    id: s.id, sku: s.sku, name: s.name, category: s.category, unit: s.unit,
    unitCost: Number(s.unit_cost), reorderLevel: s.reorder_level, quantityOnHand: s.quantity_on_hand,
    storeLocation: s.store_location, isActive: !!s.is_active, createdAt: s.created_at,
    lowStock: s.quantity_on_hand <= s.reorder_level,
  };
}

export default router;
