// =====================================================================
// HOSPITAL MANAGEMENT & OPERATIONS PLATFORM — MOCK DATA
// Single source of truth for the pilot. All data is React-managed in
// App.jsx so changes propagate live across dashboards, tables and modals.
// In production these arrays map 1:1 to the relational tables documented
// in ARCHITECTURE.md (patients, beds, work_orders, employees, ...).
// =====================================================================

// ---------------------------------------------------------------------
// ORGANISATION / FACILITY (organization_id + hospital_id scoping)
// ---------------------------------------------------------------------
export const ORGANIZATION = { id: 'ORG-01', name: 'The Bank Hospital Group' };
export const HOSPITAL = {
  id: 'HOSP-01',
  name: 'The Bank Hospital',
  code: 'TBH',
  city: 'Accra',
};

// ---------------------------------------------------------------------
// USERS (role simulation). role drives navigation + permissions.
// department binds the user to a department dashboard.
// ---------------------------------------------------------------------
export const MOCK_USERS = [
  { id: 'U-01', name: 'Dr. Alexander Vaughan', role: 'Hospital Administrator', department: 'Administration', avatar: 'AV' },
  { id: 'U-02', name: 'Dr. Naomi Asante',      role: 'Medical Director',       department: 'Administration', avatar: 'NA' },
  { id: 'U-03', name: 'Grace Mensah',          role: 'Front Desk Officer',     department: 'Front Desk',     avatar: 'GM' },
  { id: 'U-04', name: 'Kofi Boateng',          role: 'OPD Officer',            department: 'OPD',            avatar: 'KB' },
  { id: 'U-05', name: 'Dr. Priya Nair',        role: 'Doctor',                 department: 'OPD',            avatar: 'PN' },
  { id: 'U-06', name: 'Ama Owusu',             role: 'Nurse',                  department: 'Wards',          avatar: 'AO' },
  { id: 'U-07', name: 'Yaw Darko',             role: 'Ward Manager',           department: 'Wards',          avatar: 'YD' },
  { id: 'U-08', name: 'Linda Adjei',           role: 'HR Officer',             department: 'Human Resources',avatar: 'LA' },
  { id: 'U-09', name: 'Samuel Tetteh',         role: 'Maintenance Manager',    department: 'Maintenance',    avatar: 'ST' },
  { id: 'U-10', name: 'Isaac Nkrumah',         role: 'Engineer',               department: 'Maintenance',    avatar: 'IN' },
  { id: 'U-11', name: 'Efua Sarpong',          role: 'Biomedical Engineer',    department: 'Biomedical',     avatar: 'ES' },
  { id: 'U-12', name: 'Michael Osei',          role: 'Inventory Officer',      department: 'Stores',         avatar: 'MO' },
  { id: 'U-13', name: 'Comfort Addo',          role: 'Finance Officer',        department: 'Finance',        avatar: 'CA' },
];

// ---------------------------------------------------------------------
// PATIENTS + OPD QUEUE (operational patient flow, not clinical EMR)
// ---------------------------------------------------------------------
export const PATIENT_STATUSES = [
  'Registered', 'Waiting', 'In Triage', 'Waiting for Doctor',
  'In Consultation', 'Laboratory', 'Imaging', 'Pharmacy', 'Admitted', 'Discharged',
];

