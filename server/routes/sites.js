// Site Database   the authoritative source Work Orders auto-populate
// from (site id/name/region/location/priority/assigned engineer).
import { Router } from 'express';
import multer from 'multer';
import ExcelJS from 'exceljs';
import { pool } from '../db.js';
import { authorize, scopeRegion } from '../auth.js';
import { sendError } from '../workflow.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const router = Router();

const SELECT = `
  SELECT s.id, s.site_code, s.name, s.region_id, r.name AS region_name, r.code AS region_code,
         s.location, s.priority, s.assigned_engineer_id, eu.full_name AS assigned_engineer_name,
         s.is_active, s.created_at
  FROM sites s JOIN regions r ON r.id = s.region_id
  LEFT JOIN users eu ON eu.id = s.assigned_engineer_id
`;

router.get('/', async (req, res) => {
  const region = scopeRegion(req);
  const where = []; const params = [];
  if (region) { where.push('s.region_id = ?'); params.push(region); }
  if (req.query.q) { where.push('(s.name LIKE ? OR s.site_code LIKE ?)'); params.push(`%${req.query.q}%`, `%${req.query.q}%`); }
  if (req.query.active !== 'all') where.push('s.is_active = 1');
  const sql = `${SELECT} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY s.name`;
  const [rows] = await pool.query(sql, params);
  res.json(rows.map(shape));
});

