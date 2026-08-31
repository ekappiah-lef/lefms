// =====================================================================
// PLATFORM CONFIG — modules, navigation, roles & permissions
// One place to define every route, which nav group it lives in, and
// which roles may see it. Sidebar + routing + access all read from here.
// =====================================================================
import {
  LayoutDashboard, UserPlus, CalendarClock, Stethoscope, ListOrdered,
  LogIn, LogOut, BedDouble, Building2, HeartPulse, UserRound, Scissors,
  FlaskConical, Pill, Wrench, ClipboardList, CalendarCheck, ShieldCheck,
  Boxes, HardHat, Smartphone, Users2, CalendarDays, CalendarRange,
  PlaneTakeoff, Package, ShoppingCart, Wallet, BarChart3, FileBarChart,
  UsersRound, KeyRound, Network, SlidersHorizontal, FileText, ScanLine,
} from 'lucide-react';

// ---------------------------------------------------------------------
// ROLES
// ---------------------------------------------------------------------
export const ROLES = [
  'Hospital Administrator', 'Medical Director', 'Front Desk Officer', 'OPD Officer',
  'Doctor', 'Nurse', 'Ward Manager', 'HR Officer', 'Maintenance Manager',
  'Engineer', 'Biomedical Engineer', 'Pharmacist', 'Lab Scientist',
  'Inventory Officer', 'Finance Officer', 'Department Head', 'System Administrator',
];

const ADMIN = ['Hospital Administrator', 'System Administrator'];

export const EXECUTIVE_ROLES = ['Hospital Administrator', 'Medical Director', 'Department Head', 'System Administrator'];
export const FIELD_ROLES = ['Engineer', 'Biomedical Engineer'];

// ---------------------------------------------------------------------
// MODULE REGISTRY
// ---------------------------------------------------------------------
export const MODULES = [
  { id: 'dashboard', label: 'Dashboard', group: 'Overview', icon: LayoutDashboard, roles: '*' },

  // Patient Services
  { id: 'front-desk',   label: 'Front Desk',         group: 'Patient Services', icon: UserPlus,      roles: [...ADMIN, 'Front Desk Officer', 'Medical Director'] },
  { id: 'appointments', label: 'Appointments',       group: 'Patient Services', icon: CalendarClock, roles: [...ADMIN, 'Front Desk Officer', 'OPD Officer', 'Doctor', 'Medical Director'] },
  { id: 'opd',          label: 'OPD / Patient Flow', group: 'Patient Services', icon: Stethoscope,   roles: [...ADMIN, 'OPD Officer', 'Doctor', 'Medical Director'] },
  { id: 'patient-queue',label: 'Patient Queue',      group: 'Patient Services', icon: ListOrdered,   roles: [...ADMIN, 'OPD Officer', 'Doctor', 'Front Desk Officer', 'Nurse', 'Medical Director'] },
  { id: 'admissions',   label: 'Admissions',         group: 'Patient Services', icon: LogIn,         roles: [...ADMIN, 'OPD Officer', 'Ward Manager', 'Nurse', 'Doctor', 'Medical Director'] },
  { id: 'discharges',   label: 'Discharges',         group: 'Patient Services', icon: LogOut,        roles: [...ADMIN, 'OPD Officer', 'Ward Manager', 'Nurse', 'Doctor', 'Medical Director'] },

  // Clinical Operations
  { id: 'wards',        label: 'Wards',          group: 'Clinical Operations', icon: Building2,    roles: [...ADMIN, 'Nurse', 'Ward Manager', 'Doctor', 'Medical Director'] },
  { id: 'bed-mgmt',     label: 'Bed Management', group: 'Clinical Operations', icon: BedDouble,    roles: [...ADMIN, 'Nurse', 'Ward Manager', 'OPD Officer', 'Medical Director'] },
  { id: 'nursing',      label: 'Nursing',        group: 'Clinical Operations', icon: HeartPulse,  roles: [...ADMIN, 'Nurse', 'Ward Manager', 'Medical Director'] },
  { id: 'doctors',      label: 'Doctors',        group: 'Clinical Operations', icon: UserRound,   roles: [...ADMIN, 'Doctor', 'Medical Director'] },
  { id: 'theatre',      label: 'Theatre',        group: 'Clinical Operations', icon: Scissors,    roles: [...ADMIN, 'Doctor', 'Nurse', 'Medical Director'] },
  { id: 'laboratory',   label: 'Laboratory',     group: 'Clinical Operations', icon: FlaskConical, roles: [...ADMIN, 'Lab Scientist', 'Doctor', 'Medical Director'] },
  { id: 'pharmacy',     label: 'Pharmacy',       group: 'Clinical Operations', icon: Pill,        roles: [...ADMIN, 'Pharmacist', 'Doctor', 'Medical Director'] },

  // Facility Operations
  { id: 'requests',     label: 'Maintenance Requests',   group: 'Facility Operations', icon: ClipboardList, roles: [...ADMIN, 'Maintenance Manager', 'Engineer', 'Biomedical Engineer', 'Front Desk Officer', 'Nurse', 'Ward Manager', 'OPD Officer', 'Pharmacist', 'Lab Scientist'] },
  { id: 'work-orders',  label: 'Work Orders',            group: 'Facility Operations', icon: Wrench,        roles: [...ADMIN, 'Maintenance Manager', 'Engineer', 'Biomedical Engineer'] },
  { id: 'preventive',   label: 'Preventive Maintenance', group: 'Facility Operations', icon: CalendarCheck, roles: [...ADMIN, 'Maintenance Manager', 'Engineer', 'Biomedical Engineer'] },
  { id: 'safety',       label: 'Safety Audits',          group: 'Facility Operations', icon: ShieldCheck,   roles: [...ADMIN, 'Maintenance Manager', 'Engineer', 'Biomedical Engineer'] },
  { id: 'assets',       label: 'Assets',                 group: 'Facility Operations', icon: Boxes,         roles: [...ADMIN, 'Maintenance Manager', 'Biomedical Engineer'] },
  { id: 'biomedical',   label: 'Biomedical',             group: 'Facility Operations', icon: ScanLine,      roles: [...ADMIN, 'Biomedical Engineer', 'Maintenance Manager', 'Medical Director'] },
  { id: 'engineers',    label: 'Engineers',              group: 'Facility Operations', icon: HardHat,       roles: [...ADMIN, 'Maintenance Manager'] },
  { id: 'engineer-mobile', label: 'My Jobs (Mobile)',    group: 'Facility Operations', icon: Smartphone,    roles: ['Engineer', 'Biomedical Engineer', 'Maintenance Manager', ...ADMIN] },

  // Administration
  { id: 'patient-records', label: 'Patient Records', group: 'Administration', icon: FileText,     roles: [...ADMIN, 'Medical Director', 'HR Officer', 'Front Desk Officer', 'OPD Officer', 'Doctor', 'Nurse', 'Ward Manager'] },
  { id: 'hr',            label: 'Human Resources',  group: 'Administration', icon: Users2,        roles: [...ADMIN, 'HR Officer'] },
  { id: 'attendance',    label: 'Staff Attendance', group: 'Administration', icon: CalendarDays,  roles: [...ADMIN, 'HR Officer'] },
  { id: 'shifts',        label: 'Shift Management', group: 'Administration', icon: CalendarRange, roles: [...ADMIN, 'HR Officer', 'Ward Manager'] },
  { id: 'leave',         label: 'Leave Management', group: 'Administration', icon: PlaneTakeoff,  roles: [...ADMIN, 'HR Officer'] },
  { id: 'inventory',     label: 'Inventory',        group: 'Administration', icon: Package,       roles: [...ADMIN, 'Inventory Officer', 'Pharmacist'] },
  { id: 'procurement',   label: 'Procurement',      group: 'Administration', icon: ShoppingCart,  roles: [...ADMIN, 'Inventory Officer', 'Finance Officer'] },
  { id: 'finance',       label: 'Finance',          group: 'Administration', icon: Wallet,        roles: [...ADMIN, 'Finance Officer'] },

  // Reports
  { id: 'hospital-reports',    label: 'Hospital Reports',    group: 'Reports', icon: BarChart3,    roles: [...ADMIN, 'Medical Director', 'Department Head'] },
  { id: 'maintenance-reports', label: 'Maintenance Reports', group: 'Reports', icon: FileBarChart, roles: [...ADMIN, 'Maintenance Manager'] },
  { id: 'hr-reports',          label: 'HR Reports',          group: 'Reports', icon: FileBarChart, roles: [...ADMIN, 'HR Officer'] },

  // System
  { id: 'sys-users',       label: 'Users',       group: 'System', icon: UsersRound,        roles: ADMIN },
  { id: 'sys-roles',       label: 'Roles',       group: 'System', icon: KeyRound,          roles: ADMIN },
  { id: 'sys-departments', label: 'Departments', group: 'System', icon: Network,           roles: ADMIN },
  { id: 'sys-permissions', label: 'Permissions', group: 'System', icon: ShieldCheck,       roles: ADMIN },
  { id: 'settings',        label: 'Settings',    group: 'System', icon: SlidersHorizontal, roles: '*' },
];

