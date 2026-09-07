# LEF MS API (Node + Express + MySQL)

Local stack: **XAMPP MySQL** (database) + **Node/Express** (this API) + **React/Vite** (frontend).
See the root `SETUP.md` for the full local setup (schema import + seed data).

## Auth
- `POST /api/auth/login`   body `{ email, password }`. Returns `{ token, user }`. Passwords are real
  bcrypt hashes (see `server/seed.js`)   there is no bypass.
- `GET /api/auth/me`   current user from the bearer token.
- Every other route requires `Authorization: Bearer <token>`; `authorize(...roles)` in `auth.js` gates
  role-restricted routes. A Supervisor is further scoped to their own `region_id` inside each route
  handler via `scopeRegion(req)` (Administrator, EHS User, Spare User and MS User are unscoped).

## Reference data
`GET /api/regions`, `GET /api/roles`   read-only lookups for forms.
`GET /api/sites`   the Site Database (see below).
`GET /api/users/engineers`   the Engineer dropdown for work-order/site forms.

## Site Database
`GET/POST /api/sites`, `GET/PUT/DELETE /api/sites/:id`   Site ID, Name, Region, Location, Priority and
Assigned Engineer; work orders auto-populate from here. `POST /api/sites/bulk-import` (multipart
`file`, an `.xlsx` with columns Site ID / Site Name / Region / Location / Priority / Assigned Engineer)
validates every row (region exists, engineer exists, no duplicate Site ID) before inserting anything,
and returns a per-row success/failure report.

## Work Orders (CM / PM / PLM)
One central table/route, `wo_type` distinguishes Corrective / Preventive / Planned:
- `GET /` (filters: `type`, `region`, `site`, `status`, `priority`, `engineer`, `mine=true`, `from`, `to`, `q`)
- `GET /:id`   full detail incl. site snapshot, EHS status, linked spare requests, PM checklist and history/attachments.
- `POST /`   `{ woType, siteId, title, description, engineerId, ... }`. Looks up the site, snapshots its
  fields onto the new row, generates the `<TYPE>-<YYYYMMDD>-<seq>` reference, copies the standing PM
  checklist (PM only), and **automatically creates the linked EHS record** (mandatory, 1:1) in the same
  transaction.
- `POST /:id/actions/:action`   the workflow engine (`server/workflow.js`). `action` is one of
  `accept | reject | complete | cancel | close | rework | reopen | update | reassign`. Body:
  `{ note, newEngineerId?, checklistResponses? }`. `complete` is blocked with a 409 unless the linked
  EHS record has reached `SUBMITTED` or `REVIEWED`. Every call is permission-checked (assigned engineer
  vs. that region's supervisor) and status-checked, then logged to `ticket_history`.
- `DELETE /:id`   Administrator only, and only while still in `CR` (Created) status.
- `POST /:id/comments`.

## EHS
Every work order gets one linked `ehs_records` row (`PENDING → SUBMITTED → REVIEWED`), with its own
checklist (`ehs_checklist`, copied from `ehs_checklist_templates` at work-order creation) and photo
attachments. `GET/POST/PUT/DELETE /api/ehs-checklist-templates` manages the standing questions
(Administrator / EHS User).

`GET /api/ehs-records` (filters: `status`, `region`, `site`, `engineer`, `type`; an Engineer only sees
their own) · `GET /:id` (incl. checklist + history) · `POST /:id/actions/submit` (assigned Engineer or
Admin; body `{ note, checklistResponses }`   every checklist question must be answered and at least one
photo already uploaded via `POST /api/attachments` with `entityType=ehs_record`, or it 400s) ·
`POST /:id/actions/review` (EHS User or Admin only; body `{ note, outcome: 'Approved'|'Flagged' }`). See
`server/ehsWorkflow.js`   a small dedicated engine, deliberately separate from the work order's own
CR/PR/CO/CL/RJ/CA machine.

## Spare Parts
`spare_items` (catalog + stock on hand): `GET/POST /api/spare-items`, `GET/PUT/DELETE /:id`,
`POST /:id/restock` (body `{ qty, note }`), `POST /bulk-import` (multipart `file`, `.xlsx` with columns
SKU/Name/Category/Unit/Unit Cost/Reorder Level/Quantity On Hand/Store Location   validates every row,
rejects duplicate SKUs, returns a per-row report).

`spare_requests` (linked to a work order + site): `GET /api/spare-requests` (filters `status`,
`workOrder`, `site`; an Engineer only sees their own) · `GET /:id` (incl. line items + history) ·
`POST /` (Engineer/Supervisor/Admin; body `{ workOrderId, note, items: [{spareItemId, qtyRequested}] }`)
· `POST /:id/actions/:action` (Spare User/Admin only) where `action` is `approve` | `reject` | `issue` |
`return` | `close`. `issue`/`return` take `{ note, items: [{requestItemId, qty}] }` and, in one
transaction per call, write a `spare_transactions` ledger row per line (`Issue`/`Return`) and adjust
`spare_request_items.qty_issued`/`qty_returned` and `spare_items.quantity_on_hand` together   traceable
back to item, request, work order, site, actor and timestamp. See `server/routes/spareRequests.js`.

## Assets
`GET/POST /api/assets`, `GET/PUT/DELETE /api/assets/:id`   one unified table, scoped by `site_id`.

## Attachments
`POST /api/attachments` (multipart: `entityType` [`work_order`|`ehs_record`|`spare_request`],
`entityId`, `stage`, `file`)   multer disk storage under `server/uploads/`, served statically at
`/uploads/...`. `GET /api/attachments?entityType=&entityId=`.

## Dashboard
- `GET /api/dashboard/overview`   Main Dashboard: totals, CM/PM/PLM breakdown, status mix, monthly
  trend, by-region breakdown, engineer performance, aging open work orders, assets by status.
- `GET /api/dashboard/ehs`   EHS Dashboard: status counts (Pending/Submitted/Reviewed), outcome counts
  and flagged rate, oldest pending/submitted records.
- `GET /api/dashboard/spares`   Spare Dashboard: request status counts, low-stock item count/list,
  oldest requests awaiting approval.

Every number is a live SQL aggregation   nothing is padded or hardcoded. All three respect `scopeRegion`.

## Reports
- `GET /api/reports/export/excel?type=&region=&status=&from=&to=`   streams a real `.xlsx` (raw work
  order rows, plus a PM Checklist Answers sheet).
- `GET /api/reports/export/ehs-excel?status=&region=&from=&to=`   raw EHS record rows.
- `GET /api/reports/export/spares-excel?type=&from=&to=`   two sheets: current inventory levels and the
  full transaction ledger.
- `GET /api/reports/export/pdf/:id`   one work order's full detail + stage history as a PDF.
- `POST /api/reports/export/pdf/bulk`   body `{ ids: [...] }`, streams a ZIP of the above.

## Users (Administrator only)
`GET/POST /api/users`, `PUT/DELETE /api/users/:id`. Prefer `PUT .../:id` with `{ isActive: false }`
over deleting a user who has work orders on record (delete fails with a 409 if referenced).
