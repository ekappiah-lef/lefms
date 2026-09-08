// =====================================================================
// Frontend mirror of server/workflow.js   status labels/tones and which
// actions are available to the current user on a given ticket. The
// server is the source of truth (it re-checks all of this); this just
// decides which buttons to render.
// =====================================================================
import { hasPerm } from '../config/platform';
export const STATUS_LABELS = { CR: 'Created', PR: 'In Process', CO: 'Completed', CL: 'Closed', RJ: 'Rejected', CA: 'Cancelled' };
export const STATUS_TONE = { CR: 'blue', PR: 'amber', CO: 'green', CL: 'slate', RJ: 'red', CA: 'red' };
export const ALL_STATUSES = ['CR', 'PR', 'CO', 'CL', 'RJ', 'CA'];

// { action, label, tone, needsNote, needsScore? }   score only applies to safety audits.
const ACTIONS_BY_STATUS = {
  CR: [
    { action: 'accept', label: 'Accept', tone: 'success', who: 'engineer' },
    { action: 'reject', label: 'Reject', tone: 'danger', who: 'engineer' },
  ],
  PR: [
    { action: 'complete', label: 'Complete', tone: 'success', who: 'engineer' },
    { action: 'cancel', label: 'Cancel', tone: 'danger', who: 'engineer' },
  ],
  CO: [
    { action: 'close', label: 'Close', tone: 'navy', who: 'supervisor' },
    { action: 'rework', label: 'Reject', tone: 'danger', who: 'supervisor' },
  ],
  CA: [
    { action: 'close', label: 'Close', tone: 'navy', who: 'supervisor' },
    { action: 'rework', label: 'Reject', tone: 'danger', who: 'supervisor' },
  ],
  RJ: [
    { action: 'reopen', label: 'Reassign', tone: 'navy', who: 'supervisor', needsEngineer: true },
  ],
  CL: [],
};

// Non-status-changing actions, available once a ticket is In Process   a
// progress note from the assigned engineer, or a mid-process reassignment
// by the supervisor. Not offered at Created: that phase is just Accept/
// Reject until an engineer has taken the ticket on.
const ACTIVE_STATUSES = ['PR'];
const EXTRA_ACTIONS = [
  { action: 'update', label: 'Update', tone: 'ghost', who: 'engineer' },
  { action: 'reassign', label: 'Reassign', tone: 'ghost', who: 'supervisor', needsEngineer: true, engineerRequired: true },
];

export function availableActions(ticket, user) {
  const list = [...(ACTIONS_BY_STATUS[ticket.status] || [])];
  if (ACTIVE_STATUSES.includes(ticket.status)) list.push(...EXTRA_ACTIONS);
  // Complete only shows once at least one Update has been logged.
  const hasUpdate = (ticket.history || []).some((h) => h.action === 'update');
  const eligible = list.filter((a) => a.action !== 'complete' || hasUpdate);
  if (user.role === 'Administrator') return eligible;
  return eligible.filter((a) => {
    if (a.who === 'engineer') return hasPerm(user, 'work_orders', 'manage') && Number(user.id) === Number(ticket.engineerId);
    if (a.who === 'supervisor') return user.role === 'Supervisor' && Number(user.regionId) === Number(ticket.regionId);
    return false;
  });
}

// Visual styling for each Activity/History timeline entry, matching
// work-order-details-state-flow.html's colour-coded event types.
export const HISTORY_STYLE = {
  Create:   { label: 'CREATED',    dot: 'bg-slate-400',   text: 'text-slate-600' },
  accept:   { label: 'IN PROCESS', dot: 'bg-blue-500',    text: 'text-blue-600' },
  update:   { label: 'UPDATED',    dot: 'bg-violet-500',  text: 'text-violet-600' },
  reassign: { label: 'REASSIGNED', dot: 'bg-amber-500',   text: 'text-amber-600' },
  complete: { label: 'COMPLETED',  dot: 'bg-emerald-500', text: 'text-emerald-600' },
  cancel:   { label: 'CANCELLED',  dot: 'bg-orange-500',  text: 'text-orange-600' },
  close:    { label: 'CLOSED',     dot: 'bg-slate-600',   text: 'text-slate-700' },
  reject:   { label: 'REJECTED',   dot: 'bg-red-500',     text: 'text-red-600' },
  rework:   { label: 'REJECTED',   dot: 'bg-red-500',     text: 'text-red-600' },
  reopen:   { label: 'REOPENED',   dot: 'bg-blue-500',    text: 'text-blue-600' },
  create_wo: { label: 'WO CREATED', dot: 'bg-indigo-500',  text: 'text-indigo-600' },
  ehs_flagged: { label: 'EHS FLAGGED', dot: 'bg-red-500',  text: 'text-red-600' },
};

// Anyone whose role can manage the given module (Work Orders or Trouble
// Tickets   built-in Engineer/Supervisor, or a custom role like "NOC
// Engineer") may create one there. The site picker in CreateTicketPage
// decides which sites they see.
export function canCreateIn(user, module = 'work_orders') {
  return hasPerm(user, module, 'manage');
}

export function canDelete(user, ticket) {
  return user.role === 'Administrator' && ticket.status === 'CR';
}

// Trouble Ticket lifecycle: OPEN -> COMPLETED|CANCELLED -> CLOSED, plus
// non-status Update entries   not every trouble ticket needs a Work
// Order; some are just triaged, updated and completed/closed on their
// own. "Create Work Order" is available alongside Complete once the
// ticket has been updated at least once (same "must update before you
// can finish" rule the Work Order engine uses for Complete).
export const TT_STATUS_LABELS = { OPEN: 'Open', COMPLETED: 'Completed', CANCELLED: 'Cancelled', CLOSED: 'Closed' };
export const TT_STATUS_TONE = { OPEN: 'blue', COMPLETED: 'green', CANCELLED: 'red', CLOSED: 'slate' };

// A trouble ticket that's been converted keeps taking Updates forever
// (its work order is doing the real work, but the ticket's own log isn't
// done)   Complete/Cancel only become available again once that work
// order itself reaches a terminal state (Completed/Closed/Cancelled).
const WO_TERMINAL = ['CO', 'CL', 'CA'];

export function ttAvailableActions(tt, hasUpdate, user) {
  const canAct = hasPerm(user, 'trouble_tickets', 'manage');
  const canClose = user.role === 'Administrator' || (user.role === 'Supervisor' && Number(user.regionId) === Number(tt.regionId));
  if (tt.status === 'OPEN') {
    if (!canAct) return [];
    const list = [{ action: 'update', label: 'Update', tone: 'ghost' }];
    if (!tt.workOrderId) {
      list.push({ action: 'cancel', label: 'Cancel', tone: 'danger' });
      if (hasUpdate) {
        list.push({ action: 'complete', label: 'Complete', tone: 'success' });
        list.push({ action: 'create_wo', label: 'Create Work Order', tone: 'navy' });
      }
    } else if (WO_TERMINAL.includes(tt.woStatus)) {
      list.push({ action: 'cancel', label: 'Cancel', tone: 'danger' });
      list.push({ action: 'complete', label: 'Complete', tone: 'success' });
    }
    return list;
  }
  if (['COMPLETED', 'CANCELLED'].includes(tt.status) && canClose) {
    return [{ action: 'close', label: 'Close', tone: 'navy' }];
  }
  return [];
}
