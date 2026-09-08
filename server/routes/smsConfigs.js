// SMS Config: which Group gets texted for which event, optionally scoped
// to one region (e.g. a group that only wants Greater Accra work orders).
import { Router } from 'express';
import { pool } from '../db.js';
import { authorizeModule } from '../permissions.js';

const router = Router();
const EVENT_TYPES = ['wo_high_critical', 'wo_pending'];

router.use((req, res, next) => authorizeModule('sms', req.method === 'GET' ? 'view' : 'manage')(req, res, next));

router.get('/', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT c.id, c.event_type, c.is_active, c.created_at,
            g.id AS group_id, g.name AS group_name,
            r.id AS region_id, r.name AS region_name
     FROM sms_configs c JOIN sms_groups g ON g.id = c.group_id
     LEFT JOIN regions r ON r.id = c.region_id
     ORDER BY c.event_type, g.name`
  );
  res.json(rows.map(shape));
});

router.post('/', async (req, res) => {
  const b = req.body || {};
  if (!EVENT_TYPES.includes(b.eventType)) return res.status(400).json({ error: `eventType must be one of ${EVENT_TYPES.join(', ')}` });
  if (!b.groupId) return res.status(400).json({ error: 'groupId is required' });
  const [r] = await pool.query(
    'INSERT INTO sms_configs (event_type, group_id, region_id, is_active) VALUES (?, ?, ?, ?)',
    [b.eventType, b.groupId, b.regionId || null, b.isActive === false ? 0 : 1]
  );
  res.status(201).json({ id: r.insertId });
});

router.put('/:id', async (req, res) => {
  const b = req.body || {};
  const sets = []; const params = [];
  if (b.eventType !== undefined) {
    if (!EVENT_TYPES.includes(b.eventType)) return res.status(400).json({ error: `eventType must be one of ${EVENT_TYPES.join(', ')}` });
    sets.push('event_type = ?'); params.push(b.eventType);
  }
  if (b.groupId !== undefined) { sets.push('group_id = ?'); params.push(b.groupId); }
  if (b.regionId !== undefined) { sets.push('region_id = ?'); params.push(b.regionId || null); }
  if (b.isActive !== undefined) { sets.push('is_active = ?'); params.push(b.isActive ? 1 : 0); }
  if (!sets.length) return res.status(400).json({ error: 'No fields to update' });
  params.push(req.params.id);
  await pool.query(`UPDATE sms_configs SET ${sets.join(', ')} WHERE id = ?`, params);
  res.json({ ok: true });
});

router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM sms_configs WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

function shape(r) {
  return {
    id: r.id, eventType: r.event_type, isActive: !!r.is_active, createdAt: r.created_at,
    groupId: r.group_id, groupName: r.group_name,
    regionId: r.region_id, regionName: r.region_name,
  };
}

export default router;
