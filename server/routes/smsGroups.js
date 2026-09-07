// SMS Groups: a name + a list of phone numbers. Used as the recipient
// list for SMS Config rules (High/Critical work orders, pending 10+ days).
import { Router } from 'express';
import { pool } from '../db.js';
import { authorize } from '../auth.js';

const router = Router();

router.use(authorize('Administrator'));

router.get('/', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT g.id, g.name, g.created_at, COUNT(m.id) AS member_count
     FROM sms_groups g LEFT JOIN sms_group_members m ON m.group_id = g.id
     GROUP BY g.id, g.name, g.created_at ORDER BY g.name`
  );
  res.json(rows.map((r) => ({ id: r.id, name: r.name, createdAt: r.created_at, memberCount: r.member_count })));
});

router.get('/:id', async (req, res) => {
  const [[group]] = await pool.query('SELECT id, name, created_at FROM sms_groups WHERE id = ?', [req.params.id]);
  if (!group) return res.status(404).json({ error: 'Group not found' });
  const [members] = await pool.query('SELECT id, name, phone FROM sms_group_members WHERE group_id = ? ORDER BY name', [req.params.id]);
  res.json({ id: group.id, name: group.name, createdAt: group.created_at, members });
});

router.post('/', async (req, res) => {
  const name = (req.body?.name || '').trim();
  if (!name) return res.status(400).json({ error: 'A group name is required' });
  const [r] = await pool.query('INSERT INTO sms_groups (name) VALUES (?)', [name]);
  res.status(201).json({ id: r.insertId });
});

router.put('/:id', async (req, res) => {
  const name = (req.body?.name || '').trim();
  if (!name) return res.status(400).json({ error: 'A group name is required' });
  await pool.query('UPDATE sms_groups SET name = ? WHERE id = ?', [name, req.params.id]);
  res.json({ ok: true });
});

router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM sms_groups WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

router.post('/:id/members', async (req, res) => {
  const name = (req.body?.name || '').trim();
  const phone = (req.body?.phone || '').trim();
  if (!name || !phone) return res.status(400).json({ error: 'Both name and phone are required' });
  const [r] = await pool.query('INSERT INTO sms_group_members (group_id, name, phone) VALUES (?, ?, ?)', [req.params.id, name, phone]);
  res.status(201).json({ id: r.insertId });
});

router.put('/members/:memberId', async (req, res) => {
  const name = (req.body?.name || '').trim();
  const phone = (req.body?.phone || '').trim();
  if (!name || !phone) return res.status(400).json({ error: 'Both name and phone are required' });
  await pool.query('UPDATE sms_group_members SET name = ?, phone = ? WHERE id = ?', [name, phone, req.params.memberId]);
  res.json({ ok: true });
});

router.delete('/members/:memberId', async (req, res) => {
  await pool.query('DELETE FROM sms_group_members WHERE id = ?', [req.params.memberId]);
  res.json({ ok: true });
});

export default router;
