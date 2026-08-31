// =====================================================================
// EXTENDED HOSPITAL DATA — clinical, supply-chain, finance & system
// domains. Everything here cross-links to the core data in mockData.js
// (patients, beds, employees) so the whole hospital is connected.
// =====================================================================

// ---------------------------------------------------------------------
// ADDITIONAL USERS / ROLES (pharmacy, lab, finance-desk)
// ---------------------------------------------------------------------
export const EXTRA_USERS = [
  { id: 'U-14', name: 'Abena Kufuor',  role: 'Pharmacist',   department: 'Pharmacy',   avatar: 'AK' },
  { id: 'U-15', name: 'Kojo Baffour',  role: 'Lab Scientist', department: 'Laboratory', avatar: 'KJ' },
];

// ---------------------------------------------------------------------
// ADMISSIONS  (patient → ward → bed → doctor)
// ---------------------------------------------------------------------
export const ADMISSION_STATUSES = ['Admitted', 'Pending Discharge', 'Discharged'];

export const INITIAL_ADMISSIONS = [
  { id: 'ADM-3001', patient: 'Daniel Appiah',   patientId: 'P-100241', ward: 'Ward A', bed: 'A01', doctor: 'Dr. Kojo Amankwah', admittedAt: '2026-07-19 07:00', diagnosis: 'Severe pneumonia', los: 0, status: 'Admitted', deposit: 500 },
  { id: 'ADM-3002', patient: 'Emmanuel Quaye',  patientId: 'P-100237', ward: 'ICU',    bed: 'ICU1', doctor: 'Dr. Kojo Amankwah', admittedAt: '2026-07-19 08:10', diagnosis: 'RTA — polytrauma', los: 0, status: 'Admitted', deposit: 2000 },
  { id: 'ADM-3003', patient: 'Akosua Nyarko',   patientId: 'P-100250', ward: 'Maternity', bed: 'M01', doctor: 'Dr. Naomi Asante', admittedAt: '2026-07-17 21:30', diagnosis: 'Labour — spontaneous delivery', los: 2, status: 'Pending Discharge', deposit: 800 },
  { id: 'ADM-3004', patient: 'John Tetteh',     patientId: 'P-100251', ward: 'ICU',    bed: 'ICU2', doctor: 'Dr. Kojo Amankwah', admittedAt: '2026-07-16 14:00', diagnosis: 'Post-op monitoring', los: 3, status: 'Admitted', deposit: 2500 },
  { id: 'ADM-3005', patient: 'Ama Serwaa',      patientId: 'P-100252', ward: 'Ward P', bed: 'P07', doctor: 'Dr. Priya Nair',    admittedAt: '2026-07-18 10:15', diagnosis: 'Paediatric gastroenteritis', los: 1, status: 'Admitted', deposit: 400 },
];

export const INITIAL_DISCHARGES = [
  { id: 'DIS-4001', patient: 'Vida Amoah', patientId: 'P-100253', admissionId: 'ADM-2990', ward: 'Maternity', dischargedAt: '2026-07-19 09:30', summary: 'Delivered healthy baby; mother stable.', followUp: '2026-07-26', billStatus: 'Paid' },
  { id: 'DIS-4002', patient: 'Kwesi Boadu', patientId: 'P-100261', admissionId: 'ADM-2985', ward: 'Ward A', dischargedAt: '2026-07-18 16:00', summary: 'Malaria treated; discharged on orals.', followUp: '2026-07-25', billStatus: 'NHIS Claim' },
];

