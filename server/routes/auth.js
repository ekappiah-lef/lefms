import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import { signToken, authenticate } from '../auth.js';

const router = Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.staff_no, u.full_name, u.email, u.password_hash, u.is_active,
              r.name AS role, u.region_id, rg.name AS region_name
       FROM users u JOIN roles r ON r.id = u.role_id
       LEFT JOIN regions rg ON rg.id = u.region_id
       WHERE u.email = ?`, [email.trim().toLowerCase()]
    );
    const user = rows[0];
    if (!user || !user.is_active) return res.status(401).json({ error: 'Invalid email or password' });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

    await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [user.id]);
    const token = signToken({ id: user.id, staff_no: user.staff_no, full_name: user.full_name, role: user.role, region_id: user.region_id });
    res.json({
      token,
      user: {
        id: user.id, staffNo: user.staff_no, fullName: user.full_name, email: user.email,
        role: user.role, regionId: user.region_id, regionName: user.region_name,
      },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/me', authenticate, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT u.id, u.staff_no, u.full_name, u.email, r.name AS role, u.region_id, rg.name AS region_name
     FROM users u JOIN roles r ON r.id = u.role_id LEFT JOIN regions rg ON rg.id = u.region_id
     WHERE u.id = ?`, [req.user.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  const u = rows[0];
  res.json({ id: u.id, staffNo: u.staff_no, fullName: u.full_name, email: u.email, role: u.role, regionId: u.region_id, regionName: u.region_name });
});

export default router;
