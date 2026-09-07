import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { pool } from '../db.js';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, `${req.body.entityType || 'file'}-${req.body.entityId || '0'}-${Date.now()}-${safe}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 15 * 1024 * 1024 } });

const ENTITY_TYPES = ['work_order', 'ehs_record', 'spare_request', 'spare_transaction'];

const router = Router();

router.get('/', async (req, res) => {
  const { entityType, entityId } = req.query;
  if (!ENTITY_TYPES.includes(entityType) || !entityId) return res.status(400).json({ error: 'entityType and entityId are required' });
  const [rows] = await pool.query(
    `SELECT id, stage, file_name, file_path, uploaded_at, (SELECT full_name FROM users WHERE id = uploaded_by) AS uploaded_by
     FROM attachments WHERE entity_type = ? AND entity_id = ? ORDER BY uploaded_at ASC`,
    [entityType, entityId]
  );
  res.json(rows);
});

router.post('/', upload.single('file'), async (req, res) => {
  const { entityType, entityId, stage, historyId } = req.body || {};
  if (!ENTITY_TYPES.includes(entityType) || !entityId || !req.file) {
    return res.status(400).json({ error: 'entityType, entityId and a file are required' });
  }
  const [r] = await pool.query(
    `INSERT INTO attachments (entity_type, entity_id, history_id, stage, file_name, file_path, mime_type, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [entityType, entityId, historyId || null, stage || 'other', req.file.originalname, `/uploads/${req.file.filename}`, req.file.mimetype, req.user.id]
  );
  res.status(201).json({ id: r.insertId, fileName: req.file.originalname, filePath: `/uploads/${req.file.filename}` });
});

router.delete('/:id', async (req, res) => {
  const [rows] = await pool.query('SELECT file_path FROM attachments WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  await pool.query('DELETE FROM attachments WHERE id = ?', [req.params.id]);
  const full = path.join(process.cwd(), rows[0].file_path.replace(/^\/uploads\//, 'uploads/'));
  fs.unlink(full, () => {});
  res.json({ ok: true });
});

export default router;
