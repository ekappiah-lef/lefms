// Shared "create one work order" transaction body   used by the plain
// Work Order create route AND by Trouble Ticket -> "Create Work Order",
// so both paths get the exact same site snapshot, EHS auto-creation and
// PM checklist copy, never two copies of this logic drifting apart.
import { placeholderTicketNo, finalizeTicketNo } from './ticketNumbers.js';

// site: { id, site_code, name, region_id, region_name, location, priority }
export async function createWorkOrderTx(conn, { woType, site, assetId, title, description, priority, frequency, nextDue, lastDone, plannedDate, createdBy, engineerId }) {
  const [r] = await conn.query(
    `INSERT INTO work_orders
       (wo_no, wo_type, site_id, site_code, site_name, region_id, region_name, site_location, site_priority,
        asset_id, title, description, priority, frequency, next_due, last_done, planned_date, created_by, engineer_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [placeholderTicketNo(), woType, site.id, site.site_code, site.name, site.region_id, site.region_name, site.location, site.priority,
     assetId || null, title, description, priority || 'Medium',
     woType === 'PM' ? (frequency || 'Monthly') : null, woType === 'PM' ? nextDue : null, lastDone || null,
     woType === 'PLM' ? plannedDate : null, createdBy, engineerId]
  );
  const woId = r.insertId;
  const woNo = await finalizeTicketNo(conn, 'work_orders', 'wo_no', woType, woId);

  if (woType === 'PM') {
    const [templates] = await conn.query('SELECT question FROM wo_checklist_templates WHERE is_active = 1 ORDER BY sort_order, id');
    for (const t of templates) {
      await conn.query('INSERT INTO work_order_checklist (work_order_id, task, response) VALUES (?, ?, NULL)', [woId, t.question]);
    }
  }

  // Every work order gets one linked EHS record   mandatory, never
  // created separately by the user (spec: "EHS mandatory per WO").
  const [ehsR] = await conn.query(
    `INSERT INTO ehs_records (ehs_no, work_order_id, status) VALUES (?, ?, 'PENDING')`,
    [placeholderTicketNo(), woId]
  );
  await finalizeTicketNo(conn, 'ehs_records', 'ehs_no', 'EHS', ehsR.insertId);
  const [ehsTemplates] = await conn.query('SELECT question FROM ehs_checklist_templates WHERE is_active = 1 ORDER BY sort_order, id');
  for (const t of ehsTemplates) {
    await conn.query('INSERT INTO ehs_checklist (ehs_record_id, question, response) VALUES (?, ?, NULL)', [ehsR.insertId, t.question]);
  }

  await conn.query(
    `INSERT INTO ticket_history (entity_type, entity_id, from_status, to_status, action, actor_id, note) VALUES ('work_order', ?, NULL, 'CR', 'Create', ?, ?)`,
    [woId, createdBy, 'Work order created and assigned.']
  );

  return { id: woId, woNo };
}
