// =====================================================================
// UI-shape resource layer. Each entry describes how a normalized MySQL
// table is presented to (and written from) the React UI:
//   list   : SELECT that aliases/joins columns to the exact UI keys
//   key    : natural-key column (matches the UI object's `id`)
//   fields : UI key -> { col } or { col, fk:[table, srcCol] }
//            fk fields resolve a display name to a foreign-key id.
// The generic routes in index.js use this to build INSERT/UPDATE/DELETE.
// =====================================================================

const F = (col) => ({ col });                 // plain column
const FK = (col, table, srcCol) => ({ col, fk: [table, srcCol] }); // name -> id

export const RESOURCES = {
  // ---- FACILITY / MAINTENANCE ----
  'maintenance-requests': {
    key: 'ticket_no',
    list: `SELECT mr.ticket_no AS id, COALESCE(d.name,'') AS dept, mr.location, mr.room, '' AS bed,
             mr.equipment, mr.category, mr.priority, mr.reporter,
             DATE_FORMAT(mr.created_at,'%Y-%m-%d %H:%i') AS date, mr.status,
             COALESCE(e.full_name,'') AS assignedTo
           FROM maintenance_requests mr
           LEFT JOIN departments d ON d.id=mr.department_id
           LEFT JOIN employees e ON e.id=mr.assigned_to_id ORDER BY mr.id DESC`,
    fields: {
      id: F('ticket_no'), dept: FK('department_id', 'departments', 'name'), location: F('location'),
      room: F('room'), equipment: F('equipment'), category: F('category'), priority: F('priority'),
      reporter: F('reporter'), status: F('status'), assignedTo: FK('assigned_to_id', 'employees', 'full_name'),
    },
  },
  'work-orders': {
    key: 'wo_no',
    list: `SELECT wo.wo_no AS id, wo.title, wo.department AS dept, wo.location, wo.equipment, wo.category,
             wo.priority, COALESCE(e.full_name,'Unassigned') AS engineer,
             DATE_FORMAT(wo.due_date,'%Y-%m-%d') AS due, wo.status, wo.cost,
             COALESCE(mr.ticket_no,'') AS createdFrom
           FROM work_orders wo LEFT JOIN employees e ON e.id=wo.engineer_id
           LEFT JOIN maintenance_requests mr ON mr.id=wo.request_id ORDER BY wo.id DESC`,
    fields: {
      id: F('wo_no'), title: F('title'), dept: F('department'), location: F('location'),
      equipment: F('equipment'), category: F('category'), priority: F('priority'),
      engineer: FK('engineer_id', 'employees', 'full_name'), due: F('due_date'), status: F('status'), cost: F('cost'),
      createdFrom: FK('request_id', 'maintenance_requests', 'ticket_no'),
    },
  },
  'pm-plans': {
    key: 'plan_no',
    list: `SELECT pm.plan_no AS id, pm.asset_name AS asset, pm.category, pm.frequency,
             COALESCE(e.full_name,'') AS engineer, DATE_FORMAT(pm.next_due,'%Y-%m-%d') AS nextDue,
             COALESCE(DATE_FORMAT(pm.last_done,'%Y-%m-%d'),'—') AS lastDone, pm.status
           FROM preventive_maintenance_plans pm LEFT JOIN employees e ON e.id=pm.engineer_id ORDER BY pm.id DESC`,
    fields: {
      id: F('plan_no'), asset: F('asset_name'), category: F('category'), frequency: F('frequency'),
      engineer: FK('engineer_id', 'employees', 'full_name'), nextDue: F('next_due'), status: F('status'),
    },
  },
  'safety-audits': {
    key: 'ref_no',
    list: `SELECT ic.ref_no AS id, ic.area, ic.type, COALESCE(e.full_name,'') AS inspector,
             DATE_FORMAT(ic.inspect_date,'%Y-%m-%d') AS date, ic.score, ic.status, ic.findings
           FROM inspection_checklists ic LEFT JOIN employees e ON e.id=ic.inspector_id ORDER BY ic.id DESC`,
    fields: {
      id: F('ref_no'), area: F('area'), type: F('type'), inspector: FK('inspector_id', 'employees', 'full_name'),
      date: F('inspect_date'), score: F('score'), status: F('status'), findings: F('findings'),
    },
  },
  'biomedical-equipment': {
    key: 'asset_tag',
    list: `SELECT asset_tag AS id, name, category, location, manufacturer, status,
             DATE_FORMAT(last_serviced,'%Y-%m-%d') AS lastServiced, DATE_FORMAT(next_service,'%Y-%m-%d') AS nextService
           FROM biomedical_equipment ORDER BY id DESC`,
    fields: {
      id: F('asset_tag'), name: F('name'), category: F('category'), location: F('location'),
      manufacturer: F('manufacturer'), status: F('status'), lastServiced: F('last_serviced'), nextService: F('next_service'),
    },
  },
  'biomedical-tickets': {
    key: 'ticket_no',
    list: `SELECT bt.ticket_no AS id, be.asset_tag AS equipmentId, COALESCE(be.name,'') AS equipment,
             COALESCE(be.category,'') AS category, bt.reported_by AS reportedBy, bt.fault, bt.priority, bt.status,
             COALESCE(e.full_name,'') AS assignedTo, DATE_FORMAT(bt.reported_at,'%Y-%m-%d %H:%i') AS reportedAt,
             COALESCE(DATE_FORMAT(bt.resolved_at,'%Y-%m-%d %H:%i'),'') AS resolvedAt
           FROM biomedical_tickets bt LEFT JOIN biomedical_equipment be ON be.id=bt.equipment_id
           LEFT JOIN employees e ON e.id=bt.assigned_to_id ORDER BY bt.id DESC`,
    fields: {
      id: F('ticket_no'), equipmentId: FK('equipment_id', 'biomedical_equipment', 'asset_tag'),
      reportedBy: F('reported_by'), fault: F('fault'), priority: F('priority'), status: F('status'),
      assignedTo: FK('assigned_to_id', 'employees', 'full_name'), resolvedAt: F('resolved_at'),
    },
  },

  // ---- CLINICAL ----
  admissions: {
    key: 'admission_no',
    list: `SELECT a.admission_no AS id, CONCAT(p.first_name,' ',p.last_name) AS patient, p.patient_no AS patientId,
             w.code AS ward, b.code AS bed, COALESCE(e.full_name,'') AS doctor,
             DATE_FORMAT(a.admitted_at,'%Y-%m-%d %H:%i') AS admittedAt, a.diagnosis, a.deposit,
             DATEDIFF(CURDATE(), a.admitted_at) AS los, a.status
           FROM admissions a LEFT JOIN patients p ON p.id=a.patient_id LEFT JOIN wards w ON w.id=a.ward_id
           LEFT JOIN beds b ON b.id=a.bed_id LEFT JOIN employees e ON e.id=a.doctor_employee_id ORDER BY a.id DESC`,
    fields: {
      id: F('admission_no'), patientId: FK('patient_id', 'patients', 'patient_no'),
      doctor: FK('doctor_employee_id', 'employees', 'full_name'), diagnosis: F('diagnosis'),
      deposit: F('deposit'), status: F('status'),
    },
  },
  discharges: {
    key: 'discharge_no',
    list: `SELECT d.discharge_no AS id, CONCAT(p.first_name,' ',p.last_name) AS patient, p.patient_no AS patientId,
             COALESCE(d.admission_id,'') AS admissionId, w.code AS ward,
             DATE_FORMAT(d.discharged_at,'%Y-%m-%d %H:%i') AS dischargedAt, d.summary,
             DATE_FORMAT(d.follow_up_date,'%Y-%m-%d') AS followUp, d.bill_status AS billStatus
           FROM discharges d LEFT JOIN patients p ON p.id=d.patient_id
           LEFT JOIN admissions a ON a.id=d.admission_id LEFT JOIN wards w ON w.id=a.ward_id ORDER BY d.id DESC`,
    fields: {
      id: F('discharge_no'), patientId: FK('patient_id', 'patients', 'patient_no'),
      summary: F('summary'), followUp: F('follow_up_date'), billStatus: F('bill_status'),
    },
  },
  'lab-orders': {
    key: 'order_no',
    list: `SELECT lo.order_no AS id, CONCAT(p.first_name,' ',p.last_name) AS patient, p.patient_no AS patientId,
             COALESCE(e.full_name,'') AS orderedBy, lo.priority, lo.status,
             COALESCE(lo.collected_at,'') AS collectedAt, COALESCE(lo.result,'') AS result
           FROM lab_orders lo LEFT JOIN patients p ON p.id=lo.patient_id
           LEFT JOIN employees e ON e.id=lo.ordered_by_id ORDER BY lo.id DESC`,
    fields: {
      id: F('order_no'), patientId: FK('patient_id', 'patients', 'patient_no'),
      orderedBy: FK('ordered_by_id', 'employees', 'full_name'), priority: F('priority'),
      status: F('status'), collectedAt: F('collected_at'), result: F('result'),
    },
  },
  prescriptions: {
    key: 'rx_no',
    list: `SELECT rx.rx_no AS id, CONCAT(p.first_name,' ',p.last_name) AS patient, p.patient_no AS patientId,
             COALESCE(e.full_name,'') AS prescriber, COALESCE(rx.rx_time,'') AS time, rx.status
           FROM prescriptions rx LEFT JOIN patients p ON p.id=rx.patient_id
           LEFT JOIN employees e ON e.id=rx.prescriber_id ORDER BY rx.id DESC`,
    fields: {
      id: F('rx_no'), patientId: FK('patient_id', 'patients', 'patient_no'),
      prescriber: FK('prescriber_id', 'employees', 'full_name'), time: F('rx_time'), status: F('status'),
    },
  },
  'theatre-cases': {
    key: 'case_no',
    list: `SELECT tc.case_no AS id, CONCAT(p.first_name,' ',p.last_name) AS patient, p.patient_no AS patientId,
             tc.procedure_name AS \`procedure\`, COALESCE(e.full_name,'') AS surgeon, tc.theatre_room AS theatre,
             DATE_FORMAT(tc.scheduled_date,'%Y-%m-%d') AS date, TIME_FORMAT(tc.scheduled_time,'%H:%i') AS time,
             tc.est_duration AS duration, tc.status, tc.team
           FROM theatre_cases tc LEFT JOIN patients p ON p.id=tc.patient_id
           LEFT JOIN employees e ON e.id=tc.surgeon_employee_id ORDER BY tc.id DESC`,
    fields: {
      id: F('case_no'), patientId: FK('patient_id', 'patients', 'patient_no'), procedure: F('procedure_name'),
      surgeon: FK('surgeon_employee_id', 'employees', 'full_name'), theatre: F('theatre_room'),
      date: F('scheduled_date'), time: F('scheduled_time'), duration: F('est_duration'), status: F('status'), team: F('team'),
    },
  },

  // ---- FINANCE ----
  invoices: {
    key: 'invoice_no',
    list: `SELECT inv.invoice_no AS id, CONCAT(p.first_name,' ',p.last_name) AS patient, p.patient_no AS patientId,
             inv.payer, DATE_FORMAT(inv.invoice_date,'%Y-%m-%d') AS date, inv.status, inv.total
           FROM invoices inv LEFT JOIN patients p ON p.id=inv.patient_id ORDER BY inv.id DESC`,
    fields: { id: F('invoice_no'), payer: F('payer'), status: F('status'), total: F('total') },
  },
  appointments: {
    key: 'appointment_no',
    list: `SELECT a.appointment_no AS id, CONCAT(p.first_name,' ',p.last_name) AS patient, p.patient_no AS patientId,
             COALESCE(e.full_name,'') AS doctor, COALESCE(d.name,'') AS dept,
             DATE_FORMAT(a.appt_date,'%Y-%m-%d') AS date, TIME_FORMAT(a.appt_time,'%H:%i') AS time,
             a.appt_type AS type, a.status, COALESCE(inv.invoice_no,'') AS invoiceId
           FROM appointments a LEFT JOIN patients p ON p.id=a.patient_id LEFT JOIN employees e ON e.id=a.doctor_employee_id
           LEFT JOIN departments d ON d.id=a.department_id LEFT JOIN invoices inv ON inv.id=a.invoice_id ORDER BY a.id DESC`,
    // create is handled by the custom /api/appointments endpoint; here we allow status update + delete
    fields: { id: F('appointment_no'), status: F('status') },
  },

  // ---- SUPPLY CHAIN ----
  suppliers: {
    key: 'code',
    list: `SELECT code AS id, name, category, contact, rating, status FROM suppliers ORDER BY id DESC`,
    fields: { id: F('code'), name: F('name'), category: F('category'), contact: F('contact'), rating: F('rating'), status: F('status') },
  },
  'purchase-requests': {
    key: 'pr_no',
    list: `SELECT pr_no AS id, item, qty, department AS dept, requested_by AS requestedBy,
             DATE_FORMAT(request_date,'%Y-%m-%d') AS date, est_cost AS est, status FROM purchase_requests ORDER BY id DESC`,
    fields: {
      id: F('pr_no'), item: F('item'), qty: F('qty'), dept: F('department'), requestedBy: F('requested_by'),
      date: F('request_date'), est: F('est_cost'), status: F('status'),
    },
  },
  'purchase-orders': {
    key: 'po_no',
    list: `SELECT po.po_no AS id, COALESCE(s.name,'') AS supplier, po.items, po.total,
             DATE_FORMAT(po.order_date,'%Y-%m-%d') AS date, COALESCE(pr.pr_no,'') AS linkedPR, po.status
           FROM purchase_orders po LEFT JOIN suppliers s ON s.id=po.supplier_id
           LEFT JOIN purchase_requests pr ON pr.id=po.linked_pr_id ORDER BY po.id DESC`,
    fields: {
      id: F('po_no'), supplier: FK('supplier_id', 'suppliers', 'name'), items: F('items'), total: F('total'),
      date: F('order_date'), linkedPR: FK('linked_pr_id', 'purchase_requests', 'pr_no'), status: F('status'),
    },
  },
};

// Nested arrays the UI expects but the header list SQL does not return.
// Client fills these with [] for DB-loaded rows so modals don't break.
export const NESTED_DEFAULTS = {
  'work-orders': { checklist: [], materials: [], comments: [], history: [] },
  'lab-orders': { tests: [] },
  prescriptions: { items: [] },
  'theatre-cases': { checklist: [] },
  'pm-plans': { checklist: [] },
  invoices: { services: [] },
};
