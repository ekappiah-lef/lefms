-- =====================================================================
-- MERIDIAN GENERAL HOSPITAL — Management & Operations Platform
-- MySQL schema + dummy data  (import into phpMyAdmin / XAMPP)
-- Engine: InnoDB, utf8mb4.  Parent tables first so FKs resolve.
-- Everything is interlinked: patients ↔ appointments ↔ invoices ↔ lab ↔
-- prescriptions ↔ admissions ↔ beds ↔ biomedical ↔ maintenance ↔ HR.
-- =====================================================================
SET FOREIGN_KEY_CHECKS = 0;
DROP DATABASE IF EXISTS meridian_hms;
CREATE DATABASE meridian_hms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE meridian_hms;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
-- 1. TENANCY / FACILITY STRUCTURE
-- ---------------------------------------------------------------------
CREATE TABLE organizations (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(150) NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE hospitals (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  organization_id INT NOT NULL,
  name            VARCHAR(150) NOT NULL,
  code            VARCHAR(20)  NOT NULL,
  city            VARCHAR(80),
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
) ENGINE=InnoDB;

CREATE TABLE buildings (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  hospital_id  INT NOT NULL,
  name         VARCHAR(80) NOT NULL,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
) ENGINE=InnoDB;

CREATE TABLE floors (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  building_id  INT NOT NULL,
  name         VARCHAR(60) NOT NULL,
  level        INT,
  FOREIGN KEY (building_id) REFERENCES buildings(id)
) ENGINE=InnoDB;

CREATE TABLE departments (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  hospital_id   INT NOT NULL,
  name          VARCHAR(80) NOT NULL,
  type          VARCHAR(40),
  cost_centre   VARCHAR(20),
  head_employee_id INT NULL,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
) ENGINE=InnoDB;

CREATE TABLE wards (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  hospital_id   INT NOT NULL,
  floor_id      INT,
  code          VARCHAR(20) NOT NULL,
  name          VARCHAR(100) NOT NULL,
  building      VARCHAR(60),
  floor_name    VARCHAR(60),
  staff_on_duty INT DEFAULT 0,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
  FOREIGN KEY (floor_id)   REFERENCES floors(id)
) ENGINE=InnoDB;

CREATE TABLE rooms (
  id       INT AUTO_INCREMENT PRIMARY KEY,
  ward_id  INT NOT NULL,
  name     VARCHAR(40) NOT NULL,
  FOREIGN KEY (ward_id) REFERENCES wards(id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 2. IDENTITY & ACCESS
-- ---------------------------------------------------------------------
CREATE TABLE roles (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  name             VARCHAR(60) NOT NULL UNIQUE,
  default_dashboard VARCHAR(40)
) ENGINE=InnoDB;

CREATE TABLE permissions (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  module_key  VARCHAR(60) NOT NULL,
  action      ENUM('view','create','edit','approve','assign','verify','delete') NOT NULL
) ENGINE=InnoDB;

CREATE TABLE role_permissions (
  role_id       INT NOT NULL,
  permission_id INT NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id)       REFERENCES roles(id),
  FOREIGN KEY (permission_id) REFERENCES permissions(id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 3. WORKFORCE (HR)
-- ---------------------------------------------------------------------
CREATE TABLE employees (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  hospital_id        INT NOT NULL,
  department_id      INT,
  staff_id           VARCHAR(20) NOT NULL UNIQUE,
  full_name          VARCHAR(120) NOT NULL,
  job_role           VARCHAR(60),
  phone              VARCHAR(30),
  email              VARCHAR(120),
  qualification      VARCHAR(120),
  employment_status  ENUM('Active','On Leave','Suspended','Terminated') DEFAULT 'Active',
  default_shift      ENUM('Morning','Afternoon','Night','On-Call') DEFAULT 'Morning',
  present_today      TINYINT(1) DEFAULT 1,
  hired_on           DATE,
  FOREIGN KEY (hospital_id)   REFERENCES hospitals(id),
  FOREIGN KEY (department_id) REFERENCES departments(id)
) ENGINE=InnoDB;

CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  employee_id   INT,
  role_id       INT NOT NULL,
  username      VARCHAR(80) NOT NULL UNIQUE,
  email         VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  is_active     TINYINT(1) DEFAULT 1,
  last_login    DATETIME,
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  FOREIGN KEY (role_id)     REFERENCES roles(id)
) ENGINE=InnoDB;

CREATE TABLE shifts (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(30) NOT NULL,
  start_time TIME,
  end_time   TIME
) ENGINE=InnoDB;

CREATE TABLE shift_assignments (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  employee_id  INT NOT NULL,
  shift_id     INT NOT NULL,
  ward_id      INT NULL,
  ward_label   VARCHAR(60),
  work_date    DATE NOT NULL,
  status       ENUM('Scheduled','On Duty','Completed','Swapped') DEFAULT 'Scheduled',
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  FOREIGN KEY (shift_id)    REFERENCES shifts(id),
  FOREIGN KEY (ward_id)     REFERENCES wards(id)
) ENGINE=InnoDB;

CREATE TABLE leave_requests (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  employee_id  INT NOT NULL,
  leave_type   ENUM('Annual','Sick','Casual','Maternity','Study') NOT NULL,
  from_date    DATE NOT NULL,
  to_date      DATE NOT NULL,
  days         INT,
  status       ENUM('Pending','Approved','Rejected') DEFAULT 'Pending',
  approver_id  INT NULL,
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  FOREIGN KEY (approver_id) REFERENCES employees(id)
) ENGINE=InnoDB;

CREATE TABLE attendance_logs (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  log_date    DATE NOT NULL,
  clock_in    TIME,
  clock_out   TIME,
  present     TINYINT(1) DEFAULT 1,
  FOREIGN KEY (employee_id) REFERENCES employees(id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 4. PATIENT MASTER RECORD (bio-data — the single source of truth)
-- ---------------------------------------------------------------------
CREATE TABLE patients (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  hospital_id       INT NOT NULL,
  patient_no        VARCHAR(20) NOT NULL UNIQUE,
  first_name        VARCHAR(60) NOT NULL,
  last_name         VARCHAR(60) NOT NULL,
  dob               DATE,
  gender            ENUM('Male','Female','Other'),
  blood_group       VARCHAR(5),
  genotype          VARCHAR(5),
  national_id       VARCHAR(40),
  phone             VARCHAR(30),
  address           VARCHAR(200),
  insurance_type    VARCHAR(40),
  insurance_status  VARCHAR(20),
  registered_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
) ENGINE=InnoDB;

CREATE TABLE patient_contacts (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  patient_id  INT NOT NULL,
  kind        ENUM('Next of Kin','Emergency') NOT NULL,
  name        VARCHAR(120),
  relationship VARCHAR(40),
  phone       VARCHAR(30),
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 5. FINANCE (declared before appointments/visits so they can link an invoice)
-- ---------------------------------------------------------------------
CREATE TABLE invoices (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  invoice_no    VARCHAR(20) NOT NULL UNIQUE,
  patient_id    INT NOT NULL,
  source_type   ENUM('Appointment','Visit','Admission','Pharmacy','Lab','Other') DEFAULT 'Other',
  source_ref    VARCHAR(30),
  payer         ENUM('NHIS','Private','Cash') DEFAULT 'Cash',
  status        ENUM('Pending','Paid','NHIS Claim','Claim Submitted','Overdue') DEFAULT 'Pending',
  total         DECIMAL(12,2) DEFAULT 0,
  invoice_date  DATE,
  FOREIGN KEY (patient_id) REFERENCES patients(id)
) ENGINE=InnoDB;

CREATE TABLE invoice_items (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id  INT NOT NULL,
  description VARCHAR(150),
  amount      DECIMAL(12,2),
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE payments (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id  INT NOT NULL,
  amount      DECIMAL(12,2),
  method      VARCHAR(30),
  paid_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 6. APPOINTMENTS, VISITS & PATIENT FLOW
-- ---------------------------------------------------------------------
CREATE TABLE appointments (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  appointment_no    VARCHAR(20) NOT NULL UNIQUE,
  patient_id        INT NOT NULL,
  doctor_employee_id INT,
  department_id     INT,
  appt_date         DATE,
  appt_time         TIME,
  appt_type         ENUM('New','Follow-up','Review') DEFAULT 'New',
  status            ENUM('Scheduled','Checked-in','Completed','No Show','Cancelled') DEFAULT 'Scheduled',
  invoice_id        INT NULL,           -- links to finance (pending payment)
  FOREIGN KEY (patient_id)         REFERENCES patients(id),
  FOREIGN KEY (doctor_employee_id) REFERENCES employees(id),
  FOREIGN KEY (department_id)      REFERENCES departments(id),
  FOREIGN KEY (invoice_id)         REFERENCES invoices(id)
) ENGINE=InnoDB;

CREATE TABLE patient_visits (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  patient_id     INT NOT NULL,
  department_id  INT,
  visit_type     ENUM('Walk-in','Appointment','Emergency') DEFAULT 'Walk-in',
  priority       ENUM('Routine','Urgent','Emergency') DEFAULT 'Routine',
  reason         VARCHAR(200),
  doctor_employee_id INT,
  room           VARCHAR(20),
  arrived_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  waiting_minutes INT DEFAULT 0,
  stage          VARCHAR(40),
  status         ENUM('Registered','Waiting','In Triage','Waiting for Doctor','In Consultation','Laboratory','Imaging','Pharmacy','Admitted','Discharged') DEFAULT 'Registered',
  invoice_id     INT NULL,
  FOREIGN KEY (patient_id)    REFERENCES patients(id),
  FOREIGN KEY (department_id) REFERENCES departments(id),
  FOREIGN KEY (doctor_employee_id) REFERENCES employees(id),
  FOREIGN KEY (invoice_id)    REFERENCES invoices(id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 7. BEDS + ADMISSIONS + TRANSFERS   (beds link to current patient)
-- ---------------------------------------------------------------------
CREATE TABLE beds (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  ward_id            INT NOT NULL,
  room_id            INT NULL,
  code               VARCHAR(20) NOT NULL,
  status             ENUM('Available','Occupied','Reserved','Cleaning','Maintenance','Isolation','Unavailable') DEFAULT 'Available',
  current_patient_id INT NULL,
  note               VARCHAR(120),
  FOREIGN KEY (ward_id)            REFERENCES wards(id),
  FOREIGN KEY (room_id)            REFERENCES rooms(id),
  FOREIGN KEY (current_patient_id) REFERENCES patients(id)
) ENGINE=InnoDB;

CREATE TABLE admissions (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  admission_no       VARCHAR(20) NOT NULL UNIQUE,
  patient_id         INT NOT NULL,
  ward_id            INT,
  bed_id             INT,
  doctor_employee_id INT,
  admitted_at        DATETIME,
  diagnosis          VARCHAR(200),
  deposit            DECIMAL(12,2) DEFAULT 0,
  status             ENUM('Admitted','Pending Discharge','Discharged') DEFAULT 'Admitted',
  FOREIGN KEY (patient_id)         REFERENCES patients(id),
  FOREIGN KEY (ward_id)            REFERENCES wards(id),
  FOREIGN KEY (bed_id)             REFERENCES beds(id),
  FOREIGN KEY (doctor_employee_id) REFERENCES employees(id)
) ENGINE=InnoDB;

CREATE TABLE discharges (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  discharge_no  VARCHAR(20) NOT NULL UNIQUE,
  admission_id  INT,
  patient_id    INT NOT NULL,
  discharged_at DATETIME,
  summary       VARCHAR(255),
  follow_up_date DATE,
  bill_status   ENUM('Paid','Pending','NHIS Claim') DEFAULT 'Pending',
  FOREIGN KEY (admission_id) REFERENCES admissions(id),
  FOREIGN KEY (patient_id)   REFERENCES patients(id)
) ENGINE=InnoDB;

CREATE TABLE patient_transfers (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  patient_id    INT NOT NULL,
  from_location VARCHAR(80),
  to_location   VARCHAR(80),
  reason        VARCHAR(200),
  moved_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  moved_by      INT NULL,
  FOREIGN KEY (patient_id) REFERENCES patients(id),
  FOREIGN KEY (moved_by)   REFERENCES employees(id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 8. NURSING, DOCTORS, THEATRE
-- ---------------------------------------------------------------------
CREATE TABLE nursing_tasks (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  patient_id       INT,
  ward_id          INT,
  bed_code         VARCHAR(20),
  task             VARCHAR(150),
  due_time         VARCHAR(10),
  nurse_employee_id INT,
  priority         ENUM('Routine','High','Critical') DEFAULT 'Routine',
  status           ENUM('Pending','Done') DEFAULT 'Pending',
  FOREIGN KEY (patient_id) REFERENCES patients(id),
  FOREIGN KEY (ward_id)    REFERENCES wards(id),
  FOREIGN KEY (nurse_employee_id) REFERENCES employees(id)
) ENGINE=InnoDB;

CREATE TABLE referrals (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  patient_id         INT NOT NULL,
  from_employee_id   INT,
  to_department_id   INT,
  reason             VARCHAR(200),
  referral_date      DATE,
  status             ENUM('Pending','Accepted','Completed') DEFAULT 'Pending',
  FOREIGN KEY (patient_id)       REFERENCES patients(id),
  FOREIGN KEY (from_employee_id) REFERENCES employees(id),
  FOREIGN KEY (to_department_id) REFERENCES departments(id)
) ENGINE=InnoDB;

CREATE TABLE theatre_cases (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  case_no            VARCHAR(20) NOT NULL UNIQUE,
  patient_id         INT NOT NULL,
  procedure_name     VARCHAR(150),
  surgeon_employee_id INT,
  theatre_room       VARCHAR(40),
  scheduled_date     DATE,
  scheduled_time     TIME,
  est_duration       VARCHAR(20),
  status             ENUM('Scheduled','Pre-Op','In Theatre','Recovery','Completed','Cancelled') DEFAULT 'Scheduled',
  team               VARCHAR(200),
  FOREIGN KEY (patient_id)          REFERENCES patients(id),
  FOREIGN KEY (surgeon_employee_id) REFERENCES employees(id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 9. LABORATORY & PHARMACY  (linked to the patient record)
-- ---------------------------------------------------------------------
CREATE TABLE lab_orders (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  order_no          VARCHAR(20) NOT NULL UNIQUE,
  patient_id        INT NOT NULL,
  ordered_by_id     INT,
  priority          ENUM('Routine','Urgent') DEFAULT 'Routine',
  status            ENUM('Ordered','Sample Collected','In Progress','Resulted','Verified') DEFAULT 'Ordered',
  collected_at      VARCHAR(10),
  result            TEXT,
  FOREIGN KEY (patient_id)    REFERENCES patients(id),
  FOREIGN KEY (ordered_by_id) REFERENCES employees(id)
) ENGINE=InnoDB;

CREATE TABLE lab_order_tests (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  lab_order_id INT NOT NULL,
  test_name   VARCHAR(80),
  FOREIGN KEY (lab_order_id) REFERENCES lab_orders(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE prescriptions (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  rx_no         VARCHAR(20) NOT NULL UNIQUE,
  patient_id    INT NOT NULL,
  prescriber_id INT,
  rx_time       VARCHAR(10),
  status        ENUM('Pending','Being Prepared','Dispensed','Cancelled') DEFAULT 'Pending',
  FOREIGN KEY (patient_id)    REFERENCES patients(id),
  FOREIGN KEY (prescriber_id) REFERENCES employees(id)
) ENGINE=InnoDB;

CREATE TABLE prescription_items (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  prescription_id INT NOT NULL,
  drug            VARCHAR(120),
  dose            VARCHAR(60),
  qty             INT,
  FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE pharmacy_stock (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  drug        VARCHAR(120) NOT NULL,
  category    VARCHAR(60),
  qty         INT DEFAULT 0,
  reorder_level INT DEFAULT 0,
  expiry      DATE,
  cold_chain  TINYINT(1) DEFAULT 0,
  status      ENUM('OK','Low','Out') DEFAULT 'OK'
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 10. FACILITY / MAINTENANCE / BIOMEDICAL
-- ---------------------------------------------------------------------
CREATE TABLE assets (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  hospital_id    INT NOT NULL,
  tag            VARCHAR(30) NOT NULL UNIQUE,
  name           VARCHAR(120),
  category       VARCHAR(60),
  location       VARCHAR(80),
  status         ENUM('Operational','Under Maintenance','Out of Service','Retired') DEFAULT 'Operational',
  warranty_expiry DATE,
  vendor         VARCHAR(80),
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
) ENGINE=InnoDB;

CREATE TABLE maintenance_requests (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  ticket_no     VARCHAR(20) NOT NULL UNIQUE,
  department_id INT,
  location      VARCHAR(80),
  room          VARCHAR(30),
  bed_id        INT NULL,
  equipment     VARCHAR(120),
  category      ENUM('Electrical','Plumbing','HVAC','Mechanical','Biomedical','Building','Furniture','IT','Safety','Cleaning','Other'),
  priority      ENUM('Low','Medium','High','Critical','Emergency') DEFAULT 'Medium',
  description   VARCHAR(255),
  reporter      VARCHAR(120),
  status        ENUM('Submitted','Reviewed','Approved','Assigned','In Progress','On Hold','Completed','Verified','Closed') DEFAULT 'Submitted',
  assigned_to_id INT NULL,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id)  REFERENCES departments(id),
  FOREIGN KEY (bed_id)         REFERENCES beds(id),
  FOREIGN KEY (assigned_to_id) REFERENCES employees(id)
) ENGINE=InnoDB;

CREATE TABLE work_orders (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  wo_no          VARCHAR(20) NOT NULL UNIQUE,
  request_id     INT NULL,
  title          VARCHAR(150),
  department     VARCHAR(60),
  location       VARCHAR(80),
  equipment      VARCHAR(120),
  category       VARCHAR(40),
  priority       ENUM('Low','Medium','High','Critical','Emergency') DEFAULT 'Medium',
  engineer_id    INT NULL,
  due_date       DATE,
  status         ENUM('Open','Assigned','In Progress','On Hold','Completed','Verified','Closed') DEFAULT 'Open',
  cost           DECIMAL(12,2) DEFAULT 0,
  FOREIGN KEY (request_id)  REFERENCES maintenance_requests(id),
  FOREIGN KEY (engineer_id) REFERENCES employees(id)
) ENGINE=InnoDB;

CREATE TABLE work_order_checklist (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  work_order_id INT NOT NULL,
  task         VARCHAR(150),
  done         TINYINT(1) DEFAULT 0,
  FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE work_order_comments (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  work_order_id INT NOT NULL,
  author       VARCHAR(80),
  body         VARCHAR(255),
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE work_order_materials (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  work_order_id INT NOT NULL,
  item         VARCHAR(120),
  qty          INT,
  cost         DECIMAL(12,2),
  FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE work_order_history (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  work_order_id INT NOT NULL,
  event        VARCHAR(200),
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE preventive_maintenance_plans (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  plan_no       VARCHAR(20) NOT NULL UNIQUE,
  asset_id      INT NULL,
  asset_name    VARCHAR(120),
  category      VARCHAR(60),
  frequency     ENUM('Daily','Weekly','Monthly','Quarterly','Biannual','Annual'),
  engineer_id   INT NULL,
  next_due      DATE,
  last_done     DATE,
  status        ENUM('Scheduled','Due Today','Overdue') DEFAULT 'Scheduled',
  FOREIGN KEY (asset_id)    REFERENCES assets(id),
  FOREIGN KEY (engineer_id) REFERENCES employees(id)
) ENGINE=InnoDB;

CREATE TABLE inspection_checklists (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  ref_no      VARCHAR(20) NOT NULL UNIQUE,
  area        VARCHAR(80),
  type        VARCHAR(60),
  inspector_id INT NULL,
  inspect_date DATE,
  score       INT,
  status      ENUM('Passed','Action Required','Failed') DEFAULT 'Passed',
  findings    VARCHAR(255),
  FOREIGN KEY (inspector_id) REFERENCES employees(id)
) ENGINE=InnoDB;

-- Biomedical equipment (CT, MRI, X-ray, ultrasound, endoscopy, ...)
CREATE TABLE biomedical_equipment (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  asset_tag      VARCHAR(30) NOT NULL UNIQUE,
  name           VARCHAR(120) NOT NULL,
  category       VARCHAR(60),
  location       VARCHAR(80),
  manufacturer   VARCHAR(80),
  status         ENUM('Operational','Under Repair','Out of Service','Calibration Due') DEFAULT 'Operational',
  last_serviced  DATE,
  next_service   DATE
) ENGINE=InnoDB;

CREATE TABLE biomedical_tickets (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  ticket_no      VARCHAR(20) NOT NULL UNIQUE,
  equipment_id   INT NOT NULL,
  reported_by    VARCHAR(120),
  fault          VARCHAR(255),
  priority       ENUM('Low','Medium','High','Critical') DEFAULT 'Medium',
  status         ENUM('Open','In Progress','Awaiting Parts','Resolved','Closed') DEFAULT 'Open',
  assigned_to_id INT NULL,
  reported_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at    DATETIME NULL,
  FOREIGN KEY (equipment_id)   REFERENCES biomedical_equipment(id),
  FOREIGN KEY (assigned_to_id) REFERENCES employees(id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 11. SUPPLY CHAIN
-- ---------------------------------------------------------------------
CREATE TABLE inventory_items (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  sku         VARCHAR(30) NOT NULL UNIQUE,
  name        VARCHAR(120),
  category    VARCHAR(60),
  location    VARCHAR(60),
  qty         INT DEFAULT 0,
  uom         VARCHAR(20),
  reorder_level INT DEFAULT 0,
  status      ENUM('OK','Low','Out') DEFAULT 'OK'
) ENGINE=InnoDB;

CREATE TABLE suppliers (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  code      VARCHAR(20) NOT NULL UNIQUE,
  name      VARCHAR(120),
  category  VARCHAR(60),
  contact   VARCHAR(120),
  rating    DECIMAL(2,1),
  status    ENUM('Active','Inactive') DEFAULT 'Active'
) ENGINE=InnoDB;

CREATE TABLE purchase_requests (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  pr_no        VARCHAR(20) NOT NULL UNIQUE,
  item         VARCHAR(120),
  qty          INT,
  department   VARCHAR(60),
  requested_by VARCHAR(120),
  request_date DATE,
  est_cost     DECIMAL(12,2),
  status       ENUM('Pending','Approved','Rejected','Ordered') DEFAULT 'Pending'
) ENGINE=InnoDB;

CREATE TABLE purchase_orders (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  po_no        VARCHAR(20) NOT NULL UNIQUE,
  supplier_id  INT,
  linked_pr_id INT NULL,
  items        VARCHAR(255),
  total        DECIMAL(12,2),
  order_date   DATE,
  status       ENUM('Draft','Sent','Partially Received','Received','Closed') DEFAULT 'Draft',
  FOREIGN KEY (supplier_id)  REFERENCES suppliers(id),
  FOREIGN KEY (linked_pr_id) REFERENCES purchase_requests(id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 12. PLATFORM
-- ---------------------------------------------------------------------
CREATE TABLE notifications (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NULL,
  body        VARCHAR(255),
  entity_type VARCHAR(40),
  entity_id   INT,
  is_read     TINYINT(1) DEFAULT 0,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE audit_logs (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NULL,
  action      VARCHAR(60),
  entity_type VARCHAR(40),
  entity_id   INT,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- =====================================================================
-- DUMMY DATA
-- =====================================================================
INSERT INTO organizations (id,name) VALUES (1,'The Bank Hospital Group');
INSERT INTO hospitals (id,organization_id,name,code,city) VALUES (1,1,'The Bank Hospital','TBH','Accra');
INSERT INTO buildings (id,hospital_id,name) VALUES (1,1,'Block A'),(2,1,'Block B'),(3,1,'Block C');
INSERT INTO floors (id,building_id,name,level) VALUES (1,1,'1st Floor',1),(2,2,'2nd Floor',2),(3,2,'3rd Floor',3),(4,3,'1st Floor',1);

INSERT INTO roles (id,name,default_dashboard) VALUES
 (1,'Hospital Administrator','general'),(2,'Medical Director','general'),(3,'Front Desk Officer','front-desk'),
 (4,'OPD Officer','opd'),(5,'Doctor','opd'),(6,'Nurse','ward'),(7,'Ward Manager','ward'),
 (8,'HR Officer','hr'),(9,'Maintenance Manager','maintenance'),(10,'Engineer','engineer-mobile'),
 (11,'Biomedical Engineer','biomedical'),(12,'Pharmacist','pharmacy'),(13,'Lab Scientist','laboratory'),
 (14,'Inventory Officer','inventory'),(15,'Finance Officer','finance'),(16,'Department Head','general'),
 (17,'System Administrator','general');

INSERT INTO departments (id,hospital_id,name,type,cost_centre) VALUES
 (1,1,'Front Desk','Administrative','CC-100'),(2,1,'OPD','Clinical','CC-200'),(3,1,'Wards','Clinical','CC-210'),
 (4,1,'ICU','Clinical','CC-220'),(5,1,'Maternity','Clinical','CC-230'),(6,1,'Laboratory','Diagnostic','CC-300'),
 (7,1,'Pharmacy','Clinical Support','CC-310'),(8,1,'Theatre','Clinical','CC-240'),(9,1,'Maintenance','Facility','CC-400'),
 (10,1,'Biomedical','Facility','CC-410'),(11,1,'Human Resources','Administrative','CC-500'),
 (12,1,'Finance','Administrative','CC-510'),(13,1,'Stores & Procurement','Administrative','CC-520');

INSERT INTO wards (id,hospital_id,floor_id,code,name,building,floor_name,staff_on_duty) VALUES
 (1,1,1,'W-A','Ward A — General Male','Block A','1st Floor',4),
 (2,1,1,'W-B','Ward B — General Female','Block A','1st Floor',5),
 (3,1,2,'W-P','Ward P — Paediatrics','Block B','2nd Floor',6),
 (4,1,3,'W-ICU','ICU — Critical Care','Block B','3rd Floor',8),
 (5,1,4,'W-MAT','Maternity Ward','Block C','1st Floor',5);

INSERT INTO shifts (id,name,start_time,end_time) VALUES
 (1,'Morning','07:00','15:00'),(2,'Afternoon','13:00','21:00'),(3,'Night','19:00','07:00'),(4,'On-Call','00:00','23:59');

INSERT INTO employees (id,hospital_id,department_id,staff_id,full_name,job_role,phone,email,qualification,employment_status,default_shift,present_today,hired_on) VALUES
 (1,1,2,'MGH-0001','Dr. Priya Nair','Doctor','+233240000001','priya.nair@mgh.gh','MBChB, MD','Active','Morning',1,'2019-03-01'),
 (2,1,2,'MGH-0002','Dr. Kojo Amankwah','Doctor','+233240000002','kojo.amankwah@mgh.gh','MBChB','Active','Morning',1,'2017-06-12'),
 (3,1,3,'MGH-0003','Ama Owusu','Nurse','+233240000003','ama.owusu@mgh.gh','RN, BSc Nursing','Active','Morning',1,'2020-01-20'),
 (4,1,3,'MGH-0004','Yaw Darko','Ward Manager','+233240000004','yaw.darko@mgh.gh','RN, MSc','Active','Morning',1,'2015-09-05'),
 (5,1,1,'MGH-0005','Grace Mensah','Front Desk Officer','+233240000005','grace.mensah@mgh.gh','HND Admin','Active','Morning',1,'2021-04-14'),
 (6,1,2,'MGH-0006','Kofi Boateng','OPD Officer','+233240000006','kofi.boateng@mgh.gh','BSc Health Admin','Active','Afternoon',1,'2022-02-01'),
 (7,1,9,'MGH-0007','Isaac Nkrumah','Engineer','+233240000007','isaac.nkrumah@mgh.gh','BSc Mechanical Eng','Active','Morning',1,'2018-11-11'),
 (8,1,10,'MGH-0008','Efua Sarpong','Biomedical Engineer','+233240000008','efua.sarpong@mgh.gh','BSc Biomedical Eng','Active','Morning',1,'2019-07-22'),
 (9,1,9,'MGH-0009','Kwabena Asare','Engineer','+233240000009','kwabena.asare@mgh.gh','HND Electrical','On Leave','Night',0,'2020-05-30'),
 (10,1,11,'MGH-0010','Linda Adjei','HR Officer','+233240000010','linda.adjei@mgh.gh','BSc HRM','Active','Morning',1,'2016-08-19'),
 (11,1,12,'MGH-0011','Comfort Addo','Finance Officer','+233240000011','comfort.addo@mgh.gh','ACCA','Active','Morning',0,'2017-10-03'),
 (12,1,3,'MGH-0012','Patience Owusu','Nurse','+233240000013','patience.owusu@mgh.gh','RN','Active','Night',1,'2022-06-15'),
 (13,1,5,'MGH-0013','Dr. Naomi Asante','Medical Director','+233240000014','naomi.asante@mgh.gh','MBChB, FWACS','Active','Morning',1,'2012-01-10'),
 (14,1,7,'MGH-0014','Abena Kufuor','Pharmacist','+233240000015','abena.kufuor@mgh.gh','PharmD','Active','Morning',1,'2019-02-11'),
 (15,1,6,'MGH-0015','Kojo Baffour','Lab Scientist','+233240000016','kojo.baffour@mgh.gh','BSc MLS','Active','Morning',1,'2020-09-01'),
 (16,1,13,'MGH-0016','Michael Osei','Inventory Officer','+233240000017','michael.osei@mgh.gh','BSc Procurement','Active','Morning',1,'2018-03-19'),
 (17,1,1,'MGH-0017','Dr. Alexander Vaughan','Hospital Administrator','+233240000018','alex.vaughan@mgh.gh','MBA, MPH','Active','Morning',1,'2010-05-01');

UPDATE departments SET head_employee_id=5  WHERE id=1;
UPDATE departments SET head_employee_id=1  WHERE id=2;
UPDATE departments SET head_employee_id=4  WHERE id=3;
UPDATE departments SET head_employee_id=13 WHERE id=5;
UPDATE departments SET head_employee_id=15 WHERE id=6;
UPDATE departments SET head_employee_id=14 WHERE id=7;
UPDATE departments SET head_employee_id=7  WHERE id=9;
UPDATE departments SET head_employee_id=8  WHERE id=10;
UPDATE departments SET head_employee_id=10 WHERE id=11;
UPDATE departments SET head_employee_id=11 WHERE id=12;
UPDATE departments SET head_employee_id=16 WHERE id=13;

-- users (password_hash shown as bcrypt of 'password' — replace in production)
INSERT INTO users (id,employee_id,role_id,username,email,password_hash,is_active,last_login) VALUES
 (1,17,1,'admin','alex.vaughan@mgh.gh','$2b$10$examplehashadminxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',1,'2026-07-19 08:01'),
 (2,13,2,'ndirector','naomi.asante@mgh.gh','$2b$10$examplehashdirxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',1,'2026-07-19 08:03'),
 (3,5,3,'gmensah','grace.mensah@mgh.gh','$2b$10$examplehashfdxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',1,'2026-07-19 07:45'),
 (4,1,5,'pnair','priya.nair@mgh.gh','$2b$10$examplehashdocxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',1,'2026-07-19 08:00'),
 (5,14,12,'akufuor','abena.kufuor@mgh.gh','$2b$10$examplehashphxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',1,'2026-07-19 08:10'),
 (6,15,13,'kbaffour','kojo.baffour@mgh.gh','$2b$10$examplehashlabxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',1,'2026-07-19 08:12');

-- PATIENT MASTER RECORDS (bio-data)
INSERT INTO patients (id,hospital_id,patient_no,first_name,last_name,dob,gender,blood_group,genotype,national_id,phone,address,insurance_type,insurance_status,registered_at) VALUES
 (1,1,'P-100234','Abena','Frimpong','1988-04-12','Female','O+','AA','GHA-745120','+233241112233','14 Ring Road, Accra','NHIS','Active','2026-07-19 08:02'),
 (2,1,'P-100235','Joseph','Mensah','1975-11-30','Male','A+','AS','GHA-338910','+233274458899','2 Spintex Road, Accra','Private','Active','2026-07-19 08:20'),
 (3,1,'P-100236','Fatima','Iddrisu','1994-06-18','Female','B+','AA','GHA-991002','+233203321100','7 Osu Ave, Accra','NHIS','Active','2026-07-19 08:33'),
 (4,1,'P-100237','Emmanuel','Quaye','1960-01-05','Male','O-','AA','GHA-100455','+233249005544','19 Labone, Accra','NHIS','Active','2026-07-19 07:50'),
 (5,1,'P-100238','Rebecca','Owusu','2001-09-22','Female','AB+','AC','GHA-556677','+233271182244','5 Achimota, Accra','NHIS','Active','2026-07-19 09:05'),
 (6,1,'P-100239','Ibrahim','Sule','1983-12-02','Male','A-','AA','GHA-665331','+233246653311','31 Madina, Accra','Private','Active','2026-07-19 08:48'),
 (7,1,'P-100240','Gifty','Ansah','1997-02-14','Female','O+','SS','GHA-447228','+233204472288','8 Dansoman, Accra','NHIS','Active','2026-07-19 07:30'),
 (8,1,'P-100241','Daniel','Appiah','1969-08-08','Male','B-','AA','GHA-220667','+233242206677','11 Tema Comm 5','NHIS','Active','2026-07-19 06:55'),
 (9,1,'P-100253','Vida','Amoah','1992-03-25','Female','O+','AA','GHA-778120','+233201234567','22 Adenta, Accra','Cash','Active','2026-07-17 20:00'),
 (10,1,'P-100261','Kwesi','Boadu','1980-07-19','Male','A+','AS','GHA-889340','+233559871234','40 Kaneshie, Accra','NHIS','Active','2026-07-16 10:00');

INSERT INTO patient_contacts (patient_id,kind,name,relationship,phone) VALUES
 (1,'Next of Kin','Kwame Frimpong','Spouse','+233209987766'),
 (1,'Emergency','Kwame Frimpong','Spouse','+233209987766'),
 (2,'Next of Kin','Mary Mensah','Spouse','+233245561122'),
 (4,'Next of Kin','Esi Quaye','Daughter','+233249000000'),
 (8,'Next of Kin','Sarah Appiah','Spouse','+233242200000');

-- INVOICES (finance) — appointments/visits link here for pending payment
INSERT INTO invoices (id,invoice_no,patient_id,source_type,source_ref,payer,status,total,invoice_date) VALUES
 (1,'INVC-8001',1,'Visit','V-100234','NHIS','NHIS Claim',180.00,'2026-07-19'),
 (2,'INVC-8002',2,'Appointment','AP-5001','Private','Pending',520.00,'2026-07-19'),
 (3,'INVC-8003',8,'Admission','ADM-3001','NHIS','Pending',1450.00,'2026-07-19'),
 (4,'INVC-8004',9,'Admission','ADM-2990','Cash','Paid',2200.00,'2026-07-19'),
 (5,'INVC-8005',6,'Appointment','AP-5002','Private','Paid',340.00,'2026-07-19');
INSERT INTO invoice_items (invoice_id,description,amount) VALUES
 (1,'OPD consultation',60),(1,'Malaria RDT',40),(1,'Medication',80),
 (2,'OPD consultation',120),(2,'ECG',200),(2,'Cardiology referral',200),
 (3,'Admission deposit',500),(3,'Ward bed (1 day)',350),(3,'IV antibiotics',600),
 (4,'Delivery package',2000),(4,'Medication',200),
 (5,'OPD consultation',120),(5,'Lab tests',220);
INSERT INTO payments (invoice_id,amount,method) VALUES (4,2200,'Cash'),(5,340,'Card');

-- APPOINTMENTS (linked to patient + doctor + invoice)
INSERT INTO appointments (id,appointment_no,patient_id,doctor_employee_id,department_id,appt_date,appt_time,appt_type,status,invoice_id) VALUES
 (1,'AP-5001',2,1,2,'2026-07-19','08:30','Follow-up','Checked-in',2),
 (2,'AP-5002',6,2,2,'2026-07-19','09:00','Review','Checked-in',5),
 (3,'AP-5003',7,1,2,'2026-07-19','07:45','Follow-up','Completed',NULL),
 (4,'AP-5004',3,13,5,'2026-07-19','10:15','New','Scheduled',NULL),
 (5,'AP-5005',5,2,2,'2026-07-19','11:00','New','Scheduled',NULL);

-- VISITS / OPD FLOW
INSERT INTO patient_visits (id,patient_id,department_id,visit_type,priority,reason,doctor_employee_id,room,arrived_at,waiting_minutes,stage,status,invoice_id) VALUES
 (1,1,2,'Walk-in','Routine','Persistent headache & fever',1,'OPD-3','2026-07-19 08:05',24,'Doctor Consultation','In Consultation',1),
 (2,2,2,'Appointment','Urgent','Chest tightness on exertion',1,'OPD-3','2026-07-19 08:25',41,'OPD Queue','Waiting for Doctor',2),
 (3,3,2,'Walk-in','Routine','Antenatal check',NULL,'—','2026-07-19 08:40',15,'Triage','In Triage',NULL),
 (4,4,4,'Emergency','Emergency','RTA — suspected fracture',2,'ER-1','2026-07-19 07:52',3,'Doctor Consultation','In Consultation',NULL),
 (5,6,2,'Appointment','Routine','Diabetes review — lab work',2,'OPD-1','2026-07-19 08:50',0,'Laboratory','Laboratory',5);

-- ROOMS + BEDS (bed → current patient link)
INSERT INTO rooms (id,ward_id,name) VALUES (1,1,'Room A1'),(2,2,'Room B1'),(3,4,'ICU Bay');
INSERT INTO beds (id,ward_id,room_id,code,status,current_patient_id,note) VALUES
 (1,1,1,'A01','Occupied',8,NULL),(2,1,1,'A02','Available',NULL,NULL),(3,1,1,'A03','Cleaning',NULL,NULL),
 (4,1,1,'A04','Maintenance',NULL,'MR-2026-014'),(5,1,1,'A05','Occupied',10,NULL),(6,1,1,'A06','Available',NULL,NULL),
 (7,2,2,'B01','Occupied',1,NULL),(8,2,2,'B02','Occupied',7,NULL),(9,2,2,'B03','Available',NULL,NULL),
 (10,2,2,'B09','Maintenance',NULL,'MR-2026-011'),
 (11,4,3,'ICU1','Occupied',4,NULL),(12,4,3,'ICU3','Available',NULL,NULL),(13,4,3,'ICU5','Maintenance',NULL,'MR-2026-009'),
 (14,5,NULL,'M01','Occupied',9,NULL),(15,5,NULL,'M03','Available',NULL,NULL);

-- ADMISSIONS
INSERT INTO admissions (id,admission_no,patient_id,ward_id,bed_id,doctor_employee_id,admitted_at,diagnosis,deposit,status) VALUES
 (1,'ADM-3001',8,1,1,2,'2026-07-19 07:00','Severe pneumonia',500,'Admitted'),
 (2,'ADM-3002',4,4,11,2,'2026-07-19 08:10','RTA — polytrauma',2000,'Admitted'),
 (3,'ADM-3003',9,5,14,13,'2026-07-17 21:30','Labour — spontaneous delivery',800,'Pending Discharge');

INSERT INTO discharges (id,discharge_no,admission_id,patient_id,discharged_at,summary,follow_up_date,bill_status) VALUES
 (1,'DIS-4001',NULL,9,'2026-07-19 09:30','Delivered healthy baby; mother stable.','2026-07-26','Paid'),
 (2,'DIS-4002',NULL,10,'2026-07-18 16:00','Malaria treated; discharged on orals.','2026-07-25','NHIS Claim');

-- NURSING / REFERRALS / THEATRE
INSERT INTO nursing_tasks (patient_id,ward_id,bed_code,task,due_time,nurse_employee_id,priority,status) VALUES
 (8,1,'A01','Vitals check','12:00',3,'Routine','Pending'),
 (8,1,'A01','Administer IV antibiotics','12:30',3,'High','Pending'),
 (4,4,'ICU1','Hourly neuro obs','12:00',12,'Critical','Pending');
INSERT INTO referrals (patient_id,from_employee_id,to_department_id,reason,referral_date,status) VALUES
 (2,1,5,'Chest pain — needs ECG & echo','2026-07-19','Pending'),
 (6,2,6,'HbA1c & lipid panel','2026-07-19','Accepted');
INSERT INTO theatre_cases (id,case_no,patient_id,procedure_name,surgeon_employee_id,theatre_room,scheduled_date,scheduled_time,est_duration,status,team) VALUES
 (1,'OT-01',4,'ORIF — femur fracture',2,'Theatre 1','2026-07-19','13:00','2h','Pre-Op','Anaesthetist, 2 scrub nurses'),
 (2,'OT-02',5,'Appendectomy',13,'Theatre 2','2026-07-19','15:30','1h','Scheduled','Anaesthetist, 1 scrub nurse');

-- LAB + PHARMACY
INSERT INTO lab_orders (id,order_no,patient_id,ordered_by_id,priority,status,collected_at,result) VALUES
 (1,'LAB-7001',6,2,'Routine','In Progress','09:05',NULL),
 (2,'LAB-7002',3,1,'Routine','Sample Collected','08:55',NULL),
 (3,'LAB-7004',1,1,'Routine','Resulted','08:20','Malaria RDT: Positive (P. falciparum)');
INSERT INTO lab_order_tests (lab_order_id,test_name) VALUES
 (1,'HbA1c'),(1,'Lipid Panel'),(2,'Full Blood Count'),(2,'Urinalysis'),(3,'Malaria RDT');
INSERT INTO prescriptions (id,rx_no,patient_id,prescriber_id,rx_time,status) VALUES
 (1,'RX-9001',7,1,'08:10','Pending'),(2,'RX-9002',1,1,'08:40','Being Prepared'),(3,'RX-9003',6,2,'09:15','Pending');
INSERT INTO prescription_items (prescription_id,drug,dose,qty) VALUES
 (1,'Amoxicillin 500mg','TID x5d',15),(1,'Paracetamol 1g','QID x3d',12),
 (2,'Artemether/Lumefantrine','BD x3d',24),(3,'Metformin 850mg','BD',60);
INSERT INTO pharmacy_stock (drug,category,qty,reorder_level,expiry,cold_chain,status) VALUES
 ('Amoxicillin 500mg','Antibiotic',420,200,'2027-03-01',0,'OK'),
 ('Artemether/Lumefantrine','Antimalarial',150,200,'2026-11-01',0,'Low'),
 ('Insulin (Mixtard)','Antidiabetic',60,40,'2026-09-15',1,'OK'),
 ('Measles Vaccine','Vaccine',25,30,'2026-08-10',1,'Low');

-- ASSETS + MAINTENANCE + WORK ORDERS
INSERT INTO assets (id,hospital_id,tag,name,category,location,status,warranty_expiry,vendor) VALUES
 (1,1,'MGH-GEN-01','Standby Generator 500kVA','Power','Plant Room','Operational','2028-01-01','PhilTech Biomedical'),
 (2,1,'MGH-ELV-01','Passenger Elevator (Block B)','Building','Block B','Operational','2029-06-01','LiftCare'),
 (3,1,'MGH-AMB-01','Ambulance (Toyota Hiace)','Fleet','Ambulance Bay','Operational','2027-09-01','Toyota Ghana');

INSERT INTO maintenance_requests (id,ticket_no,department_id,location,room,bed_id,equipment,category,priority,description,reporter,status,assigned_to_id,created_at) VALUES
 (1,'MR-2026-014',3,'Ward A','A04',4,'Hospital bed frame','Furniture','High','Bed frame lever broken.','Ama Owusu','Assigned',7,'2026-07-19 08:10'),
 (2,'MR-2026-011',3,'Ward B','B09',10,'Bedside power outlet','Electrical','High','Power outlet sparks.','Yaw Darko','Assigned',7,'2026-07-19 06:50'),
 (3,'MR-2026-009',4,'ICU','ICU5',13,'Patient monitor','Biomedical','Emergency','Vitals monitor blank.','ICU Nurse','In Progress',8,'2026-07-19 05:40');

INSERT INTO work_orders (id,wo_no,request_id,title,department,location,equipment,category,priority,engineer_id,due_date,status,cost) VALUES
 (1,'WO-2026-041',3,'Repair ICU patient monitor','ICU','ICU5','Patient monitor','Biomedical','Emergency',8,'2026-07-19','In Progress',120),
 (2,'WO-2026-040',1,'Replace Ward A bed lever','Wards','Ward A / A04','Hospital bed','Furniture','High',7,'2026-07-19','Assigned',0);
INSERT INTO work_order_checklist (work_order_id,task,done) VALUES
 (1,'Isolate device from mains',1),(1,'Inspect display board',1),(1,'Replace faulty module',0),(1,'Function test',0),
 (2,'Source replacement lever',0),(2,'Fit and test',0);

INSERT INTO preventive_maintenance_plans (id,plan_no,asset_id,asset_name,category,frequency,engineer_id,next_due,last_done,status) VALUES
 (1,'PM-01',1,'Standby Generator 500kVA','Generators','Weekly',7,'2026-07-21','2026-07-14','Scheduled'),
 (2,'PM-03',2,'Passenger Elevator (Block B)','Elevators','Monthly',7,'2026-07-17','2026-06-17','Overdue');

INSERT INTO inspection_checklists (ref_no,area,type,inspector_id,inspect_date,score,status,findings) VALUES
 ('SA-01','Operating Theatre 1','Infection Control',8,'2026-07-18',96,'Passed','Minor: sharps bin near capacity.'),
 ('SA-03','Electrical Riser B','Electrical Safety',7,'2026-07-16',74,'Action Required','Exposed wiring; work order raised.');

-- BIOMEDICAL EQUIPMENT + TICKETS  (CT, MRI, X-ray, ultrasound, endoscopy...)
INSERT INTO biomedical_equipment (id,asset_tag,name,category,location,manufacturer,status,last_serviced,next_service) VALUES
 (1,'BIO-CT-01','CT Scanner 64-slice','CT Scan','Imaging Suite','Siemens','Operational','2026-06-01','2026-09-01'),
 (2,'BIO-MRI-01','MRI 1.5T','MRI','Imaging Suite','GE Healthcare','Under Repair','2026-05-10','2026-08-10'),
 (3,'BIO-XR-01','Digital X-Ray','X-ray','Radiology','Philips','Operational','2026-06-20','2026-09-20'),
 (4,'BIO-XR-02','Mobile X-Ray','Mobile X-ray','Wards','Philips','Calibration Due','2026-04-15','2026-07-20'),
 (5,'BIO-US-01','Ultrasound Scanner','Ultrasound','Maternity','Mindray','Operational','2026-06-05','2026-09-05'),
 (6,'BIO-END-01','Endoscopy Tower','Endoscopy','Theatre','Olympus','Operational','2026-05-28','2026-08-28'),
 (7,'BIO-ECG-01','Cardiography (ECG)','Cardiography','OPD','Schiller','Operational','2026-06-12','2026-09-12');
INSERT INTO biomedical_tickets (id,ticket_no,equipment_id,reported_by,fault,priority,status,assigned_to_id,reported_at,resolved_at) VALUES
 (1,'BMT-001',2,'Dr. Naomi Asante','MRI coil error, scans aborting mid-sequence.','Critical','In Progress',8,'2026-07-18 09:00',NULL),
 (2,'BMT-002',4,'Ama Owusu','Mobile X-ray battery not holding charge.','High','Awaiting Parts',8,'2026-07-19 07:30',NULL),
 (3,'BMT-003',7,'Kofi Boateng','ECG lead V3 intermittent signal.','Medium','Open',NULL,'2026-07-19 10:15',NULL),
 (4,'BMT-004',1,'Radiographer','CT gantry noise on rotation.','Medium','Resolved',8,'2026-07-15 11:00','2026-07-16 14:30'),
 (5,'BMT-005',5,'Dr. Naomi Asante','Ultrasound probe image freezing.','High','Resolved',8,'2026-07-14 08:00','2026-07-15 10:00');

-- SUPPLY CHAIN
INSERT INTO inventory_items (sku,name,category,location,qty,uom,reorder_level,status) VALUES
 ('MS-0001','Surgical gloves (box)','Medical Supplies','Central Store',340,'box',150,'OK'),
 ('MS-0002','IV cannula 18G','Medical Supplies','Central Store',120,'pcs',200,'Low'),
 ('SP-0007','HEPA filter (theatre AHU)','Maintenance Spare Parts','Engineering Store',4,'pcs',6,'Low'),
 ('MS-0015','Oxygen mask (adult)','Medical Supplies','Central Store',0,'pcs',50,'Out');
INSERT INTO suppliers (code,name,category,contact,rating,status) VALUES
 ('SUP-01','MedSupply Ltd','Medical Supplies','sales@medsupply.gh',4.6,'Active'),
 ('SUP-02','PhilTech Biomedical','Biomedical','orders@philtech.gh',4.2,'Active'),
 ('SUP-03','PharmaDirect','Pharmacy','gh@pharmadirect.com',4.8,'Active');
INSERT INTO purchase_requests (id,pr_no,item,qty,department,requested_by,request_date,est_cost,status) VALUES
 (1,'PR-01','IV cannula 18G',500,'Wards','Yaw Darko','2026-07-19',750,'Pending'),
 (2,'PR-02','HEPA filter (theatre AHU)',8,'Maintenance','Samuel Tetteh','2026-07-18',2400,'Approved');
INSERT INTO purchase_orders (id,po_no,supplier_id,linked_pr_id,items,total,order_date,status) VALUES
 (1,'PO-2601',1,1,'IV cannula 18G x500, Surgical gloves x200',4200,'2026-07-18','Sent'),
 (2,'PO-2603',2,2,'HEPA filter x8',2400,'2026-07-18','Received');

-- SHIFTS / LEAVE
INSERT INTO shift_assignments (employee_id,shift_id,ward_id,ward_label,work_date,status) VALUES
 (3,1,2,'Ward B','2026-07-19','On Duty'),(12,3,1,'Ward A','2026-07-19','Scheduled'),
 (1,1,NULL,'OPD','2026-07-19','On Duty'),(7,1,NULL,'Facility','2026-07-19','On Duty');
INSERT INTO leave_requests (employee_id,leave_type,from_date,to_date,days,status,approver_id) VALUES
 (9,'Annual','2026-07-15','2026-07-25',10,'Approved',10),
 (11,'Sick','2026-07-19','2026-07-19',1,'Pending',NULL),
 (6,'Annual','2026-08-01','2026-08-07',7,'Pending',NULL);

SET FOREIGN_KEY_CHECKS = 1;
-- End of schema + seed data.
