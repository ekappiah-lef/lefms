// Spare Requests: Work Order -> Spare Request -> Spare Item(s), with full
// traceability via the append-only spare_transactions ledger.
// quantity_on_hand only ever changes alongside a new ledger row, in the
// same DB transaction as the request-item update   never a bare UPDATE.
import { Router } from 'express';
import { pool } from '../db.js';
import { scopeRegion } from '../auth.js';
import { authorizeModule } from '../permissions.js';
import { getHistory, WorkflowError, sendError } from '../workflow.js';
import { placeholderTicketNo, finalizeTicketNo } from '../ticketNumbers.js';

const router = Router();

const SELECT = `
  SELECT r.id, r.request_no, r.status, r.note, r.created_at, r.decided_at, r.decision_note,
         ru.full_name AS requested_by_name, du.full_name AS decided_by_name,
         r.work_order_id, w.wo_no, w.wo_type, w.title AS wo_title, w.region_id, w.region_name,
         r.site_id, s.site_code, s.name AS site_name
  FROM spare_requests r
  JOIN work_orders w ON w.id = r.work_order_id
  JOIN sites s ON s.id = r.site_id
  JOIN users ru ON ru.id = r.requested_by
  LEFT JOIN users du ON du.id = r.decided_by
`;

async function loadItems(requestId) {
  const [rows] = await pool.query(
    `SELECT ri.id, ri.spare_item_id, si.sku, si.name, si.unit, ri.qty_requested, ri.qty_issued, ri.qty_returned, ri.unit_cost_snapshot
     FROM spare_request_items ri JOIN spare_items si ON si.id = ri.spare_item_id WHERE ri.spare_request_id = ? ORDER BY ri.id`,
    [requestId]
  );
  return rows.map((r) => ({
    id: r.id, spareItemId: r.spare_item_id, sku: r.sku, name: r.name, unit: r.unit,
    qtyRequested: r.qty_requested, qtyIssued: r.qty_issued, qtyReturned: r.qty_returned, unitCostSnapshot: Number(r.unit_cost_snapshot),
  }));
}

router.get('/', async (req, res) => {
  const region = scopeRegion(req);
  const where = []; const params = [];
  if (region) { where.push('w.region_id = ?'); params.push(region); }
  if (req.query.status) { where.push('r.status = ?'); params.push(req.query.status); }
  if (req.query.workOrder) { where.push('r.work_order_id = ?'); params.push(req.query.workOrder); }
  if (req.query.site) { where.push('r.site_id = ?'); params.push(req.query.site); }
  if (req.user.role === 'Engineer') { where.push('r.requested_by = ?'); params.push(req.user.id); }
  const sql = `${SELECT} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY r.created_at DESC`;
  const [rows] = await pool.query(sql, params);
  res.json(rows.map(shape));
});

router.get('/:id', async (req, res) => {
  const [rows] = await pool.query(`${SELECT} WHERE r.id = ?`, [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Spare request not found' });
  const items = await loadItems(req.params.id);
  const history = await getHistory('spare_request', req.params.id);
  res.json({ ...shape(rows[0]), items, history });
});

router.post('/', authorizeModule('spare_requests', 'manage'), async (req, res) => {
  const b = req.body || {};
  if (!b.workOrderId || !Array.isArray(b.items) || !b.items.length) {
    return res.status(400).json({ error: 'workOrderId and a non-empty items array are required' });
  }
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[wo]] = await conn.query('SELECT id, site_id FROM work_orders WHERE id = ?', [b.workOrderId]);
    if (!wo) throw new WorkflowError('Work order not found', 404);

    const [r] = await conn.query(
      `INSERT INTO spare_requests (request_no, work_order_id, site_id, requested_by, note) VALUES (?, ?, ?, ?, ?)`,
      [placeholderTicketNo(), wo.id, wo.site_id, req.user.id, b.note || null]
    );
    const requestId = r.insertId;
    const requestNo = await finalizeTicketNo(conn, 'spare_requests', 'request_no', 'SR', requestId);

    for (const item of b.items) {
      if (!item.spareItemId || !item.qtyRequested || item.qtyRequested <= 0) continue;
      const [[si]] = await conn.query('SELECT unit_cost FROM spare_items WHERE id = ?', [item.spareItemId]);
      if (!si) throw new WorkflowError(`Spare item ${item.spareItemId} not found`, 404);
      await conn.query(
        `INSERT INTO spare_request_items (spare_request_id, spare_item_id, qty_requested, unit_cost_snapshot) VALUES (?, ?, ?, ?)`,
        [requestId, item.spareItemId, item.qtyRequested, si.unit_cost]
      );
    }

    await conn.query(
      `INSERT INTO ticket_history (entity_type, entity_id, from_status, to_status, action, actor_id, note) VALUES ('spare_request', ?, NULL, 'Requested', 'Create', ?, ?)`,
      [requestId, req.user.id, b.note?.trim() || 'Spare request created.']
    );
    await conn.commit();
    res.status(201).json({ id: requestId, requestNo });
  } catch (e) {
    await conn.rollback();
    sendError(res, e);
  } finally {
    conn.release();
  }
});

