import { Router } from 'express';
import { pool } from '../db.js';
import { authorize, scopeRegion } from '../auth.js';
import { applyTransition, addUpdate, reassignEngineer, getHistory, WorkflowError } from '../workflow.js';
import { createWorkOrderTx } from '../workOrderCreation.js';
import { alertEngineerAssigned, alertHighCritical } from '../smsAlerts.js';

const router = Router();

const SELECT = `
  SELECT w.id, w.wo_no, w.wo_type, w.title, w.description, w.priority, w.status,
         w.site_id, w.site_code, w.site_name, w.region_id, w.region_name, w.site_location, w.site_priority,
         w.asset_id, a.name AS asset_name, a.tag AS asset_tag,
         w.frequency, w.next_due, w.last_done, w.planned_date,
         w.created_by, cu.full_name AS created_by_name,
         w.engineer_id, eu.full_name AS engineer_name,
         w.created_at, w.accepted_at, w.completed_at, w.cancelled_at, w.closed_at, w.rejected_at,
         eh.id AS ehs_id, eh.ehs_no, eh.status AS ehs_status, eh.outcome AS ehs_outcome
  FROM work_orders w
  LEFT JOIN assets a ON a.id = w.asset_id
  JOIN users cu ON cu.id = w.created_by
  JOIN users eu ON eu.id = w.engineer_id
  LEFT JOIN ehs_records eh ON eh.work_order_id = w.id
`;

router.get('/', async (req, res) => {
  const region = scopeRegion(req);
  const where = []; const params = [];
  if (region) { where.push('w.region_id = ?'); params.push(region); }
  if (req.query.type) { where.push('w.wo_type = ?'); params.push(req.query.type); }
  if (req.query.site) { where.push('w.site_id = ?'); params.push(req.query.site); }
  if (req.query.status) { where.push('w.status = ?'); params.push(req.query.status); }
  if (req.query.priority) { where.push('w.priority = ?'); params.push(req.query.priority); }
  if (req.query.mine === 'true') { where.push('w.engineer_id = ?'); params.push(req.user.id); }
  if (req.query.engineer) { where.push('w.engineer_id = ?'); params.push(req.query.engineer); }
  if (req.query.from) { where.push('w.created_at >= ?'); params.push(req.query.from); }
  if (req.query.to) { where.push('w.created_at <= ?'); params.push(req.query.to); }
  if (req.query.q) { where.push('(w.title LIKE ? OR w.wo_no LIKE ? OR w.site_name LIKE ? OR w.site_code LIKE ?)'); params.push(`%${req.query.q}%`, `%${req.query.q}%`, `%${req.query.q}%`, `%${req.query.q}%`); }
  const sql = `${SELECT} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY w.created_at DESC`;
  const [rows] = await pool.query(sql, params);
  res.json(rows.map(shape));
});

