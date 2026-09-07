// Read-only reference lookups shared by every create/filter form.
import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

router.get('/roles', async (req, res) => {
  const [rows] = await pool.query('SELECT id, name FROM roles ORDER BY id');
  res.json(rows);
});

export default router;
