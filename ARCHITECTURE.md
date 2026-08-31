# Meridian Hospital Management & Operations Platform — Architecture

**Author:** Senior Hospital Systems Architect / UX / Product / React
**Status:** Pilot build (Phase 1) delivered · expansion roadmap through Phase 3
**Stack:** React 19 · Vite 6 · Tailwind CSS v4 · lucide-react · Recharts · Motion

This document accompanies the working pilot in `/src`. It covers all 21 required outputs. The pilot is a *modular hospital operations platform*, not a maintenance system with extra pages: patient flow, bed management, HR and facility operations are first-class, and every remaining hospital domain (pharmacy, laboratory, theatre, finance, procurement, inventory, admissions, discharges) is wired into navigation, permissions and the data model as an activatable module.

---

## 1. Platform Sitemap

```
Login  (Phase 2 auth; pilot uses in-app role switcher)
│
└── App Shell  (Sidebar + Header + role-aware router)
    │
    ├── Dashboard              → resolves by role:
    │     • Executive roles    → General Hospital Dashboard
    │     • Front Desk Officer → Front Desk Dashboard
    │     • OPD / Doctor       → OPD Dashboard
    │     • Nurse / Ward Mgr   → Ward Dashboard
    │     • Maintenance Mgr    → Maintenance Dashboard
    │     • HR Officer         → HR Dashboard
    │     • Engineer / Biomed  → Engineer Mobile Workspace
    │
    ├── PATIENT SERVICES
    │     Front Desk · Appointments · OPD/Patient Flow · Patient Queue
    │     Admissions* · Discharges*
    │
    ├── CLINICAL OPERATIONS
    │     Wards · Bed Management · Nursing* · Doctors*
    │     Theatre* · Laboratory* · Pharmacy*
    │
    ├── FACILITY OPERATIONS
    │     Maintenance Requests · Work Orders · Preventive Maintenance
    │     Safety Audits · Assets* · Engineers · My Jobs (Mobile)
    │
    ├── ADMINISTRATION
    │     Human Resources · Staff Attendance · Shift Management
    │     Leave Management · Inventory* · Procurement* · Finance*
    │
    ├── REPORTS
    │     Hospital Reports · Maintenance Reports · HR Reports
    │
    └── SYSTEM
          Users* · Roles* · Departments* · Permissions* · Settings*

All modules above are now BUILT and functional (no remaining placeholders). Two roles were
added — Pharmacist and Lab Scientist — each landing on their own department workspace.
```

### End-to-end links now live
- Bed fault → auto-creates a maintenance ticket and flags the bed (Bed Management, Assets)
- Maintenance request → converts to a work order (Maintenance Requests)
- Preventive plan → generates a work order (Preventive Maintenance)
- Admit patient → occupies bed; discharge → frees bed (→ Cleaning), writes a discharge record and a billing entry (Admissions → Discharges → Finance)
- Inventory low-stock → raises a purchase request → approved in Procurement → PO received
- Lab orders & prescriptions linked to patients; assets linked to their work orders
- Users → Employees → Departments → Roles → Permissions driven entirely by `config/platform.js`

The sitemap is data-driven: it is generated from the `MODULES` registry in `src/config/platform.js`. Adding a hospital domain later means adding one registry entry plus a page component — nothing else in the shell changes.

---

## 2. Role & Permission Structure

Access control is **role-based** with a **department binding** on every user. The model has two layers:

1. **Module visibility** — each module in the registry declares `roles: '*'` (everyone) or an explicit allow-list. `canAccess(role, moduleId)` is the single gate used by the sidebar (what you can see), the router (what you can open) and role-switching (safe redirect).
2. **Landing dashboard** — `landingDashboard(role)` routes each role to the right home screen so the first post-login screen is relevant to the job.

