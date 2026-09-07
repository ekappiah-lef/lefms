// SMSOnlineGH integration (https://dev.smsonlinegh.com/docs).
//   POST https://api.smsonlinegh.com/v5/message/sms/send
//   form-urlencoded: key, text, type=0 (plain/GSM default), sender, to
//   (comma-separated numbers), Accept: application/json.
// Every attempt   success or failure   is logged to sms_log for an audit
// trail and so the "pending 10+ days" alert can dedupe (send once ever).
import { pool } from './db.js';

const SMS_API_URL = 'https://api.smsonlinegh.com/v5/message/sms/send';

function cleanPhone(phone) {
  return String(phone || '').replace(/[^\d+]/g, '');
}

async function logAttempt({ workOrderId, eventType, recipientType, recipientLabel, phone, status, response }) {
  try {
    await pool.query(
      `INSERT INTO sms_log (work_order_id, event_type, recipient_type, recipient_label, phone, status, response) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [workOrderId || null, eventType, recipientType, recipientLabel, phone, status, response ? String(response).slice(0, 2000) : null]
    );
  } catch (e) {
    console.error('Failed to write sms_log row:', e.message);
  }
}

// to: a phone string or array of phone strings (sent as one comma-joined
// request, per the provider's API   still logged as a single ledger row).
export async function sendSms({ to, text, recipientType, recipientLabel, workOrderId, eventType }) {
  const recipients = (Array.isArray(to) ? to : [to]).map(cleanPhone).filter(Boolean);
  if (!recipients.length) return { ok: false, reason: 'no phone number on file' };

  const apiKey = process.env.SMS_API_KEY;
  const sender = process.env.SMS_SENDER_ID;
  if (!apiKey || !sender) {
    await logAttempt({ workOrderId, eventType, recipientType, recipientLabel, phone: recipients.join(','), status: 'failed', response: 'SMS_API_KEY/SMS_SENDER_ID not configured' });
    return { ok: false, reason: 'SMS not configured' };
  }

  let responseBody = '';
  let ok = false;
  try {
    const res = await fetch(SMS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: new URLSearchParams({ key: apiKey, text, type: '0', sender, to: recipients.join(',') }),
    });
    responseBody = await res.text();
    ok = res.ok;
  } catch (e) {
    responseBody = e.message;
    ok = false;
  }

  await logAttempt({ workOrderId, eventType, recipientType, recipientLabel, phone: recipients.join(','), status: ok ? 'sent' : 'failed', response: responseBody });
  return { ok, response: responseBody };
}
