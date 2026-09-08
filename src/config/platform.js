// =====================================================================
// PLATFORM CONFIG   modules, navigation & role access.
// Six roles: Administrator, Supervisor, Engineer, EHS User, Spare User,
// MS User (read-only). Work is scoped by Region/Site, not department   a
// Supervisor/Engineer's default queue is their own region (server-side);
// Administrator, EHS User, Spare User and MS User see everything.
// No icons anywhere here   the sidebar renders labels only.
// =====================================================================
export const ROLES = ['Administrator', 'Supervisor', 'Engineer', 'EHS User', 'Spare User', 'MS User'];

export const MODULES = [
  { id: 'dashboard', label: 'Dashboard', group: 'Overview', roles: '*', page: 'overview' },

  { id: 'trouble-tickets', label: 'Trouble Tickets', group: 'Trouble Tickets', perm: { module: 'trouble_tickets', level: 'view' }, page: 'trouble-tickets' },

  { id: 'work-orders', label: 'All Work Orders', group: 'Work Orders', perm: { module: 'work_orders', level: 'view' }, page: 'work-orders' },

  { id: 'ehs-work-orders', label: 'EHS Work Orders', group: 'EHS', perm: { module: 'ehs', level: 'view' }, page: 'ehs-work-orders' },

  { id: 'spare-requests', label: 'Spare Requests', group: 'Spare Parts', perm: [{ module: 'spare_requests', level: 'view' }, { module: 'spare_fulfillment', level: 'view' }], page: 'spare-requests' },
  { id: 'spare-transactions', label: 'Spare Returns', group: 'Spare Parts', perm: { module: 'spare_transactions', level: 'view' }, page: 'spare-transactions' },
  { id: 'spare-inventory', label: 'Add / Update Inventory', group: 'Spare Parts', perm: { module: 'spare_inventory', level: 'view' }, page: 'spare-inventory' },

  { id: 'site-database', label: 'Sites', group: 'Site Database', perm: { module: 'site_database', level: 'view' }, page: 'site-database' },
  { id: 'assets', label: 'Assets', group: 'Site Database', perm: { module: 'assets', level: 'view' }, page: 'assets' },

  { id: 'reports', label: 'Work Order Reports', group: 'Reports', perm: { module: 'wo_reports', level: 'view' }, page: 'reports' },
  { id: 'tt-reports', label: 'Trouble Ticket Reports', group: 'Reports', perm: { module: 'tt_reports', level: 'view' }, page: 'tt-reports' },
  { id: 'ehs-reports', label: 'EHS Reports', group: 'Reports', perm: { module: 'ehs_reports', level: 'view' }, page: 'ehs-reports' },
  { id: 'spare-reports', label: 'Spare Reports', group: 'Reports', perm: { module: 'spare_reports', level: 'view' }, page: 'spare-reports' },

  { id: 'admin-sms-log', label: 'SMS Log', group: 'SMS', perm: { module: 'sms', level: 'view' }, page: 'admin-sms-log' },
  { id: 'admin-sms-groups', label: 'SMS Groups', group: 'SMS', perm: { module: 'sms', level: 'view' }, page: 'admin-sms-groups' },
  { id: 'admin-sms-config', label: 'SMS Config', group: 'SMS', perm: { module: 'sms', level: 'view' }, page: 'admin-sms-config' },

  // Users and Roles stay Administrator-only, full stop -- not configurable
  // from the Roles page. Letting any other role manage users/roles would
  // be a privilege-escalation path (a role could grant itself more access).
  { id: 'admin-users', label: 'Users', group: 'Administration', roles: ['Administrator'], page: 'admin-users' },
  { id: 'admin-roles', label: 'Roles', group: 'Administration', roles: ['Administrator'], page: 'admin-roles' },
  { id: 'admin-wo-checklist', label: 'PM Checklist', group: 'Administration', perm: { module: 'wo_checklist', level: 'view' }, page: 'admin-wo-checklist' },
  { id: 'admin-ehs-checklist', label: 'EHS Checklist', group: 'Administration', perm: { module: 'ehs_checklist', level: 'view' }, page: 'admin-ehs-checklist' },
];

export const NAV_GROUP_ORDER = ['Trouble Tickets', 'Work Orders', 'EHS', 'Spare Parts', 'Site Database', 'Reports', 'SMS', 'Administration'];

const LEVEL_RANK = { view: 1, manage: 2 };

// user: { role, permissions: { module: 'view'|'manage' } }. Administrator
// always passes. A module with a `perm` key is gated dynamically by the
// user's role's permissions (role_permissions, configured on the Roles
// admin page); everything else still uses the old static `roles` list.
export function hasPerm(user, module, level = 'view') {
  if (user.role === 'Administrator') return true;
  const have = user.permissions?.[module];
  return !!have && LEVEL_RANK[have] >= LEVEL_RANK[level];
}

export function canAccess(user, moduleId) {
  const m = MODULES.find((x) => x.id === moduleId);
  if (!m) return false;
  if (user.role === 'Administrator') return true;
  if (m.perm) {
    // A page can be gated by more than one permission module (e.g. Spare
    // Requests is either "raise/track" or "approve/issue" -- either one
    // is enough to see the page at all).
    const perms = Array.isArray(m.perm) ? m.perm : [m.perm];
    return perms.some((p) => hasPerm(user, p.module, p.level));
  }
  if (m.roles === '*') return true;
  return m.roles.includes(user.role);
}

export function moduleById(id) {
  return MODULES.find((x) => x.id === id);
}

export function navForRole(user) {
  const groups = {};
  MODULES.forEach((m) => {
    if (m.id === 'dashboard') return;
    if (canAccess(user, m.id)) (groups[m.group] = groups[m.group] || []).push(m);
  });
  return NAV_GROUP_ORDER.filter((g) => groups[g]).map((g) => ({ group: g, items: groups[g] }));
}