| Role | Landing | Representative access |
|---|---|---|
| Hospital Administrator | General Dashboard | Everything |
| System Administrator | General Dashboard | Everything + System |
| Medical Director | General Dashboard | All clinical + reports |
| Department Head | General Dashboard | Dashboards + reports |
| Front Desk Officer | Front Desk Dashboard | Front Desk, Appointments, Patient Queue, raise Requests |
| OPD Officer | OPD Dashboard | OPD flow, Queue, Appointments, Admissions/Discharges |
| Doctor | OPD Dashboard | OPD, Doctors, Appointments, Queue |
| Nurse | Ward Dashboard | Wards, Bed Mgmt, Nursing, raise Requests |
| Ward Manager | Ward Dashboard | Wards, Bed Mgmt, Nursing, Admissions/Discharges, Shifts |
| Maintenance Manager | Maintenance Dashboard | Requests, Work Orders, PM, Safety, Assets, Engineers, Reports |
| Engineer | Mobile Workspace | Assigned jobs, mobile work orders, checklists, requests |
| Biomedical Engineer | Mobile Workspace | Assigned jobs, work orders, assets, requests |
| HR Officer | HR Dashboard | Employees, Attendance, Shifts, Leave, HR Reports |
| Inventory Officer | Inventory* | Inventory, Procurement |
| Finance Officer | Finance* | Finance, Procurement |

**Action-level permissions** (view / create / approve / assign / verify) are enforced in the pages today via role checks (e.g. only Maintenance Manager/Admin can approve, assign and convert requests). Phase 2 promotes these to a `permissions` table so they are configurable without code (see schema §17).

---

## 3. General Hospital Dashboard

`src/pages/dashboards/GeneralDashboard.jsx` — the executive command centre. It computes live values from the shared store, so it always reflects the current state of every other module.

- **16 KPI cards:** Total Patients Today, Waiting, In OPD, Admitted, Discharged Today, Emergency Cases, Available Beds, Occupied Beds, Appointments Today, Open Maintenance, Critical Issues, Engineers on Duty, Staff Present, Staff on Leave, Pending HR Requests, Total Wards. Cards for maintenance/HR are click-through to their modules.
- **Visual sections:** OPD Attendance Trend (area), Maintenance Tickets by Status (donut), Patient Flow by Department (bar), Bed Occupancy by Ward (stacked bar), Admissions vs Discharges 7-day (line), Hospital Activity Timeline, Department Performance (progress bars), Upcoming Appointments.

The layout follows the house pattern: **KPI grid → chart row → chart row → timeline/performance/lists**, so management understands the whole hospital without opening a single module.

---

## 4. Department Dashboards

Each department gets a purpose-built dashboard that changes with the logged-in user (`src/pages/dashboards/`):

- **Front Desk** — registrations today, walk-ins, waiting, upcoming appointments, visitors on-site; a 6-tile quick-action launcher (register, search, book, check-in, visitor, ticket); live visitors, deliveries and reception tickets.
- **OPD** — waiting, being attended, completed, doctors available, average wait, priority patients; a live consultation queue with per-patient priority/status.
- **Ward** — total/available/occupied/reserved/cleaning/maintenance beds, ward staff on duty, ward & equipment requests, and a compact colour-coded bed overview per ward.
- **Maintenance** — open work orders, pending requests, critical tickets, PM due, engineers available/on assignment, completed work, downtime; requests-by-category chart and recent requests.
- **HR** — total employees, present/absent/on-leave, new hires, pending leave; department-headcount chart and pending leave list.
- **Administration** — the General Dashboard doubles as the administration view (hospital activity summary, department performance, bed occupancy, patient volume, staff availability, maintenance performance, alerts).

---

## 5. Sidebar Navigation

`src/components/Sidebar.jsx` — dark enterprise sidebar, collapsible to an icon rail. Sections (**Patient Services, Clinical Operations, Facility Operations, Administration, Reports, System**) are collapsible groups rendered **only for modules the role can access**. Placeholder modules show a "SOON" tag. A persistent "New Request" quick action sits at the foot. Brand block shows the hospital identity.

---

## 6–16. Screen Inventory (built in the pilot)

