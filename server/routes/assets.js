import { Router } from 'express';
import { pool } from '../db.js';
import { authorize } from '../auth.js';
import { authorizeModule } from '../permissions.js';
import { sendError } from '../workflow.js';

const router = Router();

const SELECT = `
  SELECT a.id, a.tag, a.name, a.category, a.site_id, s.name AS site_name, s.site_code,
         a.manufacturer, a.model, a.serial_no,
         a.calibration_due_date, a.warranty_expiry, a.status, a.created_at
  FROM assets a JOIN sites s ON s.id = a.site_id
`;

router.get('/', async (req, res) => {
  const where = []; const params = [];
  if (req.query.site) { where.push('a.site_id = ?'); params.push(req.query.site); }
  if (req.query.status) { where.push('a.status = ?'); params.push(req.query.status); }
  if (req.query.q) { where.push('(a.name LIKE ? OR a.tag LIKE ?)'); params.push(`%${req.query.q}%`, `%${req.query.q}%`); }
  const sql = `${SELECT} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY s.name, a.name`;
  const [rows] = await pool.query(sql, params);
  res.json(rows.map(shape));
});

router.get('/:id', async (req, res) => {
  const [rows] = await pool.query(`${SELECT} WHERE a.id = ?`, [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Asset not found' });
  res.json(shape(rows[0]));
});

router.post('/', authorizeModule('assets', 'manage'), async (req, res) => {
  const b = req.body || {};
  if (!b.tag || !b.name || !b.category || !b.siteId) return res.status(400).json({ error: 'tag, name, category and siteId are required' });
  try {
    const [r] = await pool.query(
      `INSERT INTO assets (tag, name, category, site_id, manufacturer, model, serial_no, calibration_due_date, warranty_expiry, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [b.tag, b.name, b.category, b.siteId, b.manufacturer || null, b.model || null, b.serialNo || null, b.calibrationDueDate || null, b.warrantyExpiry || null, b.status || 'Operational']
    );
    res.status(201).json({ id: r.insertId });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Asset tag already exists' });
    sendError(res, e);
  }
});

router.put('/:id', authorizeModule('assets', 'manage'), async (req, res) => {
  const b = req.body || {};
  const fields = { name: b.name, category: b.category, site_id: b.siteId, manufacturer: b.manufacturer, model: b.model, serial_no: b.serialNo, calibration_due_date: b.calibrationDueDate, warranty_expiry: b.warrantyExpiry, status: b.status };
  const sets = []; const params = [];
  for (const [col, val] of Object.entries(fields)) { if (val !== undefined) { sets.push(`${col} = ?`); params.push(val); } }
  if (!sets.length) return res.status(400).json({ error: 'No fields to update' });
  params.push(req.params.id);
  await pool.query(`UPDATE assets SET ${sets.join(', ')} WHERE id = ?`, params);
  res.json({ ok: true });
});

router.delete('/:id', authorize('Administrator'), async (req, res) => {
  try {
    await pool.query('DELETE FROM assets WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    if (e.code?.startsWith('ER_ROW_IS_REFERENCED')) return res.status(409).json({ error: 'This asset has tickets on record   retire it instead of deleting.' });
    sendError(res, e);
  }
});

function shape(a) {
  return {
    id: a.id, tag: a.tag, name: a.name, category: a.category,
    siteId: a.site_id, siteName: a.site_name, siteCode: a.site_code,
    manufacturer: a.manufacturer, model: a.model, serialNo: a.serial_no,
    calibrationDueDate: a.calibration_due_date, warrantyExpiry: a.warranty_expiry,
    status: a.status, createdAt: a.created_at,
  };
}

export default router;