export const INITIAL_PATIENTS = [
  {
    id: 'P-100234', name: 'Abena Frimpong', dob: '1988-04-12', gender: 'Female',
    phone: '+233 24 111 2233', address: '14 Ring Road, Accra', nextOfKin: 'Kwame Frimpong',
    emergencyContact: '+233 20 998 7766', insurance: 'NHIS · Active', registered: '2026-07-19 08:02',
    visitType: 'Walk-in', priority: 'Routine', doctor: 'Dr. Priya Nair', room: 'OPD-3',
    arrivalTime: '08:05', waitingMins: 24, stage: 'Doctor Consultation', status: 'In Consultation',
    reason: 'Persistent headache & fever', department: 'OPD',
    visits: [
      { date: '2026-07-19', type: 'Walk-in', dept: 'OPD', outcome: 'In progress' },
      { date: '2026-03-02', type: 'Follow-up', dept: 'OPD', outcome: 'Discharged' },
    ],
  },
  {
    id: 'P-100235', name: 'Joseph Mensah', dob: '1975-11-30', gender: 'Male',
    phone: '+233 27 445 8899', address: '2 Spintex Road, Accra', nextOfKin: 'Mary Mensah',
    emergencyContact: '+233 24 556 1122', insurance: 'Private · Nationwide', registered: '2026-07-19 08:20',
    visitType: 'Appointment', priority: 'Urgent', doctor: 'Dr. Priya Nair', room: 'OPD-3',
    arrivalTime: '08:25', waitingMins: 41, stage: 'OPD Queue', status: 'Waiting for Doctor',
    reason: 'Chest tightness on exertion', department: 'OPD',
    visits: [{ date: '2026-07-19', type: 'Appointment', dept: 'OPD', outcome: 'In progress' }],
  },
  {
    id: 'P-100236', name: 'Fatima Iddrisu', dob: '1994-06-18', gender: 'Female',
    phone: '+233 20 332 1100', address: '7 Osu Ave, Accra', nextOfKin: 'Hawa Iddrisu',
    emergencyContact: '+233 26 771 0099', insurance: 'NHIS · Active', registered: '2026-07-19 08:33',
    visitType: 'Walk-in', priority: 'Routine', doctor: 'Unassigned', room: '—',
    arrivalTime: '08:40', waitingMins: 15, stage: 'Triage', status: 'In Triage',
    reason: 'Antenatal check', department: 'OPD',
    visits: [{ date: '2026-07-19', type: 'Walk-in', dept: 'OPD', outcome: 'In progress' }],
  },
  {
    id: 'P-100237', name: 'Emmanuel Quaye', dob: '1960-01-05', gender: 'Male',
    phone: '+233 24 900 5544', address: '19 Labone, Accra', nextOfKin: 'Esi Quaye',
    emergencyContact: '+233 24 900 0000', insurance: 'NHIS · Active', registered: '2026-07-19 07:50',
    visitType: 'Emergency', priority: 'Emergency', doctor: 'Dr. Kojo Amankwah', room: 'ER-1',
    arrivalTime: '07:52', waitingMins: 3, stage: 'Doctor Consultation', status: 'In Consultation',
    reason: 'Road traffic accident — suspected fracture', department: 'Emergency',
    visits: [{ date: '2026-07-19', type: 'Emergency', dept: 'ER', outcome: 'In progress' }],
  },
  {
    id: 'P-100238', name: 'Rebecca Owusu', dob: '2001-09-22', gender: 'Female',
    phone: '+233 27 118 2244', address: '5 Achimota, Accra', nextOfKin: 'Diana Owusu',
    emergencyContact: '+233 27 118 0000', insurance: 'NHIS · Active', registered: '2026-07-19 09:05',
    visitType: 'Walk-in', priority: 'Routine', doctor: 'Unassigned', room: '—',
    arrivalTime: '09:10', waitingMins: 8, stage: 'Registration', status: 'Registered',
    reason: 'Skin rash', department: 'OPD',
    visits: [{ date: '2026-07-19', type: 'Walk-in', dept: 'OPD', outcome: 'In progress' }],
  },
  {
    id: 'P-100239', name: 'Ibrahim Sule', dob: '1983-12-02', gender: 'Male',
    phone: '+233 24 665 3311', address: '31 Madina, Accra', nextOfKin: 'Zainab Sule',
    emergencyContact: '+233 24 665 0000', insurance: 'Private · SafeCare', registered: '2026-07-19 08:48',
    visitType: 'Appointment', priority: 'Routine', doctor: 'Dr. Kojo Amankwah', room: 'OPD-1',
    arrivalTime: '08:50', waitingMins: 0, stage: 'Laboratory', status: 'Laboratory',
    reason: 'Diabetes review — lab work', department: 'OPD',
    visits: [{ date: '2026-07-19', type: 'Appointment', dept: 'OPD', outcome: 'In progress' }],
  },
  {
    id: 'P-100240', name: 'Gifty Ansah', dob: '1997-02-14', gender: 'Female',
    phone: '+233 20 447 2288', address: '8 Dansoman, Accra', nextOfKin: 'Comfort Ansah',
    emergencyContact: '+233 20 447 0000', insurance: 'NHIS · Active', registered: '2026-07-19 07:30',
    visitType: 'Appointment', priority: 'Routine', doctor: 'Dr. Priya Nair', room: 'OPD-3',
    arrivalTime: '07:35', waitingMins: 0, stage: 'Pharmacy', status: 'Pharmacy',
    reason: 'Prescription refill', department: 'OPD',
    visits: [{ date: '2026-07-19', type: 'Appointment', dept: 'OPD', outcome: 'In progress' }],
  },
  {
    id: 'P-100241', name: 'Daniel Appiah', dob: '1969-08-08', gender: 'Male',
    phone: '+233 24 220 6677', address: '11 Tema Comm 5', nextOfKin: 'Sarah Appiah',
    emergencyContact: '+233 24 220 0000', insurance: 'NHIS · Active', registered: '2026-07-19 06:55',
    visitType: 'Emergency', priority: 'Urgent', doctor: 'Dr. Kojo Amankwah', room: 'Ward A',
    arrivalTime: '07:00', waitingMins: 0, stage: 'Admission', status: 'Admitted',
    reason: 'Severe pneumonia', department: 'Wards',
    visits: [{ date: '2026-07-19', type: 'Emergency', dept: 'ER → Ward A', outcome: 'Admitted' }],
  },
];