// ---------------------------------------------------------------------
// NURSING TASKS  (ward → bed → patient → nurse)
// ---------------------------------------------------------------------
export const INITIAL_NURSING_TASKS = [
  { id: 'NT-01', patient: 'Daniel Appiah', ward: 'Ward A', bed: 'A01', task: 'Vitals check', due: '12:00', nurse: 'Ama Owusu', priority: 'Routine', status: 'Pending' },
  { id: 'NT-02', patient: 'Daniel Appiah', ward: 'Ward A', bed: 'A01', task: 'Administer IV antibiotics', due: '12:30', nurse: 'Ama Owusu', priority: 'High', status: 'Pending' },
  { id: 'NT-03', patient: 'Emmanuel Quaye', ward: 'ICU', bed: 'ICU1', task: 'Hourly neuro obs', due: '12:00', nurse: 'Patience Owusu', priority: 'Critical', status: 'Pending' },
  { id: 'NT-04', patient: 'Ama Serwaa', ward: 'Ward P', bed: 'P07', task: 'Oral rehydration round', due: '11:30', nurse: 'Ama Owusu', priority: 'Routine', status: 'Done' },
  { id: 'NT-05', patient: 'John Tetteh', ward: 'ICU', bed: 'ICU2', task: 'Wound dressing', due: '13:00', nurse: 'Patience Owusu', priority: 'High', status: 'Pending' },
  { id: 'NT-06', patient: 'Akosua Nyarko', ward: 'Maternity', bed: 'M01', task: 'Discharge teaching', due: '14:00', nurse: 'Ama Owusu', priority: 'Routine', status: 'Pending' },
];

// ---------------------------------------------------------------------
// DOCTOR REFERRALS / CONSULTATIONS
// ---------------------------------------------------------------------
export const INITIAL_REFERRALS = [
  { id: 'REF-01', patient: 'Joseph Mensah', from: 'Dr. Priya Nair', toDept: 'Cardiology', reason: 'Chest pain — needs ECG & echo', date: '2026-07-19', status: 'Pending' },
  { id: 'REF-02', patient: 'Ibrahim Sule', from: 'Dr. Kojo Amankwah', toDept: 'Laboratory', reason: 'HbA1c & lipid panel', date: '2026-07-19', status: 'Accepted' },
  { id: 'REF-03', patient: 'Abena Frimpong', from: 'Dr. Priya Nair', toDept: 'Imaging', reason: 'Head CT to exclude bleed', date: '2026-07-19', status: 'Pending' },
];

// ---------------------------------------------------------------------
// THEATRE / SURGERY SCHEDULE
// ---------------------------------------------------------------------
export const THEATRE_STATUSES = ['Scheduled', 'Pre-Op', 'In Theatre', 'Recovery', 'Completed', 'Cancelled'];

export const INITIAL_THEATRE_CASES = [
  { id: 'OT-01', patient: 'Emmanuel Quaye', patientId: 'P-100237', procedure: 'ORIF — femur fracture', surgeon: 'Dr. Kojo Amankwah', theatre: 'Theatre 1', date: '2026-07-19', time: '13:00', duration: '2h', status: 'Pre-Op', team: 'Anaesthetist, 2 scrub nurses', checklist: ['Consent signed', 'Site marked', 'WHO sign-in', 'Antibiotic prophylaxis'] },
  { id: 'OT-02', patient: 'Selina Doe', patientId: 'P-100264', procedure: 'Appendectomy', surgeon: 'Dr. Naomi Asante', theatre: 'Theatre 2', date: '2026-07-19', time: '15:30', duration: '1h', status: 'Scheduled', team: 'Anaesthetist, 1 scrub nurse', checklist: ['Consent signed', 'Fasting confirmed', 'WHO sign-in'] },
  { id: 'OT-03', patient: 'Nii Armah', patientId: 'P-100263', procedure: 'Hernia repair', surgeon: 'Dr. Kojo Amankwah', theatre: 'Theatre 1', date: '2026-07-20', time: '09:00', duration: '1.5h', status: 'Scheduled', team: 'Anaesthetist, 2 scrub nurses', checklist: ['Consent signed', 'Pre-op bloods'] },
];

// ---------------------------------------------------------------------
// LABORATORY ORDERS
// ---------------------------------------------------------------------
export const LAB_STATUSES = ['Ordered', 'Sample Collected', 'In Progress', 'Resulted', 'Verified'];
export const LAB_TEST_TYPES = ['Full Blood Count', 'Malaria RDT', 'HbA1c', 'Lipid Panel', 'Liver Function', 'Renal Function', 'Urinalysis', 'Blood Culture', 'COVID PCR'];