| # | Screen | File | Highlights |
|---|---|---|---|
| 6 | Front Desk | `pages/FrontDesk.jsx` | Register patient (auto patient no.), search, profile modal, visitor register + check-out, deliveries, service-ticket creator (9 preset faults) → routes to help desk |
| 7 | OPD / Patient Flow | `pages/OPD.jsx` | Flow table (11 cols), stage-advance action, patient modal with 7 tabs (Overview, Visit History, Current Visit, Notes, Transfers, Appointments, Documents), transfer to Lab/Pharmacy/Ward/Discharge |
| 8 | Patient Queue | `pages/PatientQueue.jsx` | Live queue ordered by wait time, one-tap stage advance, longest-wait KPI |
| 9 | Ward & Bed Management | `pages/BedManagement.jsx`, `pages/Wards.jsx` | Visual bed layout + table toggle, 7 bed statuses, allocate/reserve/release/clean, **report fault → auto-creates maintenance ticket and flags bed**; ward directory with occupancy bars |
| 10 | Maintenance Requests | `pages/MaintenanceRequests.jsx` | Full ticket lifecycle (9 states), filters, detail modal, assign engineer, escalate, advance, **convert to work order** |
| 11 | Work Orders | `pages/WorkOrders.jsx` | Table + modal with 7 tabs (Overview, Checklist, Comments, Attachments, Materials, Cost, History), interactive checklist, status progression |
| 12 | Engineer Mobile View | `pages/EngineerMobile.jsx` | Phone-framed workspace, filter chips (New/In Progress/Emergency/Completed), large job cards, big-button actions (Accept, Start, Hold, Before/After photo, Parts, Notes, Complete, Request Verify), PM task list |
| 13 | Preventive Maintenance | `pages/PreventiveMaintenance.jsx` | KPI cards, table + week calendar toggle, plan modal with checklist, **generate work order**, overdue/due-today states |
| 14 | HR | `pages/HR.jsx` | Employee register, department filter, profile modal, add employee (auto staff ID) |
| 15 | Shift Management | `pages/ShiftManagement.jsx` | Rosters, doctors/nurses/engineers on duty, coverage by shift, assign-shift modal |
| — | Staff Attendance | `pages/StaffAttendance.jsx` | Present/absent/on-leave, mark attendance |
| — | Leave Management | `pages/LeaveManagement.jsx` | Requests with approve/reject workflow |
| — | Appointments | `pages/Appointments.jsx` | Scheduling, check-in, complete, cancel, new-appointment modal |
| 16 | Reports | `pages/Reports.jsx` | Report catalog (hospital/maintenance/HR), date + department filters, chart preview + summary table, Print / Excel / PDF actions |
| 17 | Safety Audits | `pages/SafetyAudits.jsx` | Inspection scores, findings, pass / action-required |

All screens reuse the same primitives, so they look and behave consistently.

---

## 17. Database Schema Proposal (relational, multi-hospital ready)

Every operational table carries `organization_id` and (where relevant) `hospital_id` so the platform scales to multiple facilities. Suggested engine: PostgreSQL.

**Tenancy & facility**
- `organizations(id, name)`
- `hospitals(id, organization_id→organizations, name, code, city)`
- `buildings(id, hospital_id, name)`
- `floors(id, building_id, name, level)`
- `departments(id, hospital_id, name, head_user_id, cost_centre)`
- `wards(id, hospital_id, floor_id, name, type, staff_capacity)`
- `rooms(id, ward_id, name)`
- `beds(id, ward_id, room_id, code, status, current_patient_id)`  *status ∈ Available/Occupied/Reserved/Cleaning/Maintenance/Isolation/Unavailable*

**Identity & access**
- `users(id, organization_id, employee_id, email, password_hash, is_active)`
- `roles(id, name, default_dashboard)`
- `permissions(id, module_key, action)`  *action ∈ view/create/edit/approve/assign/verify*
- `user_roles(user_id, role_id)`
- `role_permissions(role_id, permission_id, department_scope)`

**Workforce (HR)**
- `employees(id, hospital_id, staff_id, full_name, job_role, phone, qualification, employment_status, hired_on)`
- `employee_departments(employee_id, department_id, is_primary)`
- `shifts(id, name, start_time, end_time)`  *Morning/Afternoon/Night/On-Call/Custom*
- `shift_assignments(id, employee_id, shift_id, ward_id, date, status)`
- `leave_requests(id, employee_id, type, from_date, to_date, days, status, approver_id)`
- `attendance_logs(id, employee_id, date, clock_in, clock_out, present)`

