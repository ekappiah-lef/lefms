// Trouble Tickets: raised before a Work Order exists, with no assigned
// engineer yet (that only happens once/if it becomes a Work Order). Own
// small lifecycle   OPEN -> COMPLETED|CANCELLED -> CLOSED, plus non-status
// Update entries   because not every trouble ticket ends up needing a
// Work Order; some are just triaged, updated and closed on their own.
// "Create Work Order" is a separate action (not a TT_TRANSITIONS entry)
// since it also creates a brand-new work_orders row.
import { Router } from 'express';
import { pool } from '../db.js';
import { scopeRegion } from '../auth.js';
import { authorizeModule } from '../permissions.js';
import { getHistory, WorkflowError, sendError } from '../workflow.js';
import { placeholderTicketNo, finalizeTicketNo } from '../ticketNumbers.js';
import { createWorkOrderTx } from '../workOrderCreation.js';
import { alertEngineerAssigned, alertHighCritical } from '../smsAlerts.js';

const router = Router();

const TT_TRANSITIONS = {
  complete: { from: ['OPEN'], to: 'COMPLETED', requiresUpdate: true },
  cancel:   { from: ['OPEN'], to: 'CANCELLED' },
  close:    { from: ['COMPLETED', 'CANCELLED'], to: 'CLOSED' },
};

const SELECT = `
  SELECT t.id, t.tt_no, t.title, t.description, t.priority, t.status,
         t.site_id, t.site_code, t.site_name, t.region_id, t.region_name, t.site_location, t.site_priority,
         t.asset_id, a.name AS asset_name, a.tag AS asset_tag, t.category,
         t.fault_occurred_at, t.fault_resolved_at,
         t.created_by, cu.full_name AS created_by_name,
         t.created_at, t.closed_at, t.closed_by, bu.full_name AS closed_by_name,
         t.work_order_id, w.wo_no, w.status AS wo_status
  FROM trouble_tickets t
  LEFT JOIN assets a ON a.id = t.asset_id
  JOIN users cu ON cu.id = t.created_by
  LEFT JOIN users bu ON bu.id = t.closed_by
  LEFT JOIN work_orders w ON w.id = t.work_order_id
`;

router.get('/', async (req, res) => {
  const region = scopeRegion(req);
  const where = []; const params = [];
  if (region) { where.push('t.region_id = ?'); params.push(region); }
  if (req.query.status) { where.push('t.status = ?'); params.push(req.query.status); }
  if (req.query.site) { where.push('t.site_id = ?'); params.push(req.query.site); }
  if (req.query.q) { where.push('(t.title LIKE ? OR t.tt_no LIKE ? OR t.site_name LIKE ? OR t.site_code LIKE ?)'); params.push(`%${req.query.q}%`, `%${req.query.q}%`, `%${req.query.q}%`, `%${req.query.q}%`); }
  const sql = `${SELECT} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY t.created_at DESC`;
  const [rows] = await pool.query(sql, params);
  res.json(rows.map(shape));
});

