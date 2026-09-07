// Who gets texted, and when. Three triggers:
//   1. A work order is created -> its assigned engineer (their own phone
//      number, already on file   no group needed).
//   2. A High/Critical work order is created -> every Group configured
//      for 'wo_high_critical', optionally scoped to one region.
//   3. A work order has sat in Created/In Process for 10+ days -> every
//      Group configured for 'wo_pending' for that region, once per work
//      order ever (see checkPendingWorkOrders' dedup query).
import { pool } from './db.js';
import { sendSms } from './sms.js';

const PENDING_DAYS = 10;

export async function alertEngineerAssigned({ id: workOrderId, woNo, title, engineerId }) {
  try {
    const [[eng]] = await pool.query('SELECT full_name, phone FROM users WHERE id = ?', [engineerId]);
    if (!eng?.phone) return;
    const text = `LEF MS: Work order ${woNo} "${title}" has been assigned to you.`;
    await sendSms({ to: eng.phone, text, recipientType: 'engineer', recipientLabel: eng.full_name, workOrderId, eventType: 'wo_assigned' });
  } catch (e) {
    console.error('alertEngineerAssigned failed:', e.message);
  }
}

async function groupsFor(eventType, regionId) {
  const [rows] = await pool.query(
    `SELECT DISTINCT g.id, g.name FROM sms_configs c JOIN sms_groups g ON g.id = c.group_id
     WHERE c.event_type = ? AND c.is_active = 1 AND (c.region_id IS NULL OR c.region_id = ?)`,
    [eventType, regionId]
  );
  return rows;
}

async function membersOf(groupId) {
  const [rows] = await pool.query('SELECT name, phone FROM sms_group_members WHERE group_id = ?', [groupId]);
  return rows;
}

async function textGroups(groups, { text, workOrderId, eventType }) {
  for (const g of groups) {
    const members = await membersOf(g.id);
    for (const m of members) {
      await sendSms({ to: m.phone, text, recipientType: 'group', recipientLabel: `${g.name} / ${m.name}`, workOrderId, eventType });
    }
  }
}

export async function alertHighCritical({ id: workOrderId, woNo, title, priority, regionId, siteName }) {
  if (!['High', 'Critical'].includes(priority)) return;
  try {
    const groups = await groupsFor('wo_high_critical', regionId);
    if (!groups.length) return;
    const text = `LEF MS: ${priority.toUpperCase()} work order ${woNo} created at ${siteName} - "${title}".`;
    await textGroups(groups, { text, workOrderId, eventType: 'wo_high_critical' });
  } catch (e) {
    console.error('alertHighCritical failed:', e.message);
  }
}

export async function checkPendingWorkOrders() {
  try {
    const [rows] = await pool.query(
      `SELECT w.id, w.wo_no, w.title, w.region_id, w.site_name,
              TIMESTAMPDIFF(DAY, w.created_at, NOW()) AS ageDays
       FROM work_orders w
       WHERE w.status IN ('CR','PR') AND w.created_at <= DATE_SUB(NOW(), INTERVAL ? DAY)
         AND NOT EXISTS (SELECT 1 FROM sms_log l WHERE l.work_order_id = w.id AND l.event_type = 'wo_pending' AND l.status = 'sent')`,
      [PENDING_DAYS]
    );
    for (const w of rows) {
      const groups = await groupsFor('wo_pending', w.region_id);
      if (!groups.length) continue;
      const text = `LEF MS: Work order ${w.wo_no} "${w.title}" at ${w.site_name} has been pending for ${w.ageDays} days.`;
      await textGroups(groups, { text, workOrderId: w.id, eventType: 'wo_pending' });
    }
  } catch (e) {
    console.error('checkPendingWorkOrders failed:', e.message);
  }
}
