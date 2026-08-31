# Meridian HMS — Local Setup (XAMPP MySQL + Node API + React)

Three parts run together on your machine.

## 1. Database (XAMPP + phpMyAdmin)
1. Start **Apache + MySQL** in the XAMPP control panel.
2. Open **phpMyAdmin** → **Import** → select `database/schema.sql` → **Go**.
   Creates the `meridian_hms` database: every table, all primary/foreign keys, and realistic
   dummy data so it looks already-populated.

## 2. Backend API (Node/Express)
```bash
cd server
cp .env.example .env       # set DB_PASSWORD if your MySQL root has one
npm install
npm start                  # http://localhost:4000
```
Health check: `http://localhost:4000/api/health` → `{ "status": "ok", "db": "connected" }`.

## 3. Frontend (React/Vite)
```bash
cp .env.example .env        # in the project root — sets VITE_API_URL
npm install
npm run dev                 # http://localhost:3000
```
Log in on the new **Sign In** page (demo password: `password`, or click a demo-role chip).
If the API is offline the UI still runs on built-in demo data.

---

## What changed in this installment
- **Login page** + auth gate; **logout** in the profile menu; header **search + notification bell removed**.
- **Clinical Precision** design system: deep-navy sidebar, Plus Jakarta Sans + Inter fonts, amber accents.
- **MySQL schema** (`database/schema.sql`) — 45+ interlinked tables with FKs and seed data.
- **Node/Express API** (`server/`) — generic CRUD for every entity + `POST /api/appointments`
  (auto-creates a pending invoice) + `GET /api/patients/:id/record` (patient 360).
- **Patient Records** module (Administration): bio-data (hospital ID, blood group, genotype,
  national ID) + cross-department history (appointments, admissions, lab, pharmacy, billing) +
  pending-payment badge.
- **Biomedical** module: equipment register (CT, MRI, X-ray, mobile X-ray, ultrasound, endoscopy,
  ECG), fault ticketing with resolve/pending status, and a **weekly report** (pending vs resolved).
- **Appointments** now require an existing patient and **auto-raise a pending invoice** that shows in
  Finance and on the patient record.
- **Bed Management**: allocate/reserve now **selects a registered patient from a dropdown**.
- **OPD** status changes use a styled one-click **status-step** control; table actions use styled
  buttons/icon-buttons.
- **Reports** redesigned into an analytics dashboard (KPIs, admissions/discharge trend, demographics
  donut, department performance, efficiency gauges, custom report generator).
- Richer **patient registration** form (sectioned, with bio-data).

## Live data (auto-synced with MySQL)
On login the app calls the API; if it answers, data **loads from MySQL** and every change
(create / update / delete) is **persisted automatically** — no manual save. The dashboard shows a
green **"Live Data Sync"** badge (amber **"Demo Data"** when the API is off, so the UI still runs).

How it works: the server exposes UI-shaped endpoints at `/api/ui/:resource` (joins + column aliases
in `server/resources.js`), and the React store wraps each wired array in an auto-persisting setter
that diffs old vs new state and fires POST/PUT/DELETE. Pages didn't need to change.

**Fully live now (read + create + update + delete against MySQL):**
patients · appointments (+ auto invoice) · invoices · maintenance requests · work orders ·
preventive maintenance · safety audits · biomedical equipment · biomedical tickets · admissions ·
discharges · lab orders · prescriptions · theatre cases · suppliers · purchase requests · purchase orders.

**Still session-only for now** (endpoints exist; wiring is the next pass): nursing tasks, referrals,
inventory, pharmacy stock, departments, employees/HR, shifts, leave, users, permissions, wards/beds.
Also, nested detail rows (work-order checklists/materials, lab tests, prescription items, invoice
line-items) are **header-synced** — the record persists, the child lines are the follow-up.

Confirm it's live: register a patient or advance a maintenance ticket, then refresh that table in
phpMyAdmin — the row/updated status is there.