// ---------------------------------------------------------------------
// APPOINTMENTS
// ---------------------------------------------------------------------
export const APPOINTMENT_STATUSES = ['Scheduled', 'Checked-in', 'Completed', 'No Show', 'Cancelled'];

export const INITIAL_APPOINTMENTS = [
  { id: 'AP-5001', patient: 'Joseph Mensah',   patientId: 'P-100235', doctor: 'Dr. Priya Nair',    dept: 'OPD',        date: '2026-07-19', time: '08:30', type: 'Follow-up',   status: 'Checked-in' },
  { id: 'AP-5002', patient: 'Ibrahim Sule',    patientId: 'P-100239', doctor: 'Dr. Kojo Amankwah', dept: 'OPD',        date: '2026-07-19', time: '09:00', type: 'Review',      status: 'Checked-in' },
  { id: 'AP-5003', patient: 'Gifty Ansah',     patientId: 'P-100240', doctor: 'Dr. Priya Nair',    dept: 'OPD',        date: '2026-07-19', time: '07:45', type: 'Follow-up',   status: 'Completed' },
  { id: 'AP-5004', patient: 'Mensimah Tetteh', patientId: 'P-100260', doctor: 'Dr. Naomi Asante',  dept: 'Cardiology', date: '2026-07-19', time: '10:15', type: 'New',         status: 'Scheduled' },
  { id: 'AP-5005', patient: 'Kwesi Boadu',     patientId: 'P-100261', doctor: 'Dr. Kojo Amankwah', dept: 'OPD',        date: '2026-07-19', time: '11:00', type: 'New',         status: 'Scheduled' },
  { id: 'AP-5006', patient: 'Adjoa Bediako',   patientId: 'P-100262', doctor: 'Dr. Priya Nair',    dept: 'OPD',        date: '2026-07-19', time: '11:30', type: 'Follow-up',   status: 'Scheduled' },
  { id: 'AP-5007', patient: 'Nii Armah',       patientId: 'P-100263', doctor: 'Dr. Naomi Asante',  dept: 'Cardiology', date: '2026-07-20', time: '09:00', type: 'New',         status: 'Scheduled' },
  { id: 'AP-5008', patient: 'Selina Doe',      patientId: 'P-100264', doctor: 'Dr. Kojo Amankwah', dept: 'OPD',        date: '2026-07-19', time: '08:00', type: 'Review',      status: 'No Show' },
];

// ---------------------------------------------------------------------
// VISITORS + DELIVERIES (Front Desk)
// ---------------------------------------------------------------------
export const INITIAL_VISITORS = [
  { id: 'V-2201', name: 'Comfort Boateng', visiting: 'Daniel Appiah (Ward A, Bed A01)', purpose: 'Family visit', checkIn: '10:05', checkOut: '', badge: 'VIS-041', status: 'On Premises' },
  { id: 'V-2202', name: 'Paul Anku',       visiting: 'Administration',                   purpose: 'Vendor meeting', checkIn: '09:30', checkOut: '10:40', badge: 'VIS-040', status: 'Checked-out' },
  { id: 'V-2203', name: 'Regina Owusu',    visiting: 'HR Office',                        purpose: 'Interview',      checkIn: '11:00', checkOut: '', badge: 'VIS-042', status: 'On Premises' },
];

export const INITIAL_DELIVERIES = [
  { id: 'D-3301', item: 'Pharmacy consumables (3 boxes)', from: 'MedSupply Ltd', recipient: 'Pharmacy Store', received: '08:45', status: 'Delivered' },
  { id: 'D-3302', item: 'Biomedical spare parts',          from: 'PhilTech',      recipient: 'Biomedical Dept', received: '09:20', status: 'Delivered' },
  { id: 'D-3303', item: 'Office stationery',               from: 'PaperPlus',     recipient: 'Admin Office',    received: '', status: 'Awaiting' },
];

// ---------------------------------------------------------------------
// WARDS + BEDS  (hospital → building → floor → ward → room → bed)
// ---------------------------------------------------------------------
export const BED_STATUSES = ['Available', 'Occupied', 'Reserved', 'Cleaning', 'Maintenance', 'Isolation', 'Unavailable'];

const bed = (id, status, patient = null, extra = {}) => ({ id, status, patient, ...extra });

