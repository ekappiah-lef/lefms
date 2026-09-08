// Read-only view of the sms_log ledger (server/sms.js / smsAlerts.js insert
// into it, nothing here ever writes)   which alerts went out, to what
// number, and whether SMSOnlineGH accepted or rejected them.
import { Router } from 'express';
import { pool } from '../db.js';
import { authorizeModule } from '../permissions.js';

const router = Router();

router.get('/', authorizeModule('sms', 'view'), async (req, res) => {
  const where = []; const params = [];
  if (req.query.status) { where.push('s.status = ?'); params.push(req.query.status); }
  if (req.query.eventType) { where.push('s.event_type = ?'); params.push(req.query.eventType); }
  if (req.query.recipientType) { where.push('s.recipient_type = ?'); params.push(req.query.recipientType); }
  if (req.query.from) { where.push('s.created_at >= ?'); params.push(req.query.from); }
  if (req.query.to) { where.push('s.created_at <= ?'); params.push(req.query.to); }
  const sql = `SELECT s.id, s.work_order_id, w.wo_no, s.event_type, s.recipient_type, s.recipient_label,
                      s.phone, s.status, s.response, s.created_at
               FROM sms_log s LEFT JOIN work_orders w ON w.id = s.work_order_id
               ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY s.created_at DESC LIMIT 500`;
  const [rows] = await pool.query(sql, params);
  res.json(rows.map((r) => ({
    id: r.id, workOrderId: r.work_order_id, woNo: r.wo_no, eventType: r.event_type,
    recipientType: r.recipient_type, recipientLabel: r.recipient_label, phone: r.phone,
    status: r.status, response: r.response, createdAt: r.created_at,
  })));
});

export default router;
