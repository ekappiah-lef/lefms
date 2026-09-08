// =====================================================================
// Dynamic, per-role module permissions (role_permissions table).
// Administrator is always a full-access bypass, never governed by this
// table -- every other role, built-in or custom (e.g. "NOC Engineer"),
// is gated by rows here for every page in the app except the Users and
// Roles admin pages themselves, which stay Administrator-only by design
// (letting any other role manage users/roles would be a privilege-
// escalation path -- a role could grant itself more access).
//
// 'view' = can see/list. 'manage' = can create/act on this page (create
// a ticket, approve a spare request, add a site, etc). A role with no
// row for a module has no access to it at all -- not even the nav link.
//
// Spare Parts splits "Spare Requests" into two modules even though it's
// one page, because raising a request (Engineer/Supervisor's job) and
// approving/issuing one (Spare User's job) are genuinely different
// capabilities that a role can hold independently.
// =====================================================================
import { pool } from './db.js';

export const PERMISSION_MODULES = [
  { id: 'trouble_tickets', label: 'Trouble Tickets', group: 'Trouble Tickets' },
  { id: 'work_orders', label: 'Work Orders', group: 'Work Orders' },
  { id: 'ehs', label: 'EHS Work Orders', group: 'EHS' },
  { id: 'spare_requests', label: 'Spare Requests (raise / track)', group: 'Spare Parts' },
  { id: 'spare_fulfillment', label: 'Spare Requests (approve / issue / return)', group: 'Spare Parts' },
  { id: 'spare_transactions', label: 'Spare Returns', group: 'Spare Parts' },
  { id: 'spare_inventory', label: 'Add / Update Inventory', group: 'Spare Parts' },
  { id: 'site_database', label: 'Sites', group: 'Site Database' },
  { id: 'assets', label: 'Assets', group: 'Site Database' },
  { id: 'wo_reports', label: 'Work Order Reports', group: 'Reports' },
  { id: 'tt_reports', label: 'Trouble Ticket Reports', group: 'Reports' },
  { id: 'ehs_reports', label: 'EHS Reports', group: 'Reports' },
  { id: 'spare_reports', label: 'Spare Reports', group: 'Reports' },
  { id: 'sms', label: 'SMS (Log / Groups / Config)', group: 'SMS' },
  { id: 'wo_checklist', label: 'PM Checklist', group: 'Administration' },
  { id: 'ehs_checklist', label: 'EHS Checklist', group: 'Administration' },
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
