import { Router } from 'express';
import { pool } from '../db.js';
import { authorize } from '../auth.js';

const router = Router();

router.get('/', async (req, res) => {
  const [rows] = await pool.query('SELECT id, name, code FROM regions ORDER BY name');
  res.json(rows);
});

router.post('/', authorize('Administrator'), async (req, res) => {
  const { name, code } = req.body || {};
  if (!name || !code) return res.status(400).json({ error: 'name and code are required' });
  try {
    const [r] = await pool.query('INSERT INTO regions (name, code) VALUES (?, ?)', [name, code.toUpperCase()]);
    res.status(201).json({ id: r.insertId });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Region name or code already exists' });
    res.status(500).json({ error: e.message });
  }
});

export default router;