**Patients & flow**
- `patients(id, hospital_id, patient_no, full_name, dob, gender, phone, address, insurance)`
- `patient_contacts(id, patient_id, kind, name, phone)`  *next-of-kin / emergency*
- `appointments(id, patient_id, doctor_id, department_id, date, time, type, status)`
- `patient_visits(id, patient_id, visit_type, priority, reason, arrived_at, department_id)`
- `patient_queue(id, visit_id, stage, status, assigned_doctor_id, room, waiting_minutes)`
- `admissions(id, patient_id, ward_id, bed_id, admitting_doctor_id, admitted_at, diagnosis)`
- `discharges(id, admission_id, discharged_at, summary, follow_up_appointment_id)`
- `patient_transfers(id, patient_id, from_location, to_location, reason, moved_at, moved_by)`
- `bed_allocations(id, bed_id, patient_id, allocated_at, released_at)`

**Facility & maintenance**
- `maintenance_requests(id, hospital_id, department_id, location, room, bed_id, equipment, category, priority, description, reporter_id, status, created_at)`
- `work_orders(id, request_id, title, department_id, location, equipment, priority, engineer_id, due_date, status, cost)`
- `work_order_assignments(id, work_order_id, engineer_id, assigned_at)`
- `work_order_comments(id, work_order_id, author_id, body, created_at)`
- `work_order_attachments(id, work_order_id, kind, url)`  *before/after photos, docs*
- `work_order_history(id, work_order_id, event, created_at)`
- `preventive_maintenance_plans(id, asset_id, category, frequency, engineer_id, next_due, last_done)`
- `preventive_maintenance_tasks(id, plan_id, generated_work_order_id, due_date, status)`
- `inspection_checklists(id, area, type, inspector_id, date, score, status, findings)`
- `assets(id, hospital_id, tag, name, category, location, warranty_expiry)`
- `equipment(id, asset_id, model, serial, biomedical_flag)`

**Supply chain (Phase 2/3)**
- `inventory_items(id, hospital_id, sku, name, category, uom, quantity, reorder_level, batch, expiry)`

**Platform**
- `notifications(id, user_id, body, entity_type, entity_id, read, created_at)`
- `audit_logs(id, user_id, action, entity_type, entity_id, before, after, created_at)`

Key relationships: a **bed fault** creates a `maintenance_request` linked to the `bed`; a request **converts** to a `work_order` (`work_orders.request_id`); a PM plan **generates** work orders (`preventive_maintenance_tasks.generated_work_order_id`); a `user` links to exactly one `employee`, which links to departments, shifts, facility and ward — satisfying the "users linked to Employee/Department/Role/Team/Shift/Facility/Ward" requirement.

---

## 18. Reusable React Component Architecture

A single primitives module, `src/components/ui.jsx`, is the design system:

- `Kpi`, `KpiGrid` — metric cards + responsive grid
- `PageHeader` — title/subtitle/actions
- `SectionCard` — chart/list container
- `Button` — primary/ghost/danger/success/subtle × sm/md/lg
- `FilterBar`, `Select` — search + dropdown filters
- `Table`, `Tr`, `Td` — consistent tables with empty state
- `Modal` — header/body/footer, size variants
- `Tabs` — tabbed detail views
- `Field` — label/value pair for read views
- `Badge` + `toneFor()` — a **single status→colour map** (green success / amber pending / red critical / blue active / purple isolation / slate neutral) so every status pill in the app is coloured identically
- `Placeholder` — the standard "Phase 2" module scaffold

`Sidebar` and `Header` are the shell. Every page is a thin composition of these primitives following the **KPI Cards → Search/Filters → Table → Details Modal → Actions** pattern, which is why the app feels uniform.

State: the pilot uses a lifted **store** object in `App.jsx` (React `useState` arrays for patients, wards, requests, work orders, employees, shifts, leave, appointments, visitors, deliveries, PM tasks, inspections, projects) passed down as `store`. Mutations in one module (e.g. reporting a bed fault) propagate live to every dashboard and table. Phase 2 swaps this for a data layer (React Query + REST/GraphQL) behind the same `store` interface with minimal page changes.

---

## 19. Suggested Folder Structure