export const INITIAL_LAB_ORDERS = [
  { id: 'LAB-7001', patient: 'Ibrahim Sule', patientId: 'P-100239', tests: ['HbA1c', 'Lipid Panel'], orderedBy: 'Dr. Kojo Amankwah', priority: 'Routine', status: 'In Progress', collectedAt: '09:05', result: '' },
  { id: 'LAB-7002', patient: 'Fatima Iddrisu', patientId: 'P-100236', tests: ['Full Blood Count', 'Urinalysis'], orderedBy: 'Dr. Priya Nair', priority: 'Routine', status: 'Sample Collected', collectedAt: '08:55', result: '' },
  { id: 'LAB-7003', patient: 'Emmanuel Quaye', patientId: 'P-100237', tests: ['Full Blood Count', 'Renal Function', 'Blood Culture'], orderedBy: 'Dr. Kojo Amankwah', priority: 'Urgent', status: 'Ordered', collectedAt: '', result: '' },
  { id: 'LAB-7004', patient: 'Abena Frimpong', patientId: 'P-100234', tests: ['Malaria RDT'], orderedBy: 'Dr. Priya Nair', priority: 'Routine', status: 'Resulted', collectedAt: '08:20', result: 'Malaria RDT: Positive (P. falciparum)' },
];

// ---------------------------------------------------------------------
// PHARMACY — prescriptions + stock
// ---------------------------------------------------------------------
export const RX_STATUSES = ['Pending', 'Being Prepared', 'Dispensed', 'Cancelled'];

export const INITIAL_PRESCRIPTIONS = [
  { id: 'RX-9001', patient: 'Gifty Ansah', patientId: 'P-100240', prescriber: 'Dr. Priya Nair', time: '08:10', status: 'Pending', items: [{ drug: 'Amoxicillin 500mg', dose: 'TID x5d', qty: 15 }, { drug: 'Paracetamol 1g', dose: 'QID x3d', qty: 12 }] },
  { id: 'RX-9002', patient: 'Abena Frimpong', patientId: 'P-100234', prescriber: 'Dr. Priya Nair', time: '08:40', status: 'Being Prepared', items: [{ drug: 'Artemether/Lumefantrine', dose: 'BD x3d', qty: 24 }, { drug: 'Paracetamol 1g', dose: 'QID', qty: 12 }] },
  { id: 'RX-9003', patient: 'Ibrahim Sule', patientId: 'P-100239', prescriber: 'Dr. Kojo Amankwah', time: '09:15', status: 'Pending', items: [{ drug: 'Metformin 850mg', dose: 'BD', qty: 60 }, { drug: 'Atorvastatin 20mg', dose: 'OD', qty: 30 }] },
];

export const INITIAL_PHARMACY_STOCK = [
  { id: 'PH-01', drug: 'Amoxicillin 500mg', category: 'Antibiotic', qty: 420, reorder: 200, expiry: '2027-03-01', coldChain: false, status: 'OK' },
  { id: 'PH-02', drug: 'Artemether/Lumefantrine', category: 'Antimalarial', qty: 150, reorder: 200, expiry: '2026-11-01', coldChain: false, status: 'Low' },
  { id: 'PH-03', drug: 'Insulin (Mixtard)', category: 'Antidiabetic', qty: 60, reorder: 40, expiry: '2026-09-15', coldChain: true, status: 'OK' },
  { id: 'PH-04', drug: 'Paracetamol 1g', category: 'Analgesic', qty: 900, reorder: 300, expiry: '2028-01-01', coldChain: false, status: 'OK' },
  { id: 'PH-05', drug: 'Measles Vaccine', category: 'Vaccine', qty: 25, reorder: 30, expiry: '2026-08-10', coldChain: true, status: 'Low' },
  { id: 'PH-06', drug: 'Metformin 850mg', category: 'Antidiabetic', qty: 500, reorder: 150, expiry: '2027-06-01', coldChain: false, status: 'OK' },
];

// ---------------------------------------------------------------------
// INVENTORY (medical supplies, spares, lab supplies, general)
// ---------------------------------------------------------------------
export const INVENTORY_CATEGORIES = ['Medical Supplies', 'Maintenance Spare Parts', 'Laboratory Supplies', 'General Stores', 'Pharmacy Stock'];

