// =====================================================================
// Meridian General Hospital — Node/Express + MySQL API
// Generic REST CRUD for every table + a few smart endpoints that keep
// departments in sync (patient 360 record, appointment → invoice).
// Run:  npm install  &&  npm start   (needs XAMPP MySQL running)
// =====================================================================
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool, ping } from './db.js';
import { RESOURCES as UI_RESOURCES } from './resources.js';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// ---- resource → table whitelist (prevents SQL injection on identifiers) ----
const RESOURCES = {
  patients: 'patients', 'patient-contacts': 'patient_contacts',
  appointments: 'appointments', visits: 'patient_visits',
  admissions: 'admissions', discharges: 'discharges', transfers: 'patient_transfers',
  wards: 'wards', beds: 'beds', rooms: 'rooms',
  employees: 'employees', users: 'users', departments: 'departments',
  shifts: 'shift_assignments', leave: 'leave_requests', attendance: 'attendance_logs',
  'nursing-tasks': 'nursing_tasks', referrals: 'referrals', 'theatre-cases': 'theatre_cases',
  'lab-orders': 'lab_orders', prescriptions: 'prescriptions', 'pharmacy-stock': 'pharmacy_stock',
  'maintenance-requests': 'maintenance_requests', 'work-orders': 'work_orders',
  'pm-plans': 'preventive_maintenance_plans', 'safety-audits': 'inspection_checklists',
  assets: 'assets', 'biomedical-equipment': 'biomedical_equipment', 'biomedical-tickets': 'biomedical_tickets',
  inventory: 'inventory_items', suppliers: 'suppliers',
  'purchase-requests': 'purchase_requests', 'purchase-orders': 'purchase_orders',
  invoices: 'invoices', 'invoice-items': 'invoice_items', payments: 'payments',
  notifications: 'notifications',
};

const table = (r) => RESOURCES[r];
const validCol = (c) => /^[a-zA-Z0-9_]+$/.test(c);

