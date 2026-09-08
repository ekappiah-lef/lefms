// Roles: the 6 built-in roles (is_system = 1, name protected) plus any
// custom roles an Administrator creates (e.g. "NOC Engineer"). Every
// role's access to Trouble Tickets / Work Orders / the four report types
// / SMS is controlled by role_permissions (see permissions.js). Reading
// the role list (GET /) is open to any authenticated user   it drives
// the Role picker on the New/Edit User form. Everything else here
// (create/delete a role, edit its permissions) is Administrator-only.
import { Router } from 'express';
import { pool } from '../db.js';
import { authorize } from '../auth.js';
import { PERMISSION_MODULES, assertValidModule, getRolePermissions } from '../permissions.js';
import { sendError } from '../workflow.js';

const router = Router();

router.get('/', async (req, res) => {
  const [rows] = await pool.query('SELECT id, name, is_system FROM roles ORDER BY id');
  res.json(rows.map((r) => ({ id: r.id, name: r.name, isSystem: !!r.is_system })));
});

router.get('/modules', authorize('Administrator'), (req, res) => {
  res.json(PERMISSION_MODULES);
});

router.get('/:id/permissions', authorize('Administrator'), async (req, res) => {
  const permissions = await getRolePermissions(req.params.id);
  res.json(permissions);
});

router.post('/', authorize('Administrator'), async (req, res) => {
  const name = (req.body?.name || '').trim();
  if (!name) return res.status(400).json({ error: 'A role name is required' });
  try {
    const [r] = await pool.query('INSERT INTO roles (name, is_system) VALUES (?, 0)', [name]);
    res.status(201).json({ id: r.insertId, name, isSystem: false });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'A role with that name already exists' });
    sendError(res, e);
  }
});

// MS User is always read-only, no matter what an Administrator submits
// here   a second line of defence alongside the module set itself never
// including anything MS User couldn't already see under the old static
// role list.
router.put('/:id/permissions', authorize('Administrator'), async (req, res) => {
  const permissions = req.body?.permissions;
  if (!permissions || typeof permissions !== 'object') return res.status(400).json({ error: 'permissions object is required' });

  const [[role]] = await pool.query('SELECT id, name FROM roles WHERE id = ?', [req.params.id]);
  if (!role) return res.status(404).json({ error: 'Role not found' });

  const entries = [];
  for (const [module, level] of Object.entries(permissions)) {
    if (!level) continue; // falsy/null = no access to this module
    if (!assertValidModule(module)) return res.status(400).json({ error: `Unknown module "${module}"` });
    if (!['view', 'manage'].includes(level)) return res.status(400).json({ error: `Invalid level for "${module}"` });
    entries.push([role.id, module, role.name === 'MS User' ? 'view' : level]);
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM role_permissions WHERE role_id = ?', [role.id]);
    if (entries.length) {
      await conn.query('INSERT INTO role_permissions (role_id, module, level) VALUES ?', [entries]);
    }
    await conn.commit();
    res.json({ ok: true });
  } catch (e) {
    await conn.rollback();
    sendError(res, e);
  } finally {
    conn.release();
  }
});

router.delete('/:id', authorize('Administrator'), async (req, res) => {
  const [[role]] = await pool.query('SELECT id, is_system FROM roles WHERE id = ?', [req.params.id]);
  if (!role) return res.status(404).json({ error: 'Role not found' });
  if (role.is_system) return res.status(409).json({ error: 'Built-in roles cannot be deleted' });
  try {
    await pool.query('DELETE FROM roles WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    if (e.code === 'ER_ROW_IS_REFERENCED_2' || e.code === 'ER_ROW_IS_REFERENCED') {
      return res.status(409).json({ error: 'Users still have this role   reassign them before deleting it.' });
    }
    sendError(res, e);
  }
});

export default router;