export const INITIAL_INVENTORY = [
  { id: 'INV-01', sku: 'MS-0001', name: 'Surgical gloves (box)', category: 'Medical Supplies', qty: 340, uom: 'box', reorder: 150, status: 'OK', location: 'Central Store' },
  { id: 'INV-02', sku: 'MS-0002', name: 'IV cannula 18G', category: 'Medical Supplies', qty: 120, uom: 'pcs', reorder: 200, status: 'Low', location: 'Central Store' },
  { id: 'INV-03', sku: 'SP-0007', name: 'HEPA filter (theatre AHU)', category: 'Maintenance Spare Parts', qty: 4, uom: 'pcs', reorder: 6, status: 'Low', location: 'Engineering Store' },
  { id: 'INV-04', sku: 'SP-0011', name: 'Bed caster wheel', category: 'Maintenance Spare Parts', qty: 22, uom: 'pcs', reorder: 10, status: 'OK', location: 'Engineering Store' },
  { id: 'INV-05', sku: 'LB-0003', name: 'EDTA sample tubes', category: 'Laboratory Supplies', qty: 60, uom: 'pcs', reorder: 100, status: 'Low', location: 'Lab Store' },
  { id: 'INV-06', sku: 'GS-0009', name: 'A4 printing paper', category: 'General Stores', qty: 80, uom: 'ream', reorder: 40, status: 'OK', location: 'Admin Store' },
  { id: 'INV-07', sku: 'MS-0015', name: 'Oxygen mask (adult)', category: 'Medical Supplies', qty: 0, uom: 'pcs', reorder: 50, status: 'Out', location: 'Central Store' },
];

// ---------------------------------------------------------------------
// PROCUREMENT — suppliers, purchase requests, purchase orders
// ---------------------------------------------------------------------
export const INITIAL_SUPPLIERS = [
  { id: 'SUP-01', name: 'MedSupply Ltd', category: 'Medical Supplies', contact: 'sales@medsupply.gh', rating: 4.6, status: 'Active' },
  { id: 'SUP-02', name: 'PhilTech Biomedical', category: 'Biomedical', contact: 'orders@philtech.gh', rating: 4.2, status: 'Active' },
  { id: 'SUP-03', name: 'PharmaDirect', category: 'Pharmacy', contact: 'gh@pharmadirect.com', rating: 4.8, status: 'Active' },
  { id: 'SUP-04', name: 'LabWare Africa', category: 'Laboratory', contact: 'info@labware.africa', rating: 4.0, status: 'Active' },
];

export const PR_STATUSES = ['Pending', 'Approved', 'Rejected', 'Ordered'];

export const INITIAL_PURCHASE_REQUESTS = [
  { id: 'PR-01', item: 'IV cannula 18G', qty: 500, dept: 'Wards', requestedBy: 'Yaw Darko', date: '2026-07-19', status: 'Pending', est: 750 },
  { id: 'PR-02', item: 'HEPA filter (theatre AHU)', qty: 8, dept: 'Maintenance', requestedBy: 'Samuel Tetteh', date: '2026-07-18', status: 'Approved', est: 2400 },
  { id: 'PR-03', item: 'Oxygen mask (adult)', qty: 100, dept: 'Central Store', requestedBy: 'Michael Osei', date: '2026-07-19', status: 'Pending', est: 400 },
  { id: 'PR-04', item: 'Measles Vaccine', qty: 200, dept: 'Pharmacy', requestedBy: 'Abena Kufuor', date: '2026-07-19', status: 'Approved', est: 3000 },
];

export const PO_STATUSES = ['Draft', 'Sent', 'Partially Received', 'Received', 'Closed'];

export const INITIAL_PURCHASE_ORDERS = [
  { id: 'PO-2601', supplier: 'MedSupply Ltd', items: 'IV cannula 18G x500, Surgical gloves x200', total: 4200, date: '2026-07-18', status: 'Sent', linkedPR: 'PR-01' },
  { id: 'PO-2602', supplier: 'PharmaDirect', items: 'Measles Vaccine x200', total: 3000, date: '2026-07-19', status: 'Draft', linkedPR: 'PR-04' },
  { id: 'PO-2603', supplier: 'PhilTech Biomedical', items: 'HEPA filter x8', total: 2400, date: '2026-07-18', status: 'Received', linkedPR: 'PR-02' },
];

