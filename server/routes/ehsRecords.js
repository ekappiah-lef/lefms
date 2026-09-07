import { Router } from 'express';
import { pool } from '../db.js';
import { scopeRegion } from '../auth.js';
import { submitEhs, reviewEhs } from '../ehsWorkflow.js';
import { getHistory, WorkflowError } from '../workflow.js';

const router = Router();

const SELECT = `
  SELECT eh.id, eh.ehs_no, eh.status, eh.outcome, eh.submitted_at, eh.reviewed_at, eh.review_note, eh.created_at,
         su.full_name AS submitted_by_name, ru.full_name AS reviewed_by_name,
         w.id AS work_order_id, w.wo_no, w.wo_type, w.title AS wo_title,
         w.site_id, w.site_code, w.site_name, w.region_id, w.region_name,
         w.engineer_id, eu.full_name AS engineer_name
  FROM ehs_records eh
  JOIN work_orders w ON w.id = eh.work_order_id
  JOIN users eu ON eu.id = w.engineer_id
  LEFT JOIN users su ON su.id = eh.submitted_by
  LEFT JOIN users ru ON ru.id = eh.reviewed_by
`;

router.get('/', async (req, res) => {
  const region = scopeRegion(req);
  const where = []; const params = [];
  if (region) { where.push('w.region_id = ?'); params.push(region); }
  if (req.query.status) { where.push('eh.status = ?'); params.push(req.query.status); }
  if (req.query.site) { where.push('w.site_id = ?'); params.push(req.query.site); }
  if (req.query.engineer) { where.push('w.engineer_id = ?'); params.push(req.query.engineer); }
  if (req.query.type) { where.push('w.wo_type = ?'); params.push(req.query.type); }
  // An Engineer only sees their own work orders' EHS records; every
  // other role's visibility is governed by scopeRegion (or none, for
  // EHS User/Admin/MS User which are global).
  if (req.user.role === 'Engineer') { where.push('w.engineer_id = ?'); params.push(req.user.id); }
  const sql = `${SELECT} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY eh.created_at DESC`;
  const [rows] = await pool.query(sql, params);
  res.json(rows.map(shape));
});

router.get('/:id', async (req, res) => {
  const [rows] = await pool.query(`${SELECT} WHERE eh.id = ?`, [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'EHS record not found' });
  const [checklist] = await pool.query('SELECT id, question, response FROM ehs_checklist WHERE ehs_record_id = ? ORDER BY id', [req.params.id]);
  const history = await getHistory('ehs_record', req.params.id);
  res.json({ ...shape(rows[0]), checklist, history });
});

router.post('/:id/actions/submit', async (req, res) => {
  try {
    const result = await submitEhs(req.params.id, req.user, req.body?.note, req.body?.checklistResponses);
    res.json(result);
  } catch (e) {
    res.status(e instanceof WorkflowError ? e.status : 500).json({ error: e.message });
  }
});

router.post('/:id/actions/review', async (req, res) => {
  try {
    const result = await reviewEhs(req.params.id, req.user, req.body?.note, req.body?.outcome);
    res.json(result);
  } catch (e) {
    res.status(e instanceof WorkflowError ? e.status : 500).json({ error: e.message });
  }
});

function shape(e) {
  return {
    id: e.id, ehsNo: e.ehs_no, status: e.status, outcome: e.outcome,
    submittedAt: e.submitted_at, submittedByName: e.submitted_by_name,
    reviewedAt: e.reviewed_at, reviewedByName: e.reviewed_by_name, reviewNote: e.review_note,
    createdAt: e.created_at,
    workOrderId: e.work_order_id, woNo: e.wo_no, woType: e.wo_type, woTitle: e.wo_title,
    siteId: e.site_id, siteCode: e.site_code, siteName: e.site_name,
    regionId: e.region_id, regionName: e.region_name,
    engineerId: e.engineer_id, engineerName: e.engineer_name,
  };
}

export default router;
