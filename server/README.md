# Meridian HMS — Backend API (Node + Express + MySQL)

Local stack: **XAMPP MySQL** (database) + **Node/Express** (API) + **React/Vite** (frontend).

## 1. Create the database
1. Start **Apache + MySQL** in XAMPP.
2. Open **phpMyAdmin** → *Import* → choose `database/schema.sql` → *Go*.
   This creates the `meridian_hms` database with every table, all foreign keys, and dummy data.

## 2. Run the API
```bash
cd server
cp .env.example .env      # set DB_PASSWORD if your MySQL root has one
npm install
npm start                 # → http://localhost:4000
```
Check it: open `http://localhost:4000/api/health` → `{ "status": "ok", "db": "connected" }`.

## 3. Endpoints
- `POST /api/auth/login` — body `{ email, password }` (demo password: `password`). Returns a JWT + user.
- `GET /api/:resource` / `GET /:id` / `POST` / `PUT /:id` / `DELETE /:id` — generic CRUD.
  Resources: `patients, appointments, visits, admissions, discharges, wards, beds, employees,
  users, departments, shifts, leave, nursing-tasks, referrals, theatre-cases, lab-orders,
  prescriptions, pharmacy-stock, maintenance-requests, work-orders, pm-plans, safety-audits,
  assets, biomedical-equipment, biomedical-tickets, inventory, suppliers, purchase-requests,
  purchase-orders, invoices, invoice-items, payments, notifications`.
- `GET /api/patients/:id/record` — **Patient 360**: bio-data + appointments + visits + admissions +
  labs + prescriptions + invoices + outstanding balance (cross-department view).
- `POST /api/appointments` — creates the appointment **and** an auto-generated *Pending* invoice, so
  finance and the patient record instantly show the pending payment.

## 4. Point the frontend at the API
In the React project root create `.env`:
```
VITE_API_URL=http://localhost:4000/api
```
`src/api/client.js` reads this. With the API down, the app falls back to the built-in demo data,
so the UI always renders.