// ---------------------------------------------------------------------
// FINANCE — billing / invoices (linked to patients & visits)
// ---------------------------------------------------------------------
export const INVOICE_STATUSES = ['Pending', 'Paid', 'NHIS Claim', 'Claim Submitted', 'Overdue'];

export const INITIAL_INVOICES = [
  { id: 'INVC-8001', patient: 'Abena Frimpong', patientId: 'P-100234', payer: 'NHIS', date: '2026-07-19', status: 'NHIS Claim', total: 180, services: [{ desc: 'OPD consultation', amount: 60 }, { desc: 'Malaria RDT', amount: 40 }, { desc: 'Medication', amount: 80 }] },
  { id: 'INVC-8002', patient: 'Joseph Mensah', patientId: 'P-100235', payer: 'Private', date: '2026-07-19', status: 'Pending', total: 520, services: [{ desc: 'OPD consultation', amount: 120 }, { desc: 'ECG', amount: 200 }, { desc: 'Cardiology referral', amount: 200 }] },
  { id: 'INVC-8003', patient: 'Daniel Appiah', patientId: 'P-100241', payer: 'NHIS', date: '2026-07-19', status: 'Pending', total: 1450, services: [{ desc: 'Admission deposit', amount: 500 }, { desc: 'Ward bed (1 day)', amount: 350 }, { desc: 'IV antibiotics', amount: 600 }] },
  { id: 'INVC-8004', patient: 'Vida Amoah', patientId: 'P-100253', payer: 'Cash', date: '2026-07-19', status: 'Paid', total: 2200, services: [{ desc: 'Delivery package', amount: 2000 }, { desc: 'Medication', amount: 200 }] },
  { id: 'INVC-8005', patient: 'Ibrahim Sule', patientId: 'P-100239', payer: 'Private', date: '2026-07-19', status: 'Paid', total: 340, services: [{ desc: 'OPD consultation', amount: 120 }, { desc: 'Lab tests', amount: 220 }] },
];

// ---------------------------------------------------------------------
// ASSETS (linked to work orders & biomedical)
// ---------------------------------------------------------------------
export const ASSET_STATUSES = ['Operational', 'Under Maintenance', 'Out of Service', 'Retired'];

export const INITIAL_ASSETS = [
  { id: 'AST-01', tag: 'MGH-GEN-01', name: 'Standby Generator 500kVA', category: 'Power', location: 'Plant Room', status: 'Operational', warranty: '2028-01-01', linkedWO: '', vendor: 'PhilTech Biomedical' },
  { id: 'AST-02', tag: 'MGH-MON-14', name: 'ICU Patient Monitor', category: 'Biomedical', location: 'ICU / ICU5', status: 'Under Maintenance', warranty: '2027-05-10', linkedWO: 'WO-2026-041', vendor: 'PhilTech Biomedical' },
  { id: 'AST-03', tag: 'MGH-CEN-03', name: 'Laboratory Centrifuge', category: 'Biomedical', location: 'Lab-1', status: 'Under Maintenance', warranty: '2026-12-01', linkedWO: 'WO-2026-037', vendor: 'LabWare Africa' },
  { id: 'AST-04', tag: 'MGH-ELV-01', name: 'Passenger Elevator (Block B)', category: 'Building', location: 'Block B', status: 'Operational', warranty: '2029-06-01', linkedWO: '', vendor: 'LiftCare' },
  { id: 'AST-05', tag: 'MGH-FRG-02', name: 'Cold-chain Fridge (Pharmacy)', category: 'Pharmacy', location: 'Pharmacy store', status: 'Operational', warranty: '2027-02-01', linkedWO: 'WO-2026-038', vendor: 'PharmaDirect' },
  { id: 'AST-06', tag: 'MGH-AMB-01', name: 'Ambulance (Toyota Hiace)', category: 'Fleet', location: 'Ambulance Bay', status: 'Operational', warranty: '2027-09-01', linkedWO: '', vendor: 'Toyota Ghana' },
];

