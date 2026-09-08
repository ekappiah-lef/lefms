// Admin/EHS-managed, global EHS checklist questions. Copied onto every
// new work order's linked EHS record at creation time (see workOrders.js
// POST /). The engineer answers these when submitting EHS for a job.
import { Router } from 'express';
import { pool } from '../db.js';
import { authorize } from '../auth.js';
import { authorizeModule } from '../permissions.js';

const router = Router();

router.get('/', async (req, res) => {
  const where = req.query.all === 'true' ? '' : 'WHERE is_active = 1';
  const [rows] = await pool.query(`SELECT id, question, sort_order, is_active FROM ehs_checklist_templates ${where} ORDER BY sort_order, id`);
  res.json(rows.map((r) => ({ id: r.id, question: r.question, sortOrder: r.sort_order, isActive: !!r.is_active })));
});

router.post('/', authorizeModule('ehs_checklist', 'manage'), async (req, res) => {
  const { question, sortOrder } = req.body || {};
  if (!question) return res.status(400).json({ error: 'question is required' });
  const [r] = await pool.query('INSERT INTO ehs_checklist_templates (question, sort_order) VALUES (?, ?)', [question, sortOrder || 0]);
  res.status(201).json({ id: r.insertId });
});

router.put('/:id', authorizeModule('ehs_checklist', 'manage'), async (req, res) => {
  const { question, sortOrder, isActive } = req.body || {};
  const sets = []; const params = [];
  if (question !== undefined) { sets.push('question = ?'); params.push(question); }
  if (sortOrder !== undefined) { sets.push('sort_order = ?'); params.push(sortOrder); }
  if (isActive !== undefined) { sets.push('is_active = ?'); params.push(isActive ? 1 : 0); }
  if (!sets.length) return res.status(400).json({ error: 'No fields to update' });
  params.push(req.params.id);
  await pool.query(`UPDATE ehs_checklist_templates SET ${sets.join(', ')} WHERE id = ?`, params);
  res.json({ ok: true });
});

router.delete('/:id', authorize('Administrator', 'EHS User'), async (req, res) => {
  await pool.query('DELETE FROM ehs_checklist_templates WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

export default router;