```
src/
├── App.jsx                     # shell + role-aware router + global store
├── main.jsx
├── index.css                   # Tailwind entry
├── config/
│   └── platform.js             # MODULES registry, roles, permissions, nav, landing
├── data/
│   └── mockData.js             # seed data (mirrors DB tables)
├── components/
│   ├── ui.jsx                  # design-system primitives
│   ├── Sidebar.jsx
│   └── Header.jsx
└── pages/
    ├── dashboards/
    │   ├── GeneralDashboard.jsx
    │   ├── FrontDeskDashboard.jsx
    │   ├── OPDDashboard.jsx
    │   ├── WardDashboard.jsx
    │   ├── MaintenanceDashboard.jsx
    │   └── HRDashboard.jsx
    ├── FrontDesk.jsx  OPD.jsx  PatientQueue.jsx  Appointments.jsx
    ├── BedManagement.jsx  Wards.jsx
    ├── MaintenanceRequests.jsx  WorkOrders.jsx  PreventiveMaintenance.jsx
    ├── SafetyAudits.jsx  Engineers.jsx  EngineerMobile.jsx
    ├── HR.jsx  StaffAttendance.jsx  ShiftManagement.jsx  LeaveManagement.jsx
    ├── Reports.jsx
    └── GenericPlaceholder.jsx   # renders any placeholder module
```

Phase-2 target adds `src/api/` (data clients), `src/hooks/`, `src/context/AuthContext.jsx`, and splits `mockData` into per-domain fixtures.

---

## 20. Enterprise UI / Mockup Design

- **Layout:** fixed dark sidebar (collapsible icon rail) + sticky header (breadcrumb, global search, notifications, role switcher) + max-width content canvas on light-grey (`slate-50`).
- **Palette:** `slate-950` sidebar, white cards, `blue-600` primary actions, `emerald` success, `amber` pending, `red` critical, `purple` isolation.
- **Type & density:** compact enterprise scale — bold black headings, 10–13px body, uppercase micro-labels, generous card padding.
- **Consistency rules honoured:** same card, same table, same modal everywhere; icons used sparingly and only where they aid scanning; no page reinvents the layout; the KPI→Filter→Table→Modal→Action rhythm repeats across all modules.
- **Responsive:** KPI grids reflow 2→6 columns; the engineer view is an explicitly phone-framed, thumb-friendly interface with large tap targets.

---

## 21. React / JavaScript Implementation Plan

**Phase 1 — Pilot (delivered)**
Modular shell, role-based nav & permissions, General + 6 department dashboards, Front Desk & registration, OPD patient flow + patient modal, Patient Queue, Appointments, Bed & Ward Management with fault→ticket, Maintenance Requests with full lifecycle + convert-to-WO, Work Orders with tabbed modal, Preventive Maintenance with calendar + generate-WO, Safety Audits, Engineers, Engineer Mobile workspace, HR, Attendance, Shifts, Leave, Reports. Design system + seed data.

**Phase 2 — Backend & clinical depth (next)**
1. Auth (JWT + real login), replace role switcher; `AuthContext`.
2. API layer: PostgreSQL + REST/GraphQL against the §17 schema; React Query; keep the `store` shape so pages barely change.
3. Promote permissions to the `permissions`/`role_permissions` tables with an admin UI (System modules).
4. Activate Admissions, Discharges, Nursing, Doctors from placeholders (data model already defined).
5. Notifications service + audit logging.
6. File uploads for work-order before/after photos and patient documents.

**Phase 3 — Full hospital suite**
Pharmacy (dispensing + cold chain), Laboratory (orders → results), Theatre (scheduling + WHO checklist), Inventory & Procurement (PR/PO/GRN, low-stock alerts), Finance (billing, NHIS/insurance claims), then a light clinical EMR layer on top of the existing patient-flow spine.

**Cross-cutting:** unit tests (Vitest) for permission logic and store reducers; Playwright smoke tests per role; export services for real PDF/Excel; i18n; audit and RBAC hardening.

---

### How to run
```bash
npm install     # first time / when node_modules is from another OS
npm run dev      # http://localhost:3000
```
Use the **role switcher** in the top-right header to see how navigation, the landing dashboard, and available actions change per role — this demonstrates the role-based access model end to end.
