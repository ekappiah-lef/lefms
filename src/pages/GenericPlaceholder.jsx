import React from 'react';
import { Placeholder } from '../components/ui';

// Planned capabilities per placeholder module (architecture is in place; UI is Phase 2)
const PLANNED = {
  admissions: ['Admission requests from OPD/ER', 'Bed allocation on admit', 'Admitting doctor & diagnosis', 'Deposit & billing hook', 'Admission register'],
  discharges: ['Discharge summary', 'Bed release workflow', 'Pharmacy & billing clearance', 'Follow-up appointment', 'Discharge register'],
  nursing: ['Nursing task lists', 'Vitals rounds schedule', 'Medication administration', 'Care handover notes', 'Ward assignment'],
  doctors: ['Doctor rosters & availability', 'Consultation history', 'Referrals', 'On-call schedule', 'Caseload dashboard'],
  theatre: ['Theatre booking calendar', 'Surgical checklist (WHO)', 'Team assignment', 'Instrument sterilisation log', 'Post-op recovery'],
  laboratory: ['Test order queue', 'Sample tracking', 'Result entry & validation', 'Turnaround-time KPIs', 'Analyzer interfaces'],
  pharmacy: ['Prescription queue', 'Dispensing & stock deduction', 'Drug interactions check', 'Cold-chain monitoring', 'Refill management'],
  assets: ['Asset register & tagging', 'Warranty & service contracts', 'Depreciation', 'Location tracking', 'Linked work orders'],
  inventory: ['Medical supplies & consumables', 'Maintenance spare parts', 'Stock issues & transfers', 'Low-stock alerts', 'Batch & expiry tracking'],
  procurement: ['Purchase requests', 'Purchase orders', 'Supplier management', 'Goods receipt', 'Approval workflows'],
  finance: ['Patient billing & invoicing', 'Insurance/NHIS claims', 'Payments & receipts', 'Departmental budgets', 'Financial reporting'],
  'sys-users': ['User accounts', 'Employee linkage', 'Activation & suspension', 'Login audit', 'Password policy'],
  'sys-roles': ['Role definitions', 'Role hierarchy', 'Default dashboards', 'Bulk role assignment'],
  'sys-departments': ['Department directory', 'Department heads', 'Cost centres', 'Facility & ward mapping'],
  'sys-permissions': ['Module-level permissions', 'Action-level (view/edit/approve)', 'Department-scoped access', 'Permission audit'],
  settings: ['Hospital & facility profile', 'Branding & theme', 'Notification rules', 'Numbering schemes (patient/ticket)', 'Integrations & API keys'],
};

export default function GenericPlaceholder({ module }) {
  return <Placeholder title={module.label} icon={module.icon} bullets={PLANNED[module.id] || []} />;
}