router.post('/:id/actions/:action', authorizeModule('spare_fulfillment', 'manage'), async (req, res) => {
  const { action } = req.params;
  const note = req.body?.note;
  if (!note || !note.trim()) return res.status(400).json({ error: 'A note is required' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[r]] = await conn.query('SELECT id, status, work_order_id, site_id FROM spare_requests WHERE id = ? FOR UPDATE', [req.params.id]);
    if (!r) throw new WorkflowError('Spare request not found', 404);

    if (action === 'approve' || action === 'reject') {
      if (r.status !== 'Requested') throw new WorkflowError(`Cannot ${action} a request in status ${r.status}`, 409);
      const newStatus = action === 'approve' ? 'Approved' : 'Rejected';
      await conn.query('UPDATE spare_requests SET status = ?, decided_by = ?, decided_at = NOW(), decision_note = ? WHERE id = ?', [newStatus, req.user.id, note.trim(), r.id]);
      const [hist] = await conn.query(
        `INSERT INTO ticket_history (entity_type, entity_id, from_status, to_status, action, actor_id, note) VALUES ('spare_request', ?, ?, ?, ?, ?, ?)`,
        [r.id, r.status, newStatus, action, req.user.id, note.trim()]
      );
      await conn.commit();
      return res.json({ status: newStatus, historyId: hist.insertId });
    }

    if (action === 'issue' || action === 'return') {
      if (action === 'issue' && !['Approved', 'Partially Issued'].includes(r.status)) throw new WorkflowError(`Cannot issue against a request in status ${r.status}`, 409);
      if (action === 'return' && !['Issued', 'Partially Issued'].includes(r.status)) throw new WorkflowError(`Cannot return against a request in status ${r.status}`, 409);
      const lines = Array.isArray(req.body?.items) ? req.body.items : [];
      if (!lines.length) throw new WorkflowError('A non-empty items array is required', 400);

      for (const line of lines) {
        const qty = Number(line.qty);
        if (!line.requestItemId || !qty || qty <= 0) continue;
        const [[ri]] = await conn.query('SELECT id, spare_item_id, qty_requested, qty_issued, qty_returned FROM spare_request_items WHERE id = ? AND spare_request_id = ? FOR UPDATE', [line.requestItemId, r.id]);
        if (!ri) throw new WorkflowError(`Request item ${line.requestItemId} not found on this request`, 404);

        if (action === 'issue') {
          const remaining = ri.qty_requested - ri.qty_issued;
          if (qty > remaining) throw new WorkflowError(`Cannot issue ${qty}   only ${remaining} remaining on this line`, 400);
          const [[si]] = await conn.query('SELECT quantity_on_hand FROM spare_items WHERE id = ? FOR UPDATE', [ri.spare_item_id]);
          if (qty > si.quantity_on_hand) throw new WorkflowError(`Cannot issue ${qty}   only ${si.quantity_on_hand} in stock`, 409);
          await conn.query('UPDATE spare_request_items SET qty_issued = qty_issued + ? WHERE id = ?', [qty, ri.id]);
          await conn.query('UPDATE spare_items SET quantity_on_hand = quantity_on_hand - ? WHERE id = ?', [qty, ri.spare_item_id]);
          await conn.query(
            `INSERT INTO spare_transactions (spare_item_id, spare_request_item_id, type, qty, work_order_id, site_id, performed_by, note) VALUES (?, ?, 'Issue', ?, ?, ?, ?, ?)`,
            [ri.spare_item_id, ri.id, qty, r.work_order_id, r.site_id, req.user.id, note.trim()]
          );
        } else {
          const remaining = ri.qty_issued - ri.qty_returned;
          if (qty > remaining) throw new WorkflowError(`Cannot return ${qty}   only ${remaining} outstanding on this line`, 400);
          await conn.query('UPDATE spare_request_items SET qty_returned = qty_returned + ? WHERE id = ?', [qty, ri.id]);
          await conn.query('UPDATE spare_items SET quantity_on_hand = quantity_on_hand + ? WHERE id = ?', [qty, ri.spare_item_id]);
          await conn.query(
            `INSERT INTO spare_transactions (spare_item_id, spare_request_item_id, type, qty, work_order_id, site_id, performed_by, note) VALUES (?, ?, 'Return', ?, ?, ?, ?, ?)`,
            [ri.spare_item_id, ri.id, qty, r.work_order_id, r.site_id, req.user.id, note.trim()]
          );
        }
      }

      let newStatus = r.status;
      if (action === 'issue') {
        const [items] = await conn.query('SELECT qty_requested, qty_issued FROM spare_request_items WHERE spare_request_id = ?', [r.id]);
        const fullyIssued = items.every((i) => i.qty_issued >= i.qty_requested);
        newStatus = fullyIssued ? 'Issued' : 'Partially Issued';
        await conn.query('UPDATE spare_requests SET status = ? WHERE id = ?', [newStatus, r.id]);
      }
      const [hist] = await conn.query(
        `INSERT INTO ticket_history (entity_type, entity_id, from_status, to_status, action, actor_id, note) VALUES ('spare_request', ?, ?, ?, ?, ?, ?)`,
        [r.id, r.status, newStatus, action, req.user.id, note.trim()]
      );
      await conn.commit();
      return res.json({ status: newStatus, historyId: hist.insertId });
    }

    if (action === 'close') {
      if (!['Issued', 'Partially Issued', 'Rejected'].includes(r.status)) throw new WorkflowError(`Cannot close a request in status ${r.status}`, 409);
      await conn.query(`UPDATE spare_requests SET status = 'Closed' WHERE id = ?`, [r.id]);
      const [hist] = await conn.query(
        `INSERT INTO ticket_history (entity_type, entity_id, from_status, to_status, action, actor_id, note) VALUES ('spare_request', ?, ?, 'Closed', 'close', ?, ?)`,
        [r.id, r.status, req.user.id, note.trim()]
      );
      await conn.commit();
      return res.json({ status: 'Closed', historyId: hist.insertId });
    }

    throw new WorkflowError(`Unknown action "${action}"`, 400);
  } catch (e) {
    await conn.rollback();
    sendError(res, e);
  } finally {
    conn.release();
  }
});

function shape(r) {
  return {
    id: r.id, requestNo: r.request_no, status: r.status, note: r.note, createdAt: r.created_at,
    decidedAt: r.decided_at, decisionNote: r.decision_note, requestedByName: r.requested_by_name, decidedByName: r.decided_by_name,
    workOrderId: r.work_order_id, woNo: r.wo_no, woType: r.wo_type, woTitle: r.wo_title,
    regionId: r.region_id, regionName: r.region_name,
    siteId: r.site_id, siteCode: r.site_code, siteName: r.site_name,
  };
}

export default router;