export const INITIAL_WARDS = [
  {
    id: 'W-A', name: 'Ward A — General Male', building: 'Block A', floor: '1st Floor', staffOnDuty: 4,
    beds: [
      bed('A01', 'Occupied', 'Daniel Appiah'), bed('A02', 'Available'),
      bed('A03', 'Cleaning'), bed('A04', 'Maintenance', null, { ticket: 'MR-2026-014' }),
      bed('A05', 'Occupied', 'Kwesi Boadu'), bed('A06', 'Available'),
      bed('A07', 'Reserved', 'Incoming: J. Owusu'), bed('A08', 'Occupied', 'Nii Armah'),
      bed('A09', 'Available'), bed('A10', 'Isolation', 'TB precaution'),
    ],
  },
  {
    id: 'W-B', name: 'Ward B — General Female', building: 'Block A', floor: '1st Floor', staffOnDuty: 5,
    beds: [
      bed('B01', 'Occupied', 'Abena Frimpong'), bed('B02', 'Occupied', 'Gifty Ansah'),
      bed('B03', 'Available'), bed('B04', 'Available'),
      bed('B05', 'Cleaning'), bed('B06', 'Occupied', 'Adjoa Bediako'),
      bed('B07', 'Reserved', 'Incoming: F. Iddrisu'), bed('B08', 'Available'),
      bed('B09', 'Maintenance', null, { ticket: 'MR-2026-011' }), bed('B10', 'Occupied', 'Selina Doe'),
    ],
  },
  {
    id: 'W-P', name: 'Ward P — Paediatrics', building: 'Block B', floor: '2nd Floor', staffOnDuty: 6,
    beds: [
      bed('P01', 'Occupied', 'Baby Mensah'), bed('P02', 'Available'),
      bed('P03', 'Occupied', 'Kojo Jr.'), bed('P04', 'Available'),
      bed('P05', 'Available'), bed('P06', 'Cleaning'),
      bed('P07', 'Occupied', 'Ama Serwaa'), bed('P08', 'Available'),
    ],
  },
  {
    id: 'W-ICU', name: 'ICU — Critical Care', building: 'Block B', floor: '3rd Floor', staffOnDuty: 8,
    beds: [
      bed('ICU1', 'Occupied', 'Emmanuel Quaye'), bed('ICU2', 'Occupied', 'John Tetteh'),
      bed('ICU3', 'Available'), bed('ICU4', 'Reserved', 'Post-op reserve'),
      bed('ICU5', 'Maintenance', null, { ticket: 'MR-2026-009' }), bed('ICU6', 'Available'),
    ],
  },
  {
    id: 'W-MAT', name: 'Maternity Ward', building: 'Block C', floor: '1st Floor', staffOnDuty: 5,
    beds: [
      bed('M01', 'Occupied', 'Akosua Nyarko'), bed('M02', 'Occupied', 'Vida Amoah'),
      bed('M03', 'Available'), bed('M04', 'Available'),
      bed('M05', 'Cleaning'), bed('M06', 'Available'),
    ],
  },
];

