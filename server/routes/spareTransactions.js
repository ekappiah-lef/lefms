// Direct (off-process) Spare Parts movements   a site engineer bypasses
// the formal Request -> Approve -> Issue chain (e.g. swaps a switch
// on-site using a spare they already had) and the warehouse needs to
// record the part going out (Direct Issue) or the old part coming back
// (Direct Return) against a Site rather than a Work Order/Spare Request.
// Still an append-only ledger row alongside the stock change, same as
// every other spare_transactions write in this app.
//
// Either side of this can be an item that isn't in our own catalog at
// all   a site swaps in whatever part it had on hand, or a vendor ships
// something straight to a site. In that case there's no spare_item_id
// and no stock effect; the spare parts manager just types the item name
// so the movement is still logged and traceable.
import { Router } from 'express';
import { pool } from '../db.js';
import { authorizeModule } from '../permissions.js';
import { sendError } from '../workflow.js';

const router = Router();

router.get('/', async (req, res) => {
  const where = []; const params = [];
  if (req.query.type) { where.push('t.type = ?'); params.push(req.query.type); }
  if (req.query.site) { where.push('t.site_id = ?'); params.push(req.query.site); }
  if (req.query.item) { where.push('t.spare_item_id = ?'); params.push(req.query.item); }
  if (req.query.from) { where.push('t.created_at >= ?'); params.push(req.query.from); }
  if (req.query.to) { where.push('t.created_at <= ?'); params.push(req.query.to); }
  const [rows] = await pool.query(
    `SELECT t.id, t.type, t.qty, t.note, t.created_at,
            t.spare_item_id, si.sku, COALESCE(si.name, t.item_name) AS item_name, si.unit,
            t.site_id, s.site_code, s.name AS site_name,
            t.work_order_id, w.wo_no,
            u.full_name AS performed_by,
            (SELECT COUNT(*) FROM attachments WHERE entity_type = 'spare_transaction' AND entity_id = t.id) AS attachment_count
     FROM spare_transactions t
     LEFT JOIN spare_items si ON si.id = t.spare_item_id
     LEFT JOIN sites s ON s.id = t.site_id
     LEFT JOIN work_orders w ON w.id = t.work_order_id
     JOIN users u ON u.id = t.performed_by
     ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
     ORDER BY t.created_at DESC LIMIT 500`, params
  );
  res.json(rows.map((r) => ({
    id: r.id, type: r.type, qty: r.qty, note: r.note, createdAt: r.created_at,
    spareItemId: r.spare_item_id, sku: r.sku || null, itemName: r.item_name, unit: r.unit || null,
    siteId: r.site_id, siteCode: r.site_code, siteName: r.site_name,
    workOrderId: r.work_order_id, woNo: r.wo_no, performedBy: r.performed_by,
    attachmentCount: r.attachment_count,
  })));
});

async function directMove(req, res, { type, sign }) {
  const b = req.body || {};
  const qty = Number(b.qty);
  const itemName = (b.itemName || '').trim();
  if (!b.siteId || !qty || qty <= 0) return res.status(400).json({ error: 'siteId and a positive qty are required' });
  if (!b.spareItemId && !itemName) return res.status(400).json({ error: 'Select a catalog item, or enter an item name' });
  if (!b.note || !b.note.trim()) return res.status(400).json({ error: 'A note is required' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[site]] = await conn.query('SELECT id FROM sites WHERE id = ?', [b.siteId]);
    if (!site) throw Object.assign(new Error('Site not found'), { status: 404 });

    // A catalog item affects our stock; a free-text item never was in
    // our inventory, so there's nothing to adjust   just a logged movement.
    let itemId = null;
    if (b.spareItemId) {
      const [[item]] = await conn.query('SELECT id, quantity_on_hand FROM spare_items WHERE id = ? FOR UPDATE', [b.spareItemId]);
      if (!item) throw Object.assign(new Error('Spare item not found'), { status: 404 });
      if (sign < 0 && qty > item.quantity_on_hand) {
        throw Object.assign(new Error(`Cannot send ${qty}   only ${item.quantity_on_hand} in stock`), { status: 409 });
      }
      await conn.query('UPDATE spare_items SET quantity_on_hand = quantity_on_hand + ? WHERE id = ?', [sign * qty, item.id]);
      itemId = item.id;
    }

    const [r] = await conn.query(
      `INSERT INTO spare_transactions (spare_item_id, item_name, type, qty, site_id, performed_by, note) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [itemId, itemId ? null : itemName, type, qty, site.id, req.user.id, b.note.trim()]
    );
    await conn.commit();
    res.status(201).json({ id: r.insertId });
  } catch (e) {
    await conn.rollback();
    sendError(res, e);
  } finally {
    conn.release();
  }
}

// Send a spare directly to a site, with no Spare Request behind it.
router.post('/direct-issue', authorizeModule('spare_transactions', 'manage'), (req, res) => directMove(req, res, { type: 'Direct Issue', sign: -1 }));

// Receive a spare back from a site (e.g. the old part after a bypassed
// swap), with no Spare Request behind it.
router.post('/direct-return', authorizeModule('spare_transactions', 'manage'), (req, res) => directMove(req, res, { type: 'Direct Return', sign: 1 }));

export default router;