router.get('/:id', async (req, res) => {
  const [rows] = await pool.query(`${SELECT} WHERE t.id = ?`, [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Trouble ticket not found' });
  const history = await getHistory('trouble_ticket', req.params.id);
  res.json({ ...shape(rows[0]), history });
});

router.post('/', authorizeModule('trouble_tickets', 'manage'), async (req, res) => {
  const b = req.body || {};
  if (!b.siteId || !b.title || !b.description || !b.faultOccurredAt) {
    return res.status(400).json({ error: 'siteId, title, description and faultOccurredAt are required' });
  }
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[site]] = await conn.query(
      `SELECT s.id, s.site_code, s.name, s.region_id, r.name AS region_name, s.location, s.priority
       FROM sites s JOIN regions r ON r.id = s.region_id WHERE s.id = ?`, [b.siteId]
    );
    if (!site) throw new WorkflowError('Site not found', 404);

    const [r] = await conn.query(
      `INSERT INTO trouble_tickets
         (tt_no, site_id, site_code, site_name, region_id, region_name, site_location, site_priority,
          asset_id, category, fault_occurred_at, title, description, priority, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [placeholderTicketNo(), site.id, site.site_code, site.name, site.region_id, site.region_name, site.location, site.priority,
       b.assetId || null, b.category || null, b.faultOccurredAt, b.title, b.description, b.priority || 'Medium', req.user.id]
    );
    const ttId = r.insertId;
    const ttNo = await finalizeTicketNo(conn, 'trouble_tickets', 'tt_no', 'TT', ttId);

    await conn.query(
      `INSERT INTO ticket_history (entity_type, entity_id, from_status, to_status, action, actor_id, note) VALUES ('trouble_ticket', ?, NULL, 'OPEN', 'Create', ?, ?)`,
      [ttId, req.user.id, 'Trouble ticket raised.']
    );
    await conn.commit();
    res.status(201).json({ id: ttId, ttNo });
  } catch (e) {
    await conn.rollback();
    sendError(res, e);
  } finally {
    conn.release();
  }
});

// Update, Complete, Cancel, Close   same idea as the Work Order engine's
// addUpdate/applyTransition, just against the TT's own small status set.
router.post('/:id/actions/:action', authorizeModule('trouble_tickets', 'manage'), async (req, res) => {
  const { action } = req.params;
  const note = req.body?.note;
  if (!note || !note.trim()) return res.status(400).json({ error: 'A note is required' });
  if (action === 'complete' && !req.body?.faultResolvedAt) return res.status(400).json({ error: 'faultResolvedAt is required to complete a trouble ticket' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[t]] = await conn.query('SELECT id, status, region_id, work_order_id FROM trouble_tickets WHERE id = ? FOR UPDATE', [req.params.id]);
    if (!t) throw new WorkflowError('Trouble ticket not found', 404);

    if (action === 'update') {
      if (t.status !== 'OPEN') throw new WorkflowError(`Cannot add an update to a trouble ticket in status ${t.status}`, 409);
      const [hist] = await conn.query(
        `INSERT INTO ticket_history (entity_type, entity_id, from_status, to_status, action, actor_id, note) VALUES ('trouble_ticket', ?, ?, ?, 'update', ?, ?)`,
        [t.id, t.status, t.status, req.user.id, note.trim()]
      );
      await conn.commit();
      return res.json({ status: t.status, historyId: hist.insertId });
    }

    const rule = TT_TRANSITIONS[action];
    if (!rule) throw new WorkflowError(`Unknown action "${action}"`, 400);
    if (!rule.from.includes(t.status)) throw new WorkflowError(`Cannot ${action} a trouble ticket in status ${t.status}`, 409);
    if (action === 'close' && req.user.role !== 'Administrator' && (req.user.role !== 'Supervisor' || Number(req.user.regionId) !== Number(t.region_id))) {
      throw new WorkflowError('Only that region\'s supervisor can close this trouble ticket', 403);
    }
    if (rule.requiresUpdate) {
      const [[{ c }]] = await conn.query(`SELECT COUNT(*) c FROM ticket_history WHERE entity_type = 'trouble_ticket' AND entity_id = ? AND action = 'update'`, [t.id]);
      if (!c) throw new WorkflowError('This trouble ticket must be updated at least once before it can be completed', 409);
    }
    // Once a trouble ticket has been converted, it is no longer the
    // record of what's actually happening   its work order is. Only once
    // that work order itself reaches a terminal state can this ticket
    // also be completed/cancelled and, from there, closed.
    if ((action === 'complete' || action === 'cancel') && t.work_order_id) {
      const [[wo]] = await conn.query('SELECT status FROM work_orders WHERE id = ?', [t.work_order_id]);
      if (!wo || !['CO', 'CL', 'CA'].includes(wo.status)) {
        throw new WorkflowError('This trouble ticket\'s work order must be completed, closed or cancelled before this ticket can be completed or cancelled', 409);
      }
    }

    const sets = ['status = ?']; const params = [rule.to];
    if (rule.to === 'CLOSED') { sets.push('closed_at = NOW()', 'closed_by = ?'); params.push(req.user.id); }
    if (action === 'complete') { sets.push('fault_resolved_at = ?'); params.push(req.body.faultResolvedAt); }
    params.push(t.id);
    await conn.query(`UPDATE trouble_tickets SET ${sets.join(', ')} WHERE id = ?`, params);

    const [hist] = await conn.query(
      `INSERT INTO ticket_history (entity_type, entity_id, from_status, to_status, action, actor_id, note) VALUES ('trouble_ticket', ?, ?, ?, ?, ?, ?)`,
      [t.id, t.status, rule.to, action, req.user.id, note.trim()]
    );
    await conn.commit();
    res.json({ status: rule.to, historyId: hist.insertId });
  } catch (e) {
    await conn.rollback();
    sendError(res, e);
  } finally {
    conn.release();
  }
});

router.post('/:id/create-work-order', authorizeModule('trouble_tickets', 'manage'), async (req, res) => {
  const b = req.body || {};
  if (!b.woType || !['CM', 'PM', 'PLM'].includes(b.woType)) return res.status(400).json({ error: 'A valid woType (CM, PM or PLM) is required' });
  if (!b.engineerId) return res.status(400).json({ error: 'An assigned engineer is required to create a work order' });
  if (b.woType === 'PM' && !b.nextDue) return res.status(400).json({ error: 'nextDue is required for Preventive Maintenance' });
  if (b.woType === 'PLM' && !b.plannedDate) return res.status(400).json({ error: 'plannedDate is required for Planned Maintenance' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[t]] = await conn.query('SELECT * FROM trouble_tickets WHERE id = ? FOR UPDATE', [req.params.id]);
    if (!t) throw new WorkflowError('Trouble ticket not found', 404);
    if (t.status !== 'OPEN') throw new WorkflowError(`Cannot create a work order from a trouble ticket in status ${t.status}`, 409);
    if (t.work_order_id) throw new WorkflowError('This trouble ticket has already been converted to a work order', 409);
    const [[{ c }]] = await conn.query(`SELECT COUNT(*) c FROM ticket_history WHERE entity_type = 'trouble_ticket' AND entity_id = ? AND action = 'update'`, [t.id]);
    if (!c) throw new WorkflowError('This trouble ticket must be updated at least once before a work order can be created from it', 409);

    const { id: woId, woNo } = await createWorkOrderTx(conn, {
      woType: b.woType,
      site: { id: t.site_id, site_code: t.site_code, name: t.site_name, region_id: t.region_id, region_name: t.region_name, location: t.site_location, priority: t.site_priority },
      assetId: t.asset_id, title: t.title, description: t.description, priority: t.priority,
      nextDue: b.nextDue, plannedDate: b.plannedDate,
      createdBy: req.user.id, engineerId: b.engineerId,
    });

    // The trouble ticket stays OPEN   it isn't the end of its story. It
    // can still be updated, and can only be completed/cancelled (and from
    // there closed) once this new work order itself reaches a terminal
    // state.
    await conn.query(`UPDATE trouble_tickets SET work_order_id = ? WHERE id = ?`, [woId, t.id]);
    await conn.query(
      `INSERT INTO ticket_history (entity_type, entity_id, from_status, to_status, action, actor_id, note) VALUES ('trouble_ticket', ?, 'OPEN', 'OPEN', 'create_wo', ?, ?)`,
      [t.id, req.user.id, `Work order ${woNo} created from this trouble ticket.`]
    );
    await conn.commit();
    res.status(201).json({ id: woId, woNo, ttId: t.id });

    alertEngineerAssigned({ id: woId, woNo, title: t.title, engineerId: b.engineerId });
    alertHighCritical({ id: woId, woNo, title: t.title, priority: t.priority, regionId: t.region_id, siteName: t.site_name });
  } catch (e) {
    await conn.rollback();
    sendError(res, e);
  } finally {
    conn.release();
  }
});

function shape(t) {
  return {
    id: t.id, ttNo: t.tt_no, title: t.title, description: t.description, priority: t.priority, status: t.status,
    siteId: t.site_id, siteCode: t.site_code, siteName: t.site_name,
    regionId: t.region_id, regionName: t.region_name, siteLocation: t.site_location, sitePriority: t.site_priority,
    assetId: t.asset_id, assetName: t.asset_name, assetTag: t.asset_tag, category: t.category,
    faultOccurredAt: t.fault_occurred_at, faultResolvedAt: t.fault_resolved_at,
    createdBy: t.created_by, createdByName: t.created_by_name, createdAt: t.created_at,
    closedAt: t.closed_at, closedBy: t.closed_by, closedByName: t.closed_by_name,
    workOrderId: t.work_order_id, woNo: t.wo_no, woStatus: t.wo_status,
  };
}

export default router;