// ---------------------------------------------------------------------
// EMPLOYEES (HR)
// ---------------------------------------------------------------------
export const INITIAL_EMPLOYEES = [
  { id: 'E-001', staffId: 'MGH-0001', name: 'Dr. Priya Nair',    role: 'Doctor',              dept: 'OPD',             status: 'Active', shift: 'Morning',  present: true,  phone: '+233 24 000 0001', qualification: 'MBChB, MD', hired: '2019-03-01' },
  { id: 'E-002', staffId: 'MGH-0002', name: 'Dr. Kojo Amankwah', role: 'Doctor',              dept: 'OPD',             status: 'Active', shift: 'Morning',  present: true,  phone: '+233 24 000 0002', qualification: 'MBChB', hired: '2017-06-12' },
  { id: 'E-003', staffId: 'MGH-0003', name: 'Ama Owusu',         role: 'Nurse',               dept: 'Wards',           status: 'Active', shift: 'Morning',  present: true,  phone: '+233 24 000 0003', qualification: 'RN, BSc Nursing', hired: '2020-01-20' },
  { id: 'E-004', staffId: 'MGH-0004', name: 'Yaw Darko',         role: 'Ward Manager',        dept: 'Wards',           status: 'Active', shift: 'Morning',  present: true,  phone: '+233 24 000 0004', qualification: 'RN, MSc', hired: '2015-09-05' },
  { id: 'E-005', staffId: 'MGH-0005', name: 'Grace Mensah',      role: 'Front Desk Officer',  dept: 'Front Desk',      status: 'Active', shift: 'Morning',  present: true,  phone: '+233 24 000 0005', qualification: 'HND Admin', hired: '2021-04-14' },
  { id: 'E-006', staffId: 'MGH-0006', name: 'Kofi Boateng',      role: 'OPD Officer',         dept: 'OPD',             status: 'Active', shift: 'Afternoon',present: true,  phone: '+233 24 000 0006', qualification: 'BSc Health Admin', hired: '2022-02-01' },
  { id: 'E-007', staffId: 'MGH-0007', name: 'Isaac Nkrumah',     role: 'Engineer',            dept: 'Maintenance',     status: 'Active', shift: 'Morning',  present: true,  phone: '+233 24 000 0007', qualification: 'BSc Mechanical Eng', hired: '2018-11-11' },
  { id: 'E-008', staffId: 'MGH-0008', name: 'Efua Sarpong',      role: 'Biomedical Engineer', dept: 'Biomedical',      status: 'Active', shift: 'Morning',  present: true,  phone: '+233 24 000 0008', qualification: 'BSc Biomedical Eng', hired: '2019-07-22' },
  { id: 'E-009', staffId: 'MGH-0009', name: 'Kwabena Asare',     role: 'Engineer',            dept: 'Maintenance',     status: 'On Leave', shift: 'Night',  present: false, phone: '+233 24 000 0009', qualification: 'HND Electrical', hired: '2020-05-30' },
  { id: 'E-010', staffId: 'MGH-0010', name: 'Linda Adjei',       role: 'HR Officer',          dept: 'Human Resources', status: 'Active', shift: 'Morning',  present: true,  phone: '+233 24 000 0010', qualification: 'BSc HRM', hired: '2016-08-19' },
  { id: 'E-011', staffId: 'MGH-0011', name: 'Comfort Addo',      role: 'Finance Officer',     dept: 'Finance',         status: 'Active', shift: 'Morning',  present: false, phone: '+233 24 000 0011', qualification: 'ACCA', hired: '2017-10-03' },
  { id: 'E-012', staffId: 'MGH-0012', name: 'Mensah Cudjoe',     role: 'Cleaner',             dept: 'Housekeeping',    status: 'Active', shift: 'Morning',  present: true,  phone: '+233 24 000 0012', qualification: 'Basic', hired: '2021-01-10' },
  { id: 'E-013', staffId: 'MGH-0013', name: 'Patience Owusu',    role: 'Nurse',               dept: 'Wards',           status: 'Active', shift: 'Night',    present: true,  phone: '+233 24 000 0013', qualification: 'RN', hired: '2022-06-15' },
  { id: 'E-014', staffId: 'MGH-0014', name: 'Joseph Danso',      role: 'Security',            dept: 'Security',        status: 'Active', shift: 'Night',    present: true,  phone: '+233 24 000 0014', qualification: 'Basic', hired: '2020-03-08' },
];

// ---------------------------------------------------------------------
// SHIFTS + LEAVE
// ---------------------------------------------------------------------
export const SHIFT_TYPES = ['Morning', 'Afternoon', 'Night', 'On-Call'];

export const INITIAL_SHIFTS = [
  { id: 'SH-01', staff: 'Ama Owusu',      role: 'Nurse',    ward: 'Ward B',   shift: 'Morning',   date: '2026-07-19', start: '07:00', end: '15:00', status: 'On Duty' },
  { id: 'SH-02', staff: 'Patience Owusu', role: 'Nurse',    ward: 'Ward A',   shift: 'Night',     date: '2026-07-19', start: '19:00', end: '07:00', status: 'Scheduled' },
  { id: 'SH-03', staff: 'Dr. Priya Nair', role: 'Doctor',   ward: 'OPD',      shift: 'Morning',   date: '2026-07-19', start: '08:00', end: '16:00', status: 'On Duty' },
  { id: 'SH-04', staff: 'Isaac Nkrumah',  role: 'Engineer', ward: 'Facility', shift: 'Morning',   date: '2026-07-19', start: '07:00', end: '15:00', status: 'On Duty' },
  { id: 'SH-05', staff: 'Kofi Boateng',   role: 'OPD Officer', ward: 'OPD',   shift: 'Afternoon', date: '2026-07-19', start: '13:00', end: '21:00', status: 'Scheduled' },
  { id: 'SH-06', staff: 'Dr. Kojo Amankwah', role: 'Doctor', ward: 'OPD',     shift: 'Morning',   date: '2026-07-19', start: '08:00', end: '16:00', status: 'On Duty' },
];

export const INITIAL_LEAVE = [
  { id: 'LV-01', staff: 'Kwabena Asare', role: 'Engineer',        type: 'Annual', from: '2026-07-15', to: '2026-07-25', days: 10, status: 'Approved' },
  { id: 'LV-02', staff: 'Comfort Addo',  role: 'Finance Officer', type: 'Sick',   from: '2026-07-19', to: '2026-07-19', days: 1,  status: 'Pending' },
  { id: 'LV-03', staff: 'Mensah Cudjoe', role: 'Cleaner',         type: 'Casual', from: '2026-07-22', to: '2026-07-23', days: 2,  status: 'Pending' },
  { id: 'LV-04', staff: 'Kofi Boateng',  role: 'OPD Officer',     type: 'Annual', from: '2026-08-01', to: '2026-08-07', days: 7,  status: 'Pending' },
];