// ---------------------------------------------------------------------
// DEPARTMENTS (system directory)
// ---------------------------------------------------------------------
export const INITIAL_DEPARTMENTS = [
  { id: 'DPT-01', name: 'Front Desk', head: 'Grace Mensah', staff: 3, type: 'Administrative', costCentre: 'CC-100' },
  { id: 'DPT-02', name: 'OPD', head: 'Dr. Priya Nair', staff: 8, type: 'Clinical', costCentre: 'CC-200' },
  { id: 'DPT-03', name: 'Wards', head: 'Yaw Darko', staff: 14, type: 'Clinical', costCentre: 'CC-210' },
  { id: 'DPT-04', name: 'ICU', head: 'Dr. Kojo Amankwah', staff: 10, type: 'Clinical', costCentre: 'CC-220' },
  { id: 'DPT-05', name: 'Maternity', head: 'Dr. Naomi Asante', staff: 9, type: 'Clinical', costCentre: 'CC-230' },
  { id: 'DPT-06', name: 'Laboratory', head: 'Kojo Baffour', staff: 5, type: 'Diagnostic', costCentre: 'CC-300' },
  { id: 'DPT-07', name: 'Pharmacy', head: 'Abena Kufuor', staff: 4, type: 'Clinical Support', costCentre: 'CC-310' },
  { id: 'DPT-08', name: 'Theatre', head: 'Dr. Kojo Amankwah', staff: 7, type: 'Clinical', costCentre: 'CC-240' },
  { id: 'DPT-09', name: 'Maintenance', head: 'Samuel Tetteh', staff: 6, type: 'Facility', costCentre: 'CC-400' },
  { id: 'DPT-10', name: 'Biomedical', head: 'Efua Sarpong', staff: 3, type: 'Facility', costCentre: 'CC-410' },
  { id: 'DPT-11', name: 'Human Resources', head: 'Linda Adjei', staff: 3, type: 'Administrative', costCentre: 'CC-500' },
  { id: 'DPT-12', name: 'Finance', head: 'Comfort Addo', staff: 4, type: 'Administrative', costCentre: 'CC-510' },
  { id: 'DPT-13', name: 'Stores & Procurement', head: 'Michael Osei', staff: 4, type: 'Administrative', costCentre: 'CC-520' },
];

// ---------------------------------------------------------------------
// PATIENT BIO-DATA (extends the patient master record — blood group,
// genotype, national ID). Keyed by patient number so any department
// (lab, pharmacy, ward) can show identity + clinical basics.
// ---------------------------------------------------------------------
export const PATIENT_BIO = {
  'P-100234': { bloodGroup: 'O+',  genotype: 'AA', nationalId: 'GHA-745120', maritalStatus: 'Married', occupation: 'Teacher' },
  'P-100235': { bloodGroup: 'A+',  genotype: 'AS', nationalId: 'GHA-338910', maritalStatus: 'Married', occupation: 'Trader' },
  'P-100236': { bloodGroup: 'B+',  genotype: 'AA', nationalId: 'GHA-991002', maritalStatus: 'Single',  occupation: 'Student' },
  'P-100237': { bloodGroup: 'O-',  genotype: 'AA', nationalId: 'GHA-100455', maritalStatus: 'Married', occupation: 'Retired' },
  'P-100238': { bloodGroup: 'AB+', genotype: 'AC', nationalId: 'GHA-556677', maritalStatus: 'Single',  occupation: 'Student' },
  'P-100239': { bloodGroup: 'A-',  genotype: 'AA', nationalId: 'GHA-665331', maritalStatus: 'Married', occupation: 'Driver' },
  'P-100240': { bloodGroup: 'O+',  genotype: 'SS', nationalId: 'GHA-447228', maritalStatus: 'Single',  occupation: 'Seamstress' },
  'P-100241': { bloodGroup: 'B-',  genotype: 'AA', nationalId: 'GHA-220667', maritalStatus: 'Married', occupation: 'Mason' },
};

// ---------------------------------------------------------------------
// BIOMEDICAL — equipment register + fault tickets (CT, MRI, X-ray,
// ultrasound, endoscopy, cardiography, mobile X-ray, ...)
// ---------------------------------------------------------------------
export const BIOMED_STATUSES = ['Open', 'In Progress', 'Awaiting Parts', 'Resolved', 'Closed'];

