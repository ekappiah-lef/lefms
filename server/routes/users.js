import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import { authorize } from '../auth.js';
import { passwordError } from '../passwordPolicy.js';
import { sendError } from '../workflow.js';

const BCRYPT_ROUNDS = 12;

const router = Router();

const SELECT = `
  SELECT u.id, u.staff_no, u.full_name, u.email, u.phone, u.is_active, u.last_login_at, u.created_at,
         r.id AS role_id, r.name AS role, u.region_id, rg.name AS region_name
  FROM users u JOIN roles r ON r.id = u.role_id LEFT JOIN regions rg ON rg.id = u.region_id
`;

// Assignable-engineer dropdown for the create-ticket / site-assignment
// forms   any authenticated staff can read this. "Engineer" here means
// any role that can manage Work Orders (the built-in Engineer role, or a
// custom one like "NOC Engineer"), not just the literal role name.
router.get('/engineers', async (req, res) => {
  const [rows] = await pool.query(
    `${SELECT} WHERE u.is_active = 1 AND EXISTS (
       SELECT 1 FROM role_permissions rp WHERE rp.role_id = u.role_id AND rp.module = 'work_orders' AND rp.level = 'manage'
     ) ORDER BY u.full_name`
  );
  res.json(rows.map(shape));
});

router.get('/', authorize('Administrator'), async (req, res) => {
  const [rows] = await pool.query(`${SELECT} ORDER BY r.name, u.full_name`);
  res.json(rows.map(shape));
});

router.post('/', authorize('Administrator'), async (req, res) => {
  const { staffNo, fullName, email, phone, password, roleId, regionId } = req.body || {};
  if (!staffNo || !fullName || !email || !password || !roleId) return res.status(400).json({ error: 'staffNo, fullName, email, password and roleId are required' });
  const pwErr = passwordError(password);
  if (pwErr) return res.status(400).json({ error: pwErr });
  try {
    const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const [r] = await pool.query(
      'INSERT INTO users (staff_no, full_name, email, phone, password_hash, role_id, region_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [staffNo, fullName, email.trim().toLowerCase(), phone || null, hash, roleId, regionId || null]
    );
    res.status(201).json({ id: r.insertId });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Staff number or email already in use' });
    sendError(res, e);
  }
});

router.put('/:id', authorize('Administrator'), async (req, res) => {
  const { fullName, email, phone, roleId, regionId, isActive, password } = req.body || {};
  const sets = []; const params = [];
  if (fullName !== undefined) { sets.push('full_name = ?'); params.push(fullName); }
  if (email !== undefined) { sets.push('email = ?'); params.push(email.trim().toLowerCase()); }
  if (phone !== undefined) { sets.push('phone = ?'); params.push(phone); }
  if (roleId !== undefined) { sets.push('role_id = ?'); params.push(roleId); }
  if (regionId !== undefined) { sets.push('region_id = ?'); params.push(regionId || null); }
  if (isActive !== undefined) { sets.push('is_active = ?'); params.push(isActive ? 1 : 0); }
  if (password) {
    const pwErr = passwordError(password);
    if (pwErr) return res.status(400).json({ error: pwErr });
    sets.push('password_hash = ?'); params.push(await bcrypt.hash(password, BCRYPT_ROUNDS));
  }
  if (!sets.length) return res.status(400).json({ error: 'No fields to update' });
  params.push(req.params.id);
  try {
    await pool.query(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, params);
    res.json({ ok: true });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email already in use' });
    sendError(res, e);
  }
});

router.delete('/:id', authorize('Administrator'), async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    if (e.code === 'ER_ROW_IS_REFERENCED_2' || e.code === 'ER_ROW_IS_REFERENCED') {
      return res.status(409).json({ error: 'This user has tickets on record   deactivate them instead of deleting.' });
    }
    sendError(res, e);
  }
});

function shape(u) {
  return {
    id: u.id, staffNo: u.staff_no, fullName: u.full_name, email: u.email, phone: u.phone,
    isActive: !!u.is_active, lastLoginAt: u.last_login_at, createdAt: u.created_at,
    roleId: u.role_id, role: u.role, regionId: u.region_id, regionName: u.region_name,
  };
}

export default router;