// ---------------------------------------------------------------------
// MAINTENANCE REQUESTS (centralised ticketing)
// ---------------------------------------------------------------------
export const REQUEST_CATEGORIES = ['Electrical', 'Plumbing', 'HVAC', 'Mechanical', 'Biomedical', 'Building', 'Furniture', 'IT', 'Safety', 'Cleaning', 'Other'];
export const REQUEST_PRIORITIES = ['Low', 'Medium', 'High', 'Critical', 'Emergency'];
export const REQUEST_STATUSES = ['Submitted', 'Reviewed', 'Approved', 'Assigned', 'In Progress', 'On Hold', 'Completed', 'Verified', 'Closed'];

export const INITIAL_REQUESTS = [
  { id: 'MR-2026-014', dept: 'Wards',       location: 'Ward A', room: 'A04', bed: 'A04', equipment: 'Hospital bed frame', category: 'Furniture',  priority: 'High',      reporter: 'Ama Owusu',    date: '2026-07-19 08:10', status: 'Assigned',   description: 'Bed frame lever broken, cannot adjust height.', assignedTo: 'Isaac Nkrumah' },
  { id: 'MR-2026-013', dept: 'OPD',         location: 'OPD-2',  room: 'OPD-2', bed: '', equipment: 'Air conditioner',      category: 'HVAC',       priority: 'Medium',    reporter: 'Kofi Boateng', date: '2026-07-19 07:55', status: 'Submitted',  description: 'AC not cooling, consultation room too warm.', assignedTo: '' },
  { id: 'MR-2026-012', dept: 'Laboratory',  location: 'Lab-1',  room: 'Lab-1', bed: '', equipment: 'Centrifuge (Biomedical)', category: 'Biomedical', priority: 'Critical', reporter: 'Lab Tech',     date: '2026-07-19 07:30', status: 'In Progress', description: 'Centrifuge making grinding noise, stopped mid-run.', assignedTo: 'Efua Sarpong' },
  { id: 'MR-2026-011', dept: 'Wards',       location: 'Ward B', room: 'B09', bed: 'B09', equipment: 'Bedside power outlet', category: 'Electrical', priority: 'High',      reporter: 'Yaw Darko',    date: '2026-07-19 06:50', status: 'Assigned',   description: 'Power outlet sparks when plugged in.', assignedTo: 'Isaac Nkrumah' },
  { id: 'MR-2026-010', dept: 'Front Desk',  location: 'Reception', room: 'Lobby', bed: '', equipment: 'Waiting-area chair', category: 'Furniture',  priority: 'Low',       reporter: 'Grace Mensah', date: '2026-07-18 16:20', status: 'Completed',  description: 'Broken chair in waiting area.', assignedTo: 'Isaac Nkrumah' },
  { id: 'MR-2026-009', dept: 'ICU',         location: 'ICU',    room: 'ICU5', bed: 'ICU5', equipment: 'Patient monitor',    category: 'Biomedical', priority: 'Emergency', reporter: 'ICU Nurse',    date: '2026-07-19 05:40', status: 'In Progress', description: 'Vitals monitor screen blank, bed out of service.', assignedTo: 'Efua Sarpong' },
  { id: 'MR-2026-008', dept: 'Pharmacy',    location: 'Pharmacy', room: 'Store', bed: '', equipment: 'Cold-chain fridge',   category: 'Mechanical', priority: 'Critical', reporter: 'Pharmacist',   date: '2026-07-18 22:10', status: 'Verified',   description: 'Vaccine fridge temperature alarm triggered.', assignedTo: 'Isaac Nkrumah' },
];

// ---------------------------------------------------------------------
// WORK ORDERS
// ---------------------------------------------------------------------
export const WORK_ORDER_STATUSES = ['Open', 'Assigned', 'In Progress', 'On Hold', 'Completed', 'Verified', 'Closed'];

