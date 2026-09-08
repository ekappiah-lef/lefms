// =====================================================================
// Work order workflow engine:
//
//   CR --accept--> PR --complete--> CO --close--> CL   (terminal)
//   CR --accept--> PR --cancel-->   CA --close--> CL   (terminal)
//   CR --reject-->  RJ --reopen-->  CR                  (loop: new engineer)
//   CO/CA --rework--> PR                                (loop: rework)
//
// Every transition is written to ticket_history and updates the work
// order's own timestamp column, so "every description" is captured with
// an actor, a note and a time   no exceptions, no silent transitions.
//
// EHS is mandatory: Complete is blocked unless this work order's linked
// ehs_records row has reached SUBMITTED or REVIEWED (see ehsWorkflow.js
// for that separate, smaller lifecycle).
// =====================================================================
import { pool } from './db.js';
import { hasPermission } from './permissions.js';

const TABLES = {
  work_order: 'work_orders',
};

export const TRANSITIONS = {
  accept:   { from: ['CR'], to: 'PR', who: 'engineer', tsCol: 'accepted_at' },
  reject:   { from: ['CR'], to: 'RJ', who: 'engineer', tsCol: 'rejected_at' },
  complete: { from: ['PR'], to: 'CO', who: 'engineer', tsCol: 'completed_at' },
  cancel:   { from: ['PR'], to: 'CA', who: 'engineer', tsCol: 'cancelled_at' },
  close:    { from: ['CO', 'CA'], to: 'CL', who: 'supervisor', tsCol: 'closed_at' },
  rework:   { from: ['CO', 'CA'], to: 'PR', who: 'supervisor', tsCol: null },
  reopen:   { from: ['RJ'], to: 'CR', who: 'supervisor', tsCol: null },
};

export class WorkflowError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

// Shared route error responder: an intentional, user-facing error (any
// error with a `.status` -- WorkflowError or duck-typed alike) is safe to
// send verbatim; anything else is unexpected (a DB/driver error, a bug)
// and must never leak its raw message to the client -- log it server-side
// and send a generic one instead.
export function sendError(res, e) {
  if (e.status) return res.status(e.status).json({ error: e.message });
  console.error(e);
  return res.status(500).json({ error: 'Unexpected server error' });
}

// Loads the minimal ticket fields the engine needs.
export async function loadTicket(entityType, id, conn = pool) {
  const table = TABLES[entityType];
  const [rows] = await conn.query(
    `SELECT id, region_id, engineer_id, status, wo_type FROM ${table} WHERE id = ?`, [id]
  );
  if (!rows.length) throw new WorkflowError('Ticket not found', 404);
  return rows[0];
}

// "engineer" here means "whoever this ticket is assigned to" -- gated by
// the assignee's identity plus their role holding manage on work_orders
// (not the literal role name "Engineer"), so a custom role granted
// manage on Work Orders (e.g. "NOC Engineer") can also be assigned to
// and act on its own tickets. Supervisor's region-wide close/reopen
// authority stays tied to the literal "Supervisor" role name.
async function assertPermission(rule, ticket, user) {
  if (user.role === 'Administrator') return;
  if (rule.who === 'engineer') {
    if (Number(user.id) !== Number(ticket.engineer_id) || !(await hasPermission(user, 'work_orders', 'manage'))) {
      throw new WorkflowError('Only the assigned engineer can perform this action', 403);
    }
  } else if (rule.who === 'supervisor') {
    if (user.role !== 'Supervisor' || Number(user.regionId) !== Number(ticket.region_id)) {
      throw new WorkflowError('Only that region\'s supervisor can perform this action', 403);
    }
  }
}

async function assertEhsClearedForComplete(conn, workOrderId) {
  const [[ehs]] = await conn.query('SELECT status, outcome FROM ehs_records WHERE work_order_id = ?', [workOrderId]);
  // A flagged review already drops the record back to PENDING (see
  // ehsWorkflow.js's reviewEhs), so this outcome check is redundant in
  // practice   kept anyway as a second line of defense against exactly
  // the bug that slipped through before: a flagged EHS still counting as
  // cleared.
  if (!ehs || !['SUBMITTED', 'REVIEWED'].includes(ehs.status) || ehs.outcome === 'Flagged') {
    throw new WorkflowError('EHS must be submitted and cleared for this work order before it can be completed', 409);
  }
}

// action: one of TRANSITIONS keys. note: required, non-empty description.
// extra: { newEngineerId, checklistResponses }   optional, transition-specific.
// Accept is just "I'm taking this on"   no explanation needed, unlike
// every other transition (Reject, Complete, Cancel, Close, Rework,
// Reopen) which all still require a reason.
const NO_NOTE_ACTIONS = ['accept'];