router.get('/:id', async (req, res) => {
  const [rows] = await pool.query(`${SELECT} WHERE s.id = ?`, [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Site not found' });
  res.json(shape(rows[0]));
});

router.post('/', authorize('Administrator'), async (req, res) => {
  const b = req.body || {};
  if (!b.siteCode || !b.name || !b.regionId) return res.status(400).json({ error: 'siteCode, name and regionId are required' });
  try {
    const [r] = await pool.query(
      `INSERT INTO sites (site_code, name, region_id, location, priority, assigned_engineer_id) VALUES (?, ?, ?, ?, ?, ?)`,
      [b.siteCode, b.name, b.regionId, b.location || null, b.priority || 'Medium', b.assignedEngineerId || null]
    );
    res.status(201).json({ id: r.insertId });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Site ID already exists' });
    sendError(res, e);
  }
});

router.put('/:id', authorize('Administrator'), async (req, res) => {
  const b = req.body || {};
  const fields = { name: b.name, region_id: b.regionId, location: b.location, priority: b.priority, assigned_engineer_id: b.assignedEngineerId, is_active: b.isActive !== undefined ? (b.isActive ? 1 : 0) : undefined };
  const sets = []; const params = [];
  for (const [col, val] of Object.entries(fields)) { if (val !== undefined) { sets.push(`${col} = ?`); params.push(val); } }
  if (!sets.length) return res.status(400).json({ error: 'No fields to update' });
  params.push(req.params.id);
  await pool.query(`UPDATE sites SET ${sets.join(', ')} WHERE id = ?`, params);
  res.json({ ok: true });
});

router.delete('/:id', authorize('Administrator'), async (req, res) => {
  try {
    await pool.query('DELETE FROM sites WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    if (e.code?.startsWith('ER_ROW_IS_REFERENCED')) return res.status(409).json({ error: 'This site has work orders or assets on record   deactivate it instead of deleting.' });
    sendError(res, e);
  }
});

// Bulk import via Excel upload. Columns (header row, case-insensitive):
// Site ID | Site Name | Region | Location | Priority | Assigned Engineer (staff no. or email)
// Validates every row before inserting any   returns a per-row report,
// never silently creates a partially-invalid record.
router.post('/bulk-import', authorize('Administrator'), upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'An Excel file is required' });

  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(req.file.buffer);
  } catch {
    return res.status(400).json({ error: 'Could not read that file as an Excel workbook (.xlsx)' });
  }
  const sheet = workbook.worksheets[0];
  if (!sheet) return res.status(400).json({ error: 'The workbook has no sheets' });

  const [regions] = await pool.query('SELECT id, name, code FROM regions');
  const regionByName = new Map(regions.map((r) => [r.name.toLowerCase(), r]));
  const regionByCode = new Map(regions.map((r) => [r.code.toLowerCase(), r]));
  const [engineers] = await pool.query(`SELECT u.id, u.staff_no, u.email FROM users u JOIN roles r ON r.id = u.role_id WHERE r.name = 'Engineer'`);
  const engineerByStaffNo = new Map(engineers.map((e) => [e.staff_no.toLowerCase(), e]));
  const engineerByEmail = new Map(engineers.map((e) => [e.email.toLowerCase(), e]));
  const [existingSites] = await pool.query('SELECT site_code FROM sites');
  const existingCodes = new Set(existingSites.map((s) => s.site_code.toLowerCase()));

  const headerRow = sheet.getRow(1).values.map((v) => (v || '').toString().trim().toLowerCase());
  const col = (label) => headerRow.findIndex((h) => h === label);
  const idx = {
    siteId: col('site id'), name: col('site name'), region: col('region'),
    location: col('location'), priority: col('priority'), engineer: col('assigned engineer'),
  };
  if (idx.siteId < 0 || idx.name < 0 || idx.region < 0) {
    return res.status(400).json({ error: 'Expected columns: Site ID, Site Name, Region (Location, Priority, Assigned Engineer optional)' });
  }

  const results = []; const toInsert = []; const seenInFile = new Set();
  for (let rowNum = 2; rowNum <= sheet.rowCount; rowNum++) {
    const row = sheet.getRow(rowNum);
    if (row.values.length === 0) continue;
    const cell = (i) => (i >= 0 ? row.getCell(i).value : null);
    const siteCode = (cell(idx.siteId) || '').toString().trim();
    const name = (cell(idx.name) || '').toString().trim();
    const regionRaw = (cell(idx.region) || '').toString().trim();
    if (!siteCode && !name) continue; // skip blank rows

    const errors = [];
    if (!siteCode) errors.push('Missing Site ID');
    if (!name) errors.push('Missing Site Name');
    if (!regionRaw) errors.push('Missing Region');
    const region = regionByName.get(regionRaw.toLowerCase()) || regionByCode.get(regionRaw.toLowerCase());
    if (regionRaw && !region) errors.push(`Unknown region "${regionRaw}"`);
    if (siteCode && (existingCodes.has(siteCode.toLowerCase()) || seenInFile.has(siteCode.toLowerCase()))) errors.push(`Duplicate Site ID "${siteCode}"`);

    let engineerId = null;
    const engineerRaw = idx.engineer >= 0 ? (cell(idx.engineer) || '').toString().trim() : '';
    if (engineerRaw) {
      const eng = engineerByStaffNo.get(engineerRaw.toLowerCase()) || engineerByEmail.get(engineerRaw.toLowerCase());
      if (!eng) errors.push(`Unknown engineer "${engineerRaw}"`);
      else engineerId = eng.id;
    }

    const priorityRaw = idx.priority >= 0 ? (cell(idx.priority) || '').toString().trim() : '';
    const priority = ['Low', 'Medium', 'High', 'Critical'].find((p) => p.toLowerCase() === priorityRaw.toLowerCase()) || 'Medium';

    if (errors.length) {
      results.push({ row: rowNum, siteCode, status: 'failed', errors });
    } else {
      seenInFile.add(siteCode.toLowerCase());
      toInsert.push({ siteCode, name, regionId: region.id, location: (idx.location >= 0 ? cell(idx.location) : null) || null, priority, engineerId });
      results.push({ row: rowNum, siteCode, status: 'ok' });
    }
  }

  if (toInsert.length) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      for (const s of toInsert) {
        await conn.query(
          `INSERT INTO sites (site_code, name, region_id, location, priority, assigned_engineer_id) VALUES (?, ?, ?, ?, ?, ?)`,
          [s.siteCode, s.name, s.regionId, s.location, s.priority, s.engineerId]
        );
      }
      await conn.commit();
    } catch (e) {
      await conn.rollback();
      return sendError(res, e);
    } finally {
      conn.release();
    }
  }

  res.json({
    total: results.length,
    inserted: toInsert.length,
    failed: results.filter((r) => r.status === 'failed').length,
    results,
  });
});

function shape(s) {
  return {
    id: s.id, siteCode: s.site_code, name: s.name,
    regionId: s.region_id, regionName: s.region_name, regionCode: s.region_code,
    location: s.location, priority: s.priority,
    assignedEngineerId: s.assigned_engineer_id, assignedEngineerName: s.assigned_engineer_name,
    isActive: !!s.is_active, createdAt: s.created_at,
  };
}

export default router;