export const INITIAL_WORK_ORDERS = [
  { id: 'WO-2026-041', title: 'Repair ICU patient monitor', dept: 'ICU', location: 'ICU5', equipment: 'Patient monitor', priority: 'Emergency', engineer: 'Efua Sarpong', due: '2026-07-19', status: 'In Progress', category: 'Biomedical', createdFrom: 'MR-2026-009',
    checklist: [{ t: 'Isolate device from mains', done: true }, { t: 'Inspect display board', done: true }, { t: 'Replace faulty module', done: false }, { t: 'Function test with simulator', done: false }],
    materials: [{ item: 'Display ribbon cable', qty: 1, cost: 120 }], cost: 120,
    comments: [{ by: 'Efua Sarpong', at: '06:10', text: 'Confirmed display board fault, part ordered.' }],
    history: [{ at: '05:45', text: 'Work order generated from MR-2026-009' }, { at: '06:00', text: 'Assigned to Efua Sarpong' }] },
  { id: 'WO-2026-040', title: 'Replace Ward A bed lever', dept: 'Wards', location: 'Ward A / A04', equipment: 'Hospital bed', priority: 'High', engineer: 'Isaac Nkrumah', due: '2026-07-19', status: 'Assigned', category: 'Furniture', createdFrom: 'MR-2026-014',
    checklist: [{ t: 'Source replacement lever', done: false }, { t: 'Fit and test', done: false }], materials: [], cost: 0,
    comments: [], history: [{ at: '08:15', text: 'Assigned to Isaac Nkrumah' }] },
  { id: 'WO-2026-039', title: 'Fix Ward B power outlet', dept: 'Wards', location: 'Ward B / B09', equipment: 'Power outlet', priority: 'High', engineer: 'Isaac Nkrumah', due: '2026-07-19', status: 'Assigned', category: 'Electrical', createdFrom: 'MR-2026-011',
    checklist: [{ t: 'Isolate circuit', done: false }, { t: 'Replace socket', done: false }, { t: 'Test & certify', done: false }], materials: [], cost: 0,
    comments: [], history: [{ at: '07:05', text: 'Assigned to Isaac Nkrumah' }] },
  { id: 'WO-2026-038', title: 'Service pharmacy cold-chain fridge', dept: 'Pharmacy', location: 'Pharmacy store', equipment: 'Cold-chain fridge', priority: 'Critical', engineer: 'Isaac Nkrumah', due: '2026-07-19', status: 'Completed', category: 'Mechanical', createdFrom: 'MR-2026-008',
    checklist: [{ t: 'Check compressor', done: true }, { t: 'Recharge refrigerant', done: true }, { t: 'Verify temp log', done: true }], materials: [{ item: 'Refrigerant R134a', qty: 1, cost: 85 }], cost: 85,
    comments: [{ by: 'Isaac Nkrumah', at: '23:40', text: 'Temp stabilised at 4°C, monitoring.' }], history: [{ at: '22:20', text: 'Work order generated' }, { at: '23:50', text: 'Marked completed' }] },
  { id: 'WO-2026-037', title: 'Repair lab centrifuge', dept: 'Laboratory', location: 'Lab-1', equipment: 'Centrifuge', priority: 'Critical', engineer: 'Efua Sarpong', due: '2026-07-20', status: 'In Progress', category: 'Biomedical', createdFrom: 'MR-2026-012',
    checklist: [{ t: 'Open housing', done: true }, { t: 'Inspect rotor bearing', done: false }], materials: [], cost: 0,
    comments: [], history: [{ at: '07:40', text: 'Assigned to Efua Sarpong' }] },
];

// ---------------------------------------------------------------------
// PREVENTIVE MAINTENANCE
// ---------------------------------------------------------------------
export const PM_FREQUENCIES = ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Biannual', 'Annual'];

export const INITIAL_PREVENTIVE_TASKS = [
  { id: 'PM-01', asset: 'Standby Generator 500kVA', category: 'Generators',       frequency: 'Weekly',    engineer: 'Isaac Nkrumah', nextDue: '2026-07-21', status: 'Scheduled', lastDone: '2026-07-14',
    checklist: ['Check fuel & oil level', 'Test auto-start', 'Inspect battery', 'Log runtime hours'] },
  { id: 'PM-02', asset: 'Oxygen Plant',              category: 'Oxygen Systems',   frequency: 'Daily',     engineer: 'Efua Sarpong',  nextDue: '2026-07-19', status: 'Due Today', lastDone: '2026-07-18',
    checklist: ['Check pressure gauges', 'Inspect for leaks', 'Verify purity reading', 'Drain condensate'] },
  { id: 'PM-03', asset: 'Passenger Elevator (Block B)', category: 'Elevators',     frequency: 'Monthly',   engineer: 'Isaac Nkrumah', nextDue: '2026-07-17', status: 'Overdue',   lastDone: '2026-06-17',
    checklist: ['Inspect cables', 'Test emergency stop', 'Lubricate rails', 'Check door sensors'] },
  { id: 'PM-04', asset: 'Fire Suppression System',   category: 'Fire Systems',     frequency: 'Quarterly', engineer: 'Isaac Nkrumah', nextDue: '2026-08-10', status: 'Scheduled', lastDone: '2026-05-10',
    checklist: ['Test alarm panels', 'Inspect extinguishers', 'Check sprinkler pressure', 'Verify exit signage'] },
  { id: 'PM-05', asset: 'Theatre HVAC / Air Handling', category: 'HVAC',           frequency: 'Monthly',   engineer: 'Efua Sarpong',  nextDue: '2026-07-25', status: 'Scheduled', lastDone: '2026-06-25',
    checklist: ['Replace HEPA filters', 'Check pressure differential', 'Clean coils', 'Verify temp & humidity'] },
  { id: 'PM-06', asset: 'Ward Beds (fleet of 60)',    category: 'Hospital Beds',    frequency: 'Quarterly', engineer: 'Isaac Nkrumah', nextDue: '2026-07-30', status: 'Scheduled', lastDone: '2026-04-30',
    checklist: ['Test brakes & rails', 'Inspect motors', 'Check remote function', 'Lubricate joints'] },
];