// ---------------------------------------------------------------------
// AUTH
// ---------------------------------------------------------------------
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await pool.query(
      `SELECT u.id,u.email,u.password_hash,r.name AS role,r.default_dashboard,e.full_name,e.department_id
       FROM users u JOIN roles r ON r.id=u.role_id LEFT JOIN employees e ON e.id=u.employee_id
       WHERE u.email=:email AND u.is_active=1`, { email });
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    const user = rows[0];
    // Demo: accept 'password' OR a matching bcrypt hash.
    const ok = password === 'password' || (await bcrypt.compare(password, user.password_hash).catch(() => false));
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    await pool.query('UPDATE users SET last_login=NOW() WHERE id=:id', { id: user.id });
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'dev', { expiresIn: '12h' });
    res.json({ token, user: { id: user.id, name: user.full_name, email: user.email, role: user.role, dashboard: user.default_dashboard } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---------------------------------------------------------------------
// PATIENT 360 RECORD — bio-data + everything linked across departments
// ---------------------------------------------------------------------
app.get('/api/patients/:id/record', async (req, res) => {
  const id = Number(req.params.id);
  try {
    const [[patient]] = await pool.query('SELECT * FROM patients WHERE id=:id', { id });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    const q = (sql) => pool.query(sql, { id }).then(([r]) => r);
    const [contacts, appointments, visits, admissions, labs, rx, invoices] = await Promise.all([
      q('SELECT * FROM patient_contacts WHERE patient_id=:id'),
      q(`SELECT a.*, e.full_name AS doctor, d.name AS department FROM appointments a
         LEFT JOIN employees e ON e.id=a.doctor_employee_id LEFT JOIN departments d ON d.id=a.department_id
         WHERE a.patient_id=:id ORDER BY a.appt_date DESC`),
      q(`SELECT v.*, d.name AS department FROM patient_visits v LEFT JOIN departments d ON d.id=v.department_id
         WHERE v.patient_id=:id ORDER BY v.arrived_at DESC`),
      q('SELECT * FROM admissions WHERE patient_id=:id ORDER BY admitted_at DESC'),
      q('SELECT * FROM lab_orders WHERE patient_id=:id ORDER BY id DESC'),
      q('SELECT * FROM prescriptions WHERE patient_id=:id ORDER BY id DESC'),
      q('SELECT * FROM invoices WHERE patient_id=:id ORDER BY invoice_date DESC'),
    ]);
    const outstanding = invoices.filter((i) => i.status !== 'Paid').reduce((s, i) => s + Number(i.total), 0);
    res.json({ patient, contacts, appointments, visits, admissions, labs, prescriptions: rx, invoices, outstanding });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---------------------------------------------------------------------
// APPOINTMENTS — creating one auto-generates a pending invoice (finance sync)
// ---------------------------------------------------------------------
app.post('/api/appointments', async (req, res) => {
  const b = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[p]] = await conn.query('SELECT id,insurance_type FROM patients WHERE id=:pid', { pid: b.patient_id });
    if (!p) throw new Error('patient_id must reference an existing patient');
    const fee = b.consultation_fee ?? 120;
    const payer = p.insurance_type === 'NHIS' ? 'NHIS' : (p.insurance_type === 'Private' ? 'Private' : 'Cash');
    const invNo = 'INVC-' + Date.now().toString().slice(-6);
    const apptNo = b.appointment_no || ('AP-' + Date.now().toString().slice(-5));
    const [inv] = await conn.query(
      `INSERT INTO invoices (invoice_no,patient_id,source_type,source_ref,payer,status,total,invoice_date)
       VALUES (:no,:pid,'Appointment',:ref,:payer,'Pending',:total,CURDATE())`,
      { no: invNo, pid: b.patient_id, ref: apptNo, payer, total: fee });
    await conn.query('INSERT INTO invoice_items (invoice_id,description,amount) VALUES (:iid,:d,:a)',
      { iid: inv.insertId, d: 'OPD consultation', a: fee });
    const [appt] = await conn.query(
      `INSERT INTO appointments (appointment_no,patient_id,doctor_employee_id,department_id,appt_date,appt_time,appt_type,status,invoice_id)
       VALUES (:no,:pid,:doc,:dept,:date,:time,:type,'Scheduled',:inv)`,
      { no: apptNo, pid: b.patient_id, doc: b.doctor_employee_id || null, dept: b.department_id || null,
        date: b.appt_date, time: b.appt_time, type: b.appt_type || 'New', inv: inv.insertId });
    await conn.commit();
    res.status(201).json({ id: appt.insertId, appointment_no: apptNo, invoice_id: inv.insertId, invoice_no: invNo, payment_status: 'Pending' });
  } catch (e) { await conn.rollback(); res.status(400).json({ error: e.message }); }
  finally { conn.release(); }
});

// ---------------------------------------------------------------------
// UI-SHAPE CRUD  /api/ui/:resource  (joined + aliased to React shapes)
// Registered BEFORE the generic routes so it takes precedence.
// ---------------------------------------------------------------------
const UI_TABLES = {
  'maintenance-requests': 'maintenance_requests', 'work-orders': 'work_orders',
  'pm-plans': 'preventive_maintenance_plans', 'safety-audits': 'inspection_checklists',
  'biomedical-equipment': 'biomedical_equipment', 'biomedical-tickets': 'biomedical_tickets',
  admissions: 'admissions', discharges: 'discharges', 'lab-orders': 'lab_orders',
  prescriptions: 'prescriptions', 'theatre-cases': 'theatre_cases', invoices: 'invoices',
  appointments: 'appointments', suppliers: 'suppliers', 'purchase-requests': 'purchase_requests',
  'purchase-orders': 'purchase_orders',
};

// Build a `col = value-or-subquery` assignment for one UI field.
function assign(uiKey, field) {
  if (field.fk) return `\`${field.col}\` = (SELECT id FROM \`${field.fk[0]}\` WHERE \`${field.fk[1]}\` = :${uiKey})`;
  return `\`${field.col}\` = :${uiKey}`;
}
// Collect params from body for the given UI keys ('' -> NULL).
function paramsFor(keys, body) {
  const p = {};
  for (const k of keys) p[k] = body[k] === '' || body[k] === undefined ? null : body[k];
  return p;
}

app.get('/api/ui/:resource', async (req, res) => {
  const cfg = UI_RESOURCES[req.params.resource];
  if (!cfg) return res.status(404).json({ error: 'Unknown resource' });
  try { const [rows] = await pool.query(cfg.list); res.json(rows); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/ui/:resource', async (req, res) => {
  const cfg = UI_RESOURCES[req.params.resource]; const table = UI_TABLES[req.params.resource];
  if (!cfg || !table) return res.status(404).json({ error: 'Unknown resource' });
  const keys = Object.keys(cfg.fields).filter((k) => req.body[k] !== undefined);
  if (!keys.length) return res.status(400).json({ error: 'No valid fields' });
  const sets = keys.map((k) => assign(k, cfg.fields[k])).join(', ');
  try {
    await pool.query(`INSERT INTO \`${table}\` SET ${sets}`, paramsFor(keys, req.body));
    res.status(201).json({ ok: true, id: req.body.id });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.put('/api/ui/:resource/:key', async (req, res) => {
  const cfg = UI_RESOURCES[req.params.resource]; const table = UI_TABLES[req.params.resource];
  if (!cfg || !table) return res.status(404).json({ error: 'Unknown resource' });
  const keys = Object.keys(cfg.fields).filter((k) => k !== 'id' && req.body[k] !== undefined);
  if (!keys.length) return res.json({ updated: false });
  const sets = keys.map((k) => assign(k, cfg.fields[k])).join(', ');
  try {
    await pool.query(`UPDATE \`${table}\` SET ${sets} WHERE \`${cfg.key}\` = :__key`,
      { ...paramsFor(keys, req.body), __key: req.params.key });
    res.json({ updated: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.delete('/api/ui/:resource/:key', async (req, res) => {
  const cfg = UI_RESOURCES[req.params.resource]; const table = UI_TABLES[req.params.resource];
  if (!cfg || !table) return res.status(404).json({ error: 'Unknown resource' });
  try {
    await pool.query(`DELETE FROM \`${table}\` WHERE \`${cfg.key}\` = :__key`, { __key: req.params.key });
    res.json({ deleted: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// ---------------------------------------------------------------------
// GENERIC CRUD  /api/:resource
// ---------------------------------------------------------------------
app.get('/api/:resource', async (req, res) => {
  const t = table(req.params.resource);
  if (!t) return res.status(404).json({ error: 'Unknown resource' });
  const limit = Math.min(Number(req.query.limit) || 500, 2000);
  try {
    const [rows] = await pool.query(`SELECT * FROM \`${t}\` LIMIT ${limit}`);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/:resource/:id', async (req, res) => {
  const t = table(req.params.resource);
  if (!t) return res.status(404).json({ error: 'Unknown resource' });
  try {
    const [rows] = await pool.query(`SELECT * FROM \`${t}\` WHERE id=:id`, { id: req.params.id });
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/:resource', async (req, res) => {
  const t = table(req.params.resource);
  if (!t) return res.status(404).json({ error: 'Unknown resource' });
  const cols = Object.keys(req.body).filter(validCol);
  if (!cols.length) return res.status(400).json({ error: 'No valid fields' });
  const set = cols.map((c) => `\`${c}\`=:${c}`).join(',');
  try {
    const [r] = await pool.query(`INSERT INTO \`${t}\` SET ${set}`, req.body);
    res.status(201).json({ id: r.insertId });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.put('/api/:resource/:id', async (req, res) => {
  const t = table(req.params.resource);
  if (!t) return res.status(404).json({ error: 'Unknown resource' });
  const cols = Object.keys(req.body).filter(validCol);
  if (!cols.length) return res.status(400).json({ error: 'No valid fields' });
  const set = cols.map((c) => `\`${c}\`=:${c}`).join(',');
  try {
    await pool.query(`UPDATE \`${t}\` SET ${set} WHERE id=:__id`, { ...req.body, __id: req.params.id });
    res.json({ updated: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.delete('/api/:resource/:id', async (req, res) => {
  const t = table(req.params.resource);
  if (!t) return res.status(404).json({ error: 'Unknown resource' });
  try {
    await pool.query(`DELETE FROM \`${t}\` WHERE id=:id`, { id: req.params.id });
    res.json({ deleted: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// ---------------------------------------------------------------------
app.get('/api/health', async (_req, res) => {
  try { await ping(); res.json({ status: 'ok', db: 'connected' }); }
  catch (e) { res.status(500).json({ status: 'error', error: e.message }); }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Meridian HMS API running on http://localhost:${PORT}`));