router.get('/:id', async (req, res) => {
  const [rows] = await pool.query(`${SELECT} WHERE w.id = ?`, [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Work order not found' });
  const checklist = rows[0].wo_type === 'PM'
    ? (await pool.query('SELECT id, task, response FROM work_order_checklist WHERE work_order_id = ?', [req.params.id]))[0]
    : [];
  const [spareRequestRows] = await pool.query(
    `SELECT id, request_no, status, created_at FROM spare_requests WHERE work_order_id = ? ORDER BY created_at DESC`, [req.params.id]
  );
  const spareRequests = spareRequestRows.map((r) => ({ id: r.id, requestNo: r.request_no, status: r.status, createdAt: r.created_at }));
  const history = await getHistory('work_order', req.params.id);
  res.json({ ...shape(rows[0]), checklist, spareRequests, history });
});

router.post('/', authorize('Supervisor', 'Engineer', 'Administrator'), async (req, res) => {
  const b = req.body || {};
  if (!b.woType || !['CM', 'PM', 'PLM'].includes(b.woType)) return res.status(400).json({ error: 'A valid woType (CM, PM or PLM) is required' });
  if (!b.siteId || !b.title || !b.description || !b.engineerId) {
    return res.status(400).json({ error: 'siteId, title, description and engineerId are required' });
  }
  if (b.woType === 'PM' && !b.nextDue) return res.status(400).json({ error: 'nextDue is required for Preventive Maintenance' });
  if (b.woType === 'PLM' && !b.plannedDate) return res.status(400).json({ error: 'plannedDate is required for Planned Maintenance' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[site]] = await conn.query(
      `SELECT s.id, s.site_code, s.name, s.region_id, r.name AS region_name, s.location, s.priority
       FROM sites s JOIN regions r ON r.id = s.region_id WHERE s.id = ?`, [b.siteId]
    );
    if (!site) throw new WorkflowError('Site not found', 404);

    const { id: woId, woNo } = await createWorkOrderTx(conn, {
      woType: b.woType, site, assetId: b.assetId, title: b.title, description: b.description, priority: b.priority,
      frequency: b.frequency, nextDue: b.nextDue, lastDone: b.lastDone, plannedDate: b.plannedDate,
      createdBy: req.user.id, engineerId: b.engineerId,
    });
    await conn.commit();
    res.status(201).json({ id: woId, woNo });

    // Fire-and-forget: an SMS provider outage must never fail WO creation,
    // so these run after the response is already sent, outside the txn.
    const priority = b.priority || 'Medium';
    alertEngineerAssigned({ id: woId, woNo, title: b.title, engineerId: b.engineerId });
    alertHighCritical({ id: woId, woNo, title: b.title, priority, regionId: site.region_id, siteName: site.name });
  } catch (e) {
    await conn.rollback();
    res.status(e instanceof WorkflowError ? e.status : 500).json({ error: e.message });
  } finally {
    conn.release();
  }
});

router.post('/:id/actions/:action', async (req, res) => {
  try {
    const { action } = req.params;
    let result;
    if (action === 'update') result = await addUpdate('work_order', req.params.id, req.user, req.body?.note);
    else if (action === 'reassign') result = await reassignEngineer('work_order', req.params.id, req.user, req.body?.newEngineerId, req.body?.note);
    else result = await applyTransition('work_order', req.params.id, action, req.user, req.body?.note, { newEngineerId: req.body?.newEngineerId, checklistResponses: req.body?.checklistResponses });
    res.json(result);
  } catch (e) {
    res.status(e instanceof WorkflowError ? e.status : 500).json({ error: e.message });
  }
});

router.post('/:id/comments', async (req, res) => {
  if (!req.body?.body?.trim()) return res.status(400).json({ error: 'Comment body is required' });
  const [r] = await pool.query('INSERT INTO work_order_comments (work_order_id, author_id, body) VALUES (?, ?, ?)', [req.params.id, req.user.id, req.body.body.trim()]);
  res.status(201).json({ id: r.insertId });
});

router.delete('/:id', authorize('Administrator'), async (req, res) => {
  const [rows] = await pool.query('SELECT status FROM work_orders WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  if (rows[0].status !== 'CR') return res.status(409).json({ error: 'Only a ticket still in Created status can be deleted   cancel or close it instead.' });
  await pool.query('DELETE FROM work_orders WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

function shape(w) {
  return {
    id: w.id, woNo: w.wo_no, woType: w.wo_type, title: w.title, description: w.description, priority: w.priority, status: w.status,
    siteId: w.site_id, siteCode: w.site_code, siteName: w.site_name,
    regionId: w.region_id, regionName: w.region_name, siteLocation: w.site_location, sitePriority: w.site_priority,
    assetId: w.asset_id, assetName: w.asset_name, assetTag: w.asset_tag,
    frequency: w.frequency, nextDue: w.next_due, lastDone: w.last_done, plannedDate: w.planned_date,
    createdBy: w.created_by, createdByName: w.created_by_name,
    engineerId: w.engineer_id, engineerName: w.engineer_name,
    createdAt: w.created_at, acceptedAt: w.accepted_at, completedAt: w.completed_at,
    cancelledAt: w.cancelled_at, closedAt: w.closed_at, rejectedAt: w.rejected_at,
    ehsId: w.ehs_id, ehsNo: w.ehs_no, ehsStatus: w.ehs_status, ehsOutcome: w.ehs_outcome,
  };
}

export default router;