// ---------------------------------------------------------------------
// SAFETY AUDITS / ROUTINE INSPECTIONS
// ---------------------------------------------------------------------
export const INITIAL_ROUTINE_INSPECTIONS = [
  { id: 'SA-01', area: 'Operating Theatre 1', type: 'Infection Control',  inspector: 'Efua Sarpong', date: '2026-07-18', score: 96, status: 'Passed', findings: 'Minor: sharps bin near capacity.' },
  { id: 'SA-02', area: 'Kitchen / Catering',   type: 'Food Safety',        inspector: 'Grace Mensah', date: '2026-07-17', score: 88, status: 'Passed', findings: 'Fridge temp log gaps noted.' },
  { id: 'SA-03', area: 'Electrical Riser B',   type: 'Electrical Safety',  inspector: 'Isaac Nkrumah',date: '2026-07-16', score: 74, status: 'Action Required', findings: 'Exposed wiring; work order raised.' },
  { id: 'SA-04', area: 'Fire Exits (Block A)',  type: 'Fire Safety',        inspector: 'Isaac Nkrumah',date: '2026-07-15', score: 91, status: 'Passed', findings: 'One exit sign bulb replaced.' },
];

// ---------------------------------------------------------------------
// PROJECTS
// ---------------------------------------------------------------------
export const INITIAL_PROJECTS = [
  { id: 'PRJ-01', name: 'New Diagnostic Wing — Fit-out', owner: 'Samuel Tetteh', progress: 62, budget: 'GHS 4.2M', due: '2026-11-30', status: 'On Track' },
  { id: 'PRJ-02', name: 'Solar Backup Installation',      owner: 'Isaac Nkrumah', progress: 35, budget: 'GHS 1.1M', due: '2026-09-15', status: 'At Risk' },
  { id: 'PRJ-03', name: 'Nurse Call System Upgrade',      owner: 'Efua Sarpong',  progress: 80, budget: 'GHS 480K', due: '2026-08-01', status: 'On Track' },
];

// ---------------------------------------------------------------------
// CHART DATA (dashboards)
// ---------------------------------------------------------------------
export const OPD_TREND = [
  { time: '07:00', patients: 8 }, { time: '08:00', patients: 22 }, { time: '09:00', patients: 41 },
  { time: '10:00', patients: 58 }, { time: '11:00', patients: 66 }, { time: '12:00', patients: 71 },
  { time: '13:00', patients: 63 }, { time: '14:00', patients: 49 },
];

export const PATIENT_FLOW_BY_DEPT = [
  { dept: 'OPD', patients: 66 }, { dept: 'Emergency', patients: 12 }, { dept: 'Maternity', patients: 9 },
  { dept: 'Paediatrics', patients: 14 }, { dept: 'Cardiology', patients: 7 }, { dept: 'Surgery', patients: 5 },
];

export const WEEKLY_ADMISSIONS = [
  { day: 'Mon', admissions: 14, discharges: 11 }, { day: 'Tue', admissions: 18, discharges: 15 },
  { day: 'Wed', admissions: 12, discharges: 16 }, { day: 'Thu', admissions: 20, discharges: 13 },
  { day: 'Fri', admissions: 17, discharges: 19 }, { day: 'Sat', admissions: 9, discharges: 12 },
  { day: 'Sun', admissions: 7, discharges: 8 },
];

export const HOSPITAL_ACTIVITY = [
  { time: '09:12', text: 'Emergency case P-100237 admitted to ICU', type: 'emergency' },
  { time: '08:50', text: 'WO-2026-038 (cold-chain fridge) marked completed', type: 'maintenance' },
  { time: '08:40', text: 'Patient P-100236 moved to Triage', type: 'patient' },
  { time: '08:20', text: 'Appointment AP-5001 checked in', type: 'appointment' },
  { time: '08:10', text: 'Maintenance request MR-2026-014 raised (Ward A bed)', type: 'maintenance' },
  { time: '07:30', text: 'Critical ticket MR-2026-012 (lab centrifuge) opened', type: 'emergency' },
];

export const DEPT_PERFORMANCE = [
  { dept: 'OPD', score: 92 }, { dept: 'Wards', score: 87 }, { dept: 'Maintenance', score: 78 },
  { dept: 'Front Desk', score: 90 }, { dept: 'Pharmacy', score: 84 }, { dept: 'Laboratory', score: 81 },
];
