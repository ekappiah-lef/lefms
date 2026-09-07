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

  { id: 'trouble-tickets', label: 'Trouble Tickets', group: 'Trouble Tickets', roles: '*', page: 'trouble-tickets' },

  { id: 'work-orders', label: 'All Work Orders', group: 'Work Orders', roles: '*', page: 'work-orders' },
  { id: 'reports', label: 'Reports', group: 'Work Orders', roles: '*', page: 'reports' },

  { id: 'ehs-work-orders', label: 'EHS Work Orders', group: 'EHS', roles: ['Administrator', 'EHS User', 'Engineer', 'Supervisor', 'MS User'], page: 'ehs-work-orders' },
  { id: 'ehs-reports', label: 'EHS Reports', group: 'EHS', roles: ['Administrator', 'EHS User', 'MS User'], page: 'ehs-reports' },

  { id: 'spare-requests', label: 'Spare Requests', group: 'Spare Parts', roles: ['Administrator', 'Spare User', 'Engineer', 'Supervisor', 'MS User'], page: 'spare-requests' },
  { id: 'spare-transactions', label: 'Spare Returns', group: 'Spare Parts', roles: ['Administrator', 'Spare User', 'MS User'], page: 'spare-transactions' },
  { id: 'spare-inventory', label: 'Add / Update Inventory', group: 'Spare Parts', roles: ['Administrator', 'Spare User'], page: 'spare-inventory' },
  { id: 'spare-reports', label: 'Spare Reports', group: 'Spare Parts', roles: ['Administrator', 'Spare User', 'MS User'], page: 'spare-reports' },

  { id: 'site-database', label: 'Sites', group: 'Site Database', roles: ['Administrator', 'MS User'], page: 'site-database' },
  { id: 'assets', label: 'Assets', group: 'Site Database', roles: '*', page: 'assets' },

  { id: 'admin-users', label: 'Users', group: 'Administration', roles: ['Administrator'], page: 'admin-users' },
  { id: 'admin-wo-checklist', label: 'PM Checklist', group: 'Administration', roles: ['Administrator'], page: 'admin-wo-checklist' },
  { id: 'admin-ehs-checklist', label: 'EHS Checklist', group: 'Administration', roles: ['Administrator', 'EHS User'], page: 'admin-ehs-checklist' },
  { id: 'admin-sms-groups', label: 'SMS Groups', group: 'Administration', roles: ['Administrator'], page: 'admin-sms-groups' },
  { id: 'admin-sms-config', label: 'SMS Config', group: 'Administration', roles: ['Administrator'], page: 'admin-sms-config' },
];

export const NAV_GROUP_ORDER = ['Trouble Tickets', 'Work Orders', 'EHS', 'Spare Parts', 'Site Database', 'Administration'];

// user: { role }
export function canAccess(user, moduleId) {
  const m = MODULES.find((x) => x.id === moduleId);
  if (!m) return false;
  if (user.role === 'Administrator') return true;
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
