// =====================================================================
// Dynamic, per-role module permissions (role_permissions table).
// Administrator is always a full-access bypass, never governed by this
// table. Every other role -- built-in or custom (e.g. "NOC Engineer") --
// is gated by rows here for: Trouble Tickets, Work Orders, the four
// report types, and SMS. EHS, Spare Parts, Site Database and the
// Users/Roles admin pages are NOT covered here -- they keep their
// original hardcoded role lists (see each route file).
//
// 'view' = can see/list. 'manage' = can create/act (create a ticket,
// accept/complete one assigned to them, edit an SMS Group/Config). A
// role with no row for a module has no access to it at all.
// =====================================================================
import { pool } from './db.js';

export const PERMISSION_MODULES = [
  { id: 'trouble_tickets', label: 'Trouble Tickets' },
  { id: 'work_orders', label: 'Work Orders' },
  { id: 'wo_reports', label: 'Work Order Reports' },
  { id: 'tt_reports', label: 'Trouble Ticket Reports' },
  { id: 'ehs_reports', label: 'EHS Reports' },
  { id: 'spare_reports', label: 'Spare Reports' },
  { id: 'sms', label: 'SMS (Log / Groups / Config)' },
];
const MODULE_IDS = new Set(PERMISSION_MODULES.map((m) => m.id));

export async function getRolePermissions(roleId) {
  const [rows] = await pool.query('SELECT module, level FROM role_permissions WHERE role_id = ?', [roleId]);
  const map = {};
  rows.forEach((r) => { map[r.module] = r.level; });
  return map;
}

const LEVEL_RANK = { view: 1, manage: 2 };

// user: { role, roleId }. Administrator always passes.
export async function hasPermission(user, module, level = 'view') {
  if (user.role === 'Administrator') return true;
  if (!user.roleId) return false;
  const perms = await getRolePermissions(user.roleId);
  const have = perms[module];
  return !!have && LEVEL_RANK[have] >= LEVEL_RANK[level];
}

// Express middleware: authorizeModule('work_orders', 'manage')
export function authorizeModule(module, level = 'view') {
  return async (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Missing bearer token' });
    const ok = await hasPermission(req.user, module, level);
    if (!ok) return res.status(403).json({ error: 'You do not have permission to perform this action' });
    next();
  };
}

export function assertValidModule(module) {
  return MODULE_IDS.has(module);
}