export const NAV_GROUP_ORDER = [
  'Overview', 'Patient Services', 'Clinical Operations',
  'Facility Operations', 'Administration', 'Reports', 'System',
];

// ---------------------------------------------------------------------
// ACCESS HELPERS
// ---------------------------------------------------------------------
export function canAccess(role, moduleId) {
  const m = MODULES.find((x) => x.id === moduleId);
  if (!m) return false;
  if (m.roles === '*') return true;
  return m.roles.includes(role);
}

export function moduleById(id) {
  return MODULES.find((x) => x.id === id);
}

export function navForRole(role) {
  const groups = {};
  MODULES.forEach((m) => {
    if (m.id === 'dashboard') return;
    if (m.roles === '*' || m.roles.includes(role)) {
      (groups[m.group] = groups[m.group] || []).push(m);
    }
  });
  return NAV_GROUP_ORDER
    .filter((g) => g !== 'Overview' && groups[g])
    .map((g) => ({ group: g, items: groups[g] }));
}

// Department dashboard / landing that a role lands on.
export const ROLE_DASHBOARD = {
  'Front Desk Officer': 'front-desk',
  'OPD Officer': 'opd',
  'Doctor': 'opd',
  'Nurse': 'ward',
  'Ward Manager': 'ward',
  'HR Officer': 'hr',
  'Maintenance Manager': 'maintenance',
  'Engineer': 'engineer-mobile',
  'Biomedical Engineer': 'biomedical',
  'Pharmacist': 'pharmacy',
  'Lab Scientist': 'laboratory',
  'Inventory Officer': 'inventory',
  'Finance Officer': 'finance',
};

export function landingDashboard(role) {
  if (EXECUTIVE_ROLES.includes(role)) return 'general';
  return ROLE_DASHBOARD[role] || 'general';
}
