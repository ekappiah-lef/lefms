import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import { signToken, authenticate } from '../auth.js';
import { getRolePermissions } from '../permissions.js';

const router = Router();

// Brute-force protection: after MAX_ATTEMPTS wrong passwords in a row,
// the account is locked for LOCK_MINUTES. The counter resets on any
// successful login. This is per-account (not per-IP   that's handled
// separately by the rate limiter on this route in index.js), so a
// distributed attack targeting one account is still slowed down.
const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.staff_no, u.full_name, u.email, u.password_hash, u.is_active,
              u.failed_login_attempts, u.locked_until,
              r.id AS role_id, r.name AS role, u.region_id, rg.name AS region_name
       FROM users u JOIN roles r ON r.id = u.role_id
       LEFT JOIN regions rg ON rg.id = u.region_id
       WHERE u.email = ?`, [email.trim().toLowerCase()]
    );
    const user = rows[0];
    if (!user || !user.is_active) return res.status(401).json({ error: 'Invalid email or password' });

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const minutesLeft = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
      return res.status(429).json({ error: `Too many failed attempts. Try again in ${minutesLeft} minute${minutesLeft === 1 ? '' : 's'}.` });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      const attempts = user.failed_login_attempts + 1;
      if (attempts >= MAX_ATTEMPTS) {
        await pool.query('UPDATE users SET failed_login_attempts = ?, locked_until = DATE_ADD(NOW(), INTERVAL ? MINUTE) WHERE id = ?', [attempts, LOCK_MINUTES, user.id]);
        return res.status(429).json({ error: `Too many failed attempts. This account is locked for ${LOCK_MINUTES} minutes.` });
      }
      await pool.query('UPDATE users SET failed_login_attempts = ? WHERE id = ?', [attempts, user.id]);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    await pool.query('UPDATE users SET last_login_at = NOW(), failed_login_attempts = 0, locked_until = NULL WHERE id = ?', [user.id]);
    const token = signToken({ id: user.id, staff_no: user.staff_no, full_name: user.full_name, role: user.role, role_id: user.role_id, region_id: user.region_id });
    const permissions = await getRolePermissions(user.role_id);
    res.json({
      token,
      user: {
        id: user.id, staffNo: user.staff_no, fullName: user.full_name, email: user.email,
        role: user.role, roleId: user.role_id, regionId: user.region_id, regionName: user.region_name, permissions,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Unexpected server error' });
  }
});

router.get('/me', authenticate, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT u.id, u.staff_no, u.full_name, u.email, r.id AS role_id, r.name AS role, u.region_id, rg.name AS region_name
     FROM users u JOIN roles r ON r.id = u.role_id LEFT JOIN regions rg ON rg.id = u.region_id
     WHERE u.id = ?`, [req.user.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  const u = rows[0];
  const permissions = await getRolePermissions(u.role_id);
  res.json({ id: u.id, staffNo: u.staff_no, fullName: u.full_name, email: u.email, role: u.role, roleId: u.role_id, regionId: u.region_id, regionName: u.region_name, permissions });
});

export default router;
