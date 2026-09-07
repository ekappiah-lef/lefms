// =====================================================================
// EHS record lifecycle   deliberately separate from the work order's own
// CR/PR/CO/CL/RJ/CA engine (see workflow.js header comment): a smaller,
// 3-state flow with different actors.
//
//   PENDING --Engineer submit--> SUBMITTED --EHS User/Admin review--> REVIEWED
//
// Reuses the same conventions as workflow.js: ticket_history rows via
// entity_type='ehs_record', the attachments table for photos, and the
// same WorkflowError class/shape so routes handle both identically.
// =====================================================================
import { pool } from './db.js';
import { WorkflowError } from './workflow.js';

export async function loadEhs(id, conn = pool) {
  const [rows] = await conn.query(
    `SELECT eh.id, eh.status, eh.work_order_id, w.engineer_id, w.region_id, w.status AS wo_status
     FROM ehs_records eh JOIN work_orders w ON w.id = eh.work_order_id WHERE eh.id = ?`, [id]
  );
  if (!rows.length) throw new WorkflowError('EHS record not found', 404);
  return rows[0];
}

// Engineer answers the checklist and confirms   requires every question
// on this record to have a Yes/No/N/A response and at least one photo
// attachment already uploaded, matching the spec's "answers checklist +
// uploads required photographs" flow.
export async function submitEhs(id, user, note, checklistResponses) {
  if (!note || !note.trim()) throw new WorkflowError('A note describing the EHS submission is required', 400);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const ehs = await loadEhs(id, conn);
    if (ehs.status !== 'PENDING') throw new WorkflowError(`Cannot submit EHS in status ${ehs.status}`, 409);
    if (user.role !== 'Administrator' && (user.role !== 'Engineer' || Number(user.id) !== Number(ehs.engineer_id))) {
      throw new WorkflowError('Only the assigned engineer can submit this EHS record', 403);
    }

    if (Array.isArray(checklistResponses)) {
      for (const { id: itemId, response } of checklistResponses) {
        if (!['Yes', 'No', 'N/A'].includes(response)) continue;
        await conn.query('UPDATE ehs_checklist SET response = ? WHERE id = ? AND ehs_record_id = ?', [response, itemId, id]);
      }
    }
    const [[{ unanswered }]] = await conn.query('SELECT COUNT(*) AS unanswered FROM ehs_checklist WHERE ehs_record_id = ? AND response IS NULL', [id]);
    if (unanswered > 0) throw new WorkflowError('Every EHS checklist question must be answered before submitting', 400);

    const [[{ photos }]] = await conn.query(`SELECT COUNT(*) AS photos FROM attachments WHERE entity_type = 'ehs_record' AND entity_id = ?`, [id]);
    if (photos < 1) throw new WorkflowError('At least one photograph must be uploaded before submitting EHS', 400);

    await conn.query(`UPDATE ehs_records SET status = 'SUBMITTED', submitted_by = ?, submitted_at = NOW() WHERE id = ?`, [user.id, id]);
    const [hist] = await conn.query(
      `INSERT INTO ticket_history (entity_type, entity_id, from_status, to_status, action, actor_id, note) VALUES ('ehs_record', ?, ?, 'SUBMITTED', 'submit', ?, ?)`,
      [id, ehs.status, user.id, note.trim()]
    );
    await conn.commit();
    return { status: 'SUBMITTED', historyId: hist.insertId };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

// EHS User/Administrator reviews a submitted record and records an
// outcome. Not region-scoped   EHS oversight is a global function.
//
// Flagged is a rejection, not a resting state: the record drops back to
// PENDING (not REVIEWED) so the engineer must redo the checklist/photos
// and resubmit   the work order's own Complete gate only clears on
// SUBMITTED/REVIEWED, so a flagged-then-pending record blocks it
// automatically. The flag itself is also logged onto the *work order's*
// own activity timeline (not just the EHS record's), so it's visible
// without having to go find the EHS record separately.
export async function reviewEhs(id, user, note, outcome) {
  if (!note || !note.trim()) throw new WorkflowError('A note describing the review is required', 400);
  if (!['Approved', 'Flagged'].includes(outcome)) throw new WorkflowError('outcome must be Approved or Flagged', 400);
  if (user.role !== 'Administrator' && user.role !== 'EHS User') throw new WorkflowError('Only an EHS User or Administrator can review EHS', 403);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const ehs = await loadEhs(id, conn);
    if (ehs.status !== 'SUBMITTED') throw new WorkflowError(`Cannot review EHS in status ${ehs.status}`, 409);

    const nextStatus = outcome === 'Flagged' ? 'PENDING' : 'REVIEWED';
    await conn.query(`UPDATE ehs_records SET status = ?, outcome = ?, reviewed_by = ?, reviewed_at = NOW(), review_note = ? WHERE id = ?`, [nextStatus, outcome, user.id, note.trim(), id]);
    const [hist] = await conn.query(
      `INSERT INTO ticket_history (entity_type, entity_id, from_status, to_status, action, actor_id, note) VALUES ('ehs_record', ?, 'SUBMITTED', ?, 'review', ?, ?)`,
      [id, nextStatus, user.id, `[${outcome}] ${note.trim()}`]
    );
    if (outcome === 'Flagged') {
      // Same "no status change" pattern as Update/Reassign: from = to =
      // the work order's current status, just adding a visible activity
      // entry without pretending the WO itself transitioned.
      await conn.query(
        `INSERT INTO ticket_history (entity_type, entity_id, from_status, to_status, action, actor_id, note) VALUES ('work_order', ?, ?, ?, 'ehs_flagged', ?, ?)`,
        [ehs.work_order_id, ehs.wo_status, ehs.wo_status, user.id, `EHS flagged   the assigned engineer must resubmit it before this work order can be completed. ${note.trim()}`]
      );
    }
    await conn.commit();
    return { status: nextStatus, outcome, historyId: hist.insertId };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}