export const INITIAL_BIOMED_EQUIPMENT = [
  { id: 'BIO-CT-01',  name: 'CT Scanner 64-slice', category: 'CT Scan',      location: 'Imaging Suite', manufacturer: 'Siemens',       status: 'Operational',      lastServiced: '2026-06-01', nextService: '2026-09-01' },
  { id: 'BIO-MRI-01', name: 'MRI 1.5T',            category: 'MRI',          location: 'Imaging Suite', manufacturer: 'GE Healthcare', status: 'Under Repair',     lastServiced: '2026-05-10', nextService: '2026-08-10' },
  { id: 'BIO-XR-01',  name: 'Digital X-Ray',       category: 'X-ray',        location: 'Radiology',     manufacturer: 'Philips',       status: 'Operational',      lastServiced: '2026-06-20', nextService: '2026-09-20' },
  { id: 'BIO-XR-02',  name: 'Mobile X-Ray',        category: 'Mobile X-ray', location: 'Wards',         manufacturer: 'Philips',       status: 'Calibration Due',  lastServiced: '2026-04-15', nextService: '2026-07-20' },
  { id: 'BIO-US-01',  name: 'Ultrasound Scanner',  category: 'Ultrasound',   location: 'Maternity',     manufacturer: 'Mindray',       status: 'Operational',      lastServiced: '2026-06-05', nextService: '2026-09-05' },
  { id: 'BIO-END-01', name: 'Endoscopy Tower',     category: 'Endoscopy',    location: 'Theatre',       manufacturer: 'Olympus',       status: 'Operational',      lastServiced: '2026-05-28', nextService: '2026-08-28' },
  { id: 'BIO-ECG-01', name: 'Cardiography (ECG)',  category: 'Cardiography', location: 'OPD',           manufacturer: 'Schiller',      status: 'Operational',      lastServiced: '2026-06-12', nextService: '2026-09-12' },
];

export const INITIAL_BIOMED_TICKETS = [
  { id: 'BMT-001', equipmentId: 'BIO-MRI-01', equipment: 'MRI 1.5T',           category: 'MRI',          reportedBy: 'Dr. Naomi Asante', fault: 'MRI coil error, scans aborting mid-sequence.', priority: 'Critical', status: 'In Progress',   assignedTo: 'Efua Sarpong', reportedAt: '2026-07-18 09:00', resolvedAt: '' },
  { id: 'BMT-002', equipmentId: 'BIO-XR-02',  equipment: 'Mobile X-Ray',       category: 'Mobile X-ray', reportedBy: 'Ama Owusu',        fault: 'Battery not holding charge.',                  priority: 'High',     status: 'Awaiting Parts', assignedTo: 'Efua Sarpong', reportedAt: '2026-07-19 07:30', resolvedAt: '' },
  { id: 'BMT-003', equipmentId: 'BIO-ECG-01', equipment: 'Cardiography (ECG)', category: 'Cardiography', reportedBy: 'Kofi Boateng',     fault: 'Lead V3 intermittent signal.',                 priority: 'Medium',   status: 'Open',           assignedTo: '',             reportedAt: '2026-07-19 10:15', resolvedAt: '' },
  { id: 'BMT-004', equipmentId: 'BIO-CT-01',  equipment: 'CT Scanner 64-slice',category: 'CT Scan',      reportedBy: 'Radiographer',     fault: 'Gantry noise on rotation.',                    priority: 'Medium',   status: 'Resolved',       assignedTo: 'Efua Sarpong', reportedAt: '2026-07-15 11:00', resolvedAt: '2026-07-16 14:30' },
  { id: 'BMT-005', equipmentId: 'BIO-US-01',  equipment: 'Ultrasound Scanner', category: 'Ultrasound',   reportedBy: 'Dr. Naomi Asante', fault: 'Probe image freezing.',                        priority: 'High',     status: 'Resolved',       assignedTo: 'Efua Sarpong', reportedAt: '2026-07-14 08:00', resolvedAt: '2026-07-15 10:00' },
];