export async function applyTransition(entityType, id, action, user, note, extra = {}) {
  const rule = TRANSITIONS[action];
  if (!rule) throw new WorkflowError(`Unknown action "${action}"`, 400);
  if (!NO_NOTE_ACTIONS.includes(action) && (!note || !note.trim())) throw new WorkflowError('A note describing this action is required', 400);

  const table = TABLES[entityType];
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const ticket = await loadTicket(entityType, id, conn);
    if (!rule.from.includes(ticket.status)) {
      throw new WorkflowError(`Cannot ${action} a ticket in status ${ticket.status}`, 409);
    }
    await assertPermission(rule, ticket, user);
    if (action === 'complete') await assertEhsClearedForComplete(conn, id);

    const sets = ['status = ?'];
    const params = [rule.to];
    if (rule.tsCol) { sets.push(`${rule.tsCol} = NOW()`); }
    if (action === 'reopen' && extra.newEngineerId) { sets.push('engineer_id = ?'); params.push(extra.newEngineerId); }
    params.push(id);
    await conn.query(`UPDATE ${table} SET ${sets.join(', ')} WHERE id = ?`, params);

    if (action === 'complete' && ticket.wo_type === 'PM' && Array.isArray(extra.checklistResponses)) {
      for (const { id: itemId, response } of extra.checklistResponses) {
        if (!['Yes', 'No', 'N/A'].includes(response)) continue;
        await conn.query('UPDATE work_order_checklist SET response = ? WHERE id = ? AND work_order_id = ?', [response, itemId, id]);
      }
    }

    // A PM Complete freezes the checklist as it stood at that moment onto
    // the history row, so a later rework -> re-complete cycle (which
    // overwrites the live checklist) doesn't erase what this entry showed.
    let checklistSnapshot = null;
    if (action === 'complete' && ticket.wo_type === 'PM') {
      const [snap] = await conn.query('SELECT task, response FROM work_order_checklist WHERE work_order_id = ?', [id]);
      checklistSnapshot = JSON.stringify(snap);
    }

    const [hist] = await conn.query(
      `INSERT INTO ticket_history (entity_type, entity_id, from_status, to_status, action, actor_id, note, checklist_snapshot) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [entityType, id, ticket.status, rule.to, action, user.id, note?.trim() || 'Accepted.', checklistSnapshot]
    );

    await conn.commit();
    return { status: rule.to, historyId: hist.insertId };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

const ACTIVE_STATUSES = ['CR', 'PR'];

// Add Update   a progress note logged to the same timeline as the formal
// status transitions, without changing status. from_status = to_status =
// the ticket's current status, which both satisfies ticket_history's
// NOT NULL to_status and reads correctly in the UI ("no change").
export async function addUpdate(entityType, id, user, note) {
  if (!note || !note.trim()) throw new WorkflowError('A note describing the update is required', 400);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const ticket = await loadTicket(entityType, id, conn);
    if (!ACTIVE_STATUSES.includes(ticket.status)) {
      throw new WorkflowError(`Cannot add an update to a ticket in status ${ticket.status}`, 409);
    }
    if (user.role !== 'Administrator' && (Number(user.id) !== Number(ticket.engineer_id) || !(await hasPermission(user, 'work_orders', 'manage')))) {
      throw new WorkflowError('Only the assigned engineer can post an update', 403);
    }
    const [hist] = await conn.query(
      `INSERT INTO ticket_history (entity_type, entity_id, from_status, to_status, action, actor_id, note) VALUES (?, ?, ?, ?, 'update', ?, ?)`,
      [entityType, id, ticket.status, ticket.status, user.id, note.trim()]
    );
    await conn.commit();
    return { status: ticket.status, historyId: hist.insertId };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

// Reassign   swap the engineer while still Created/In Process, without a
// status change (the Rejected -> Reopen path already handles reassignment
// tied to a status change; this is the mid-process management case).
export async function reassignEngineer(entityType, id, user, newEngineerId, note) {
  if (!note || !note.trim()) throw new WorkflowError('A note describing the reassignment is required', 400);
  if (!newEngineerId) throw new WorkflowError('A new engineer is required', 400);
  const table = TABLES[entityType];
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const ticket = await loadTicket(entityType, id, conn);
    if (!ACTIVE_STATUSES.includes(ticket.status)) {
      throw new WorkflowError(`Cannot reassign a ticket in status ${ticket.status}`, 409);
    }
    if (user.role !== 'Administrator' && (user.role !== 'Supervisor' || Number(user.regionId) !== Number(ticket.region_id))) {
      throw new WorkflowError('Only that region\'s supervisor can reassign this ticket', 403);
    }
    if (Number(newEngineerId) === Number(ticket.engineer_id)) {
      throw new WorkflowError('That engineer is already assigned', 400);
    }
    const [[{ full_name: fromName }]] = await conn.query('SELECT full_name FROM users WHERE id = ?', [ticket.engineer_id]);
    const [[{ full_name: toName }]] = await conn.query('SELECT full_name FROM users WHERE id = ?', [newEngineerId]);

    await conn.query(`UPDATE ${table} SET engineer_id = ? WHERE id = ?`, [newEngineerId, id]);
    const [hist] = await conn.query(
      `INSERT INTO ticket_history (entity_type, entity_id, from_status, to_status, action, actor_id, note) VALUES (?, ?, ?, ?, 'reassign', ?, ?)`,
      [entityType, id, ticket.status, ticket.status, user.id, `Reassigned from ${fromName} to ${toName}. ${note.trim()}`]
    );
    await conn.commit();
    return { status: ticket.status, historyId: hist.insertId };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

export async function getHistory(entityType, id) {
  const [rows] = await pool.query(
    `SELECT h.id, h.from_status, h.to_status, h.action, h.note, h.checklist_snapshot, h.created_at, u.full_name AS actor
     FROM ticket_history h JOIN users u ON u.id = h.actor_id
     WHERE h.entity_type = ? AND h.entity_id = ? ORDER BY h.created_at ASC, h.id ASC`,
    [entityType, id]
  );
  if (!rows.length) return rows;

  const [atts] = await pool.query(
    `SELECT id, history_id, file_name, file_path FROM attachments WHERE history_id IN (?)`,
    [rows.map((r) => r.id)]
  );
  const byHistory = {};
  atts.forEach((a) => { (byHistory[a.history_id] = byHistory[a.history_id] || []).push({ id: a.id, fileName: a.file_name, filePath: a.file_path }); });

  return rows.map(({ checklist_snapshot, ...r }) => ({
    ...r,
    checklistSnapshot: checklist_snapshot ? (typeof checklist_snapshot === 'string' ? JSON.parse(checklist_snapshot) : checklist_snapshot) : null,
    attachments: byHistory[r.id] || [],
  }));
}
