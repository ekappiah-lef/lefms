// =====================================================================
// LEF MS   realistic seed data for the lefms database
// Run:  cd server && npm run seed
// Generates real bcrypt password hashes and replays each work order's
// full transition history through the same state machine the API
// enforces (server/workflow.js), so the seed data exercises exactly the
// same CR -> PR -> CO/CA -> CL (or RJ / reject-to-PR) paths as real use.
//
// Site/region data for Barnes Road, Tema MSC, KMO and Takoradi comes
// from the engineer/region reference file provided for this build; the
// remaining sites, users and tickets are illustrative.
// =====================================================================
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { pool } from './db.js';
import { placeholderTicketNo, finalizeTicketNo } from './ticketNumbers.js';

dotenv.config();

const DEFAULT_PASSWORD = 'ChangeMe@2026';

const REGIONS = [
  { name: 'Greater Accra', code: 'GAR' },
  { name: 'Ashanti', code: 'AS' },
  { name: 'Western', code: 'WR' },
  { name: 'Eastern', code: 'ER' },
];

const ROLES = ['Administrator', 'Supervisor', 'Engineer', 'EHS User', 'Spare User', 'MS User'];

const USERS = [
  { staff_no: 'LEF-A001', full_name: 'Kwame Owusu-Ansah', role: 'Administrator', region: null, phone: '+233 24 100 1001' },
  { staff_no: 'LEF-A002', full_name: 'Abena Konadu', role: 'Administrator', region: null, phone: '+233 24 100 1002' },

  { staff_no: 'LEF-S001', full_name: 'Samuel Tetteh', role: 'Supervisor', region: 'Greater Accra', phone: '+233 24 200 1001' },
  { staff_no: 'LEF-S002', full_name: 'Kwabena Asare', role: 'Supervisor', region: 'Ashanti', phone: '+233 24 200 1002' },
  { staff_no: 'LEF-S003', full_name: 'Comfort Adjei', role: 'Supervisor', region: 'Western', phone: '+233 24 200 1003' },
  { staff_no: 'LEF-S004', full_name: 'Nana Yaa Frimpong', role: 'Supervisor', region: 'Eastern', phone: '+233 24 200 1004' },

  { staff_no: 'LEF-E001', full_name: 'Charles Ofori', role: 'Engineer', region: 'Greater Accra', phone: '0244322098' },
  { staff_no: 'LEF-E002', full_name: 'Gaylord Ansah', role: 'Engineer', region: 'Greater Accra', phone: '0244303944' },
  { staff_no: 'LEF-E003', full_name: 'Isaac Nkrumah', role: 'Engineer', region: 'Greater Accra', phone: '+233 24 200 2003' },
  { staff_no: 'LEF-E004', full_name: 'Kingsley Amposah', role: 'Engineer', region: 'Ashanti', phone: '054518867' },
  { staff_no: 'LEF-E005', full_name: 'Yaw Boateng', role: 'Engineer', region: 'Ashanti', phone: '+233 24 200 2005' },
  { staff_no: 'LEF-E006', full_name: 'Patrick Owusu', role: 'Engineer', region: 'Western', phone: '0540104786' },
  { staff_no: 'LEF-E007', full_name: 'Linda Amoah', role: 'Engineer', region: 'Western', phone: '+233 24 200 2007' },
  { staff_no: 'LEF-E008', full_name: 'Ibrahim Mohammed', role: 'Engineer', region: 'Eastern', phone: '+233 24 200 2008' },

  { staff_no: 'LEF-EH01', full_name: 'Efua Sarpong', role: 'EHS User', region: null, phone: '+233 24 400 1001' },
  { staff_no: 'LEF-EH02', full_name: 'Daniel Ofori-Attah', role: 'EHS User', region: null, phone: '+233 24 400 1002' },

  { staff_no: 'LEF-SP01', full_name: 'Grace Appiah', role: 'Spare User', region: null, phone: '+233 24 500 1001' },
  { staff_no: 'LEF-SP02', full_name: 'Patricia Baidoo', role: 'Spare User', region: null, phone: '+233 24 500 1002' },

  { staff_no: 'LEF-MS01', full_name: 'Emmanuel Boadi', role: 'MS User', region: null, phone: '+233 24 600 1001' },
];

const emailFor = (name) => name.toLowerCase().replace(/[^a-z\s-]/g, '').trim().split(/\s+/).join('.').replace(/-/g, '') + '@lefms.local';

// The 4 real sites come from the engineer/region reference file; the
// rest are illustrative, added for a fuller seed.
const SITES = [
  { code: 'DC-GAR-001', name: 'Barnes Road', region: 'Greater Accra', location: 'Barnes Road, Accra', priority: 'Critical', engineer: 'LEF-E001' },
  { code: 'DC-GAR-002', name: 'Tema MSC', region: 'Greater Accra', location: 'Tema, Greater Accra', priority: 'Critical', engineer: 'LEF-E001' },
  { code: 'DC-AS-001', name: 'KMO', region: 'Ashanti', location: 'Kumasi, Ashanti Region', priority: 'High', engineer: 'LEF-E004' },
  { code: 'DC-WR-001', name: 'Takoradi', region: 'Western', location: 'Takoradi, Western Region', priority: 'High', engineer: 'LEF-E006' },
  { code: 'DC-GAR-003', name: 'Achimota Hub', region: 'Greater Accra', location: 'Achimota, Accra', priority: 'High', engineer: 'LEF-E002' },
  { code: 'DC-GAR-004', name: 'Airport City Node', region: 'Greater Accra', location: 'Airport City, Accra', priority: 'Medium', engineer: 'LEF-E003' },
  { code: 'DC-AS-002', name: 'Suame Relay', region: 'Ashanti', location: 'Suame, Kumasi', priority: 'Medium', engineer: 'LEF-E005' },
  { code: 'DC-WR-002', name: 'Sekondi Node', region: 'Western', location: 'Sekondi, Western Region', priority: 'Medium', engineer: 'LEF-E007' },
  { code: 'DC-ER-001', name: 'Koforidua Hub', region: 'Eastern', location: 'Koforidua, Eastern Region', priority: 'Medium', engineer: 'LEF-E008' },
];

const ASSETS = [
  { tag: 'LEF-GEN-001', name: 'Standby Generator 500kVA', category: 'Generator', site: 'DC-GAR-001', status: 'Operational', warranty: '2028-03-01' },
  { tag: 'LEF-RECT-001', name: 'Rectifier System A', category: 'Rectifier', site: 'DC-GAR-001', status: 'Operational', warranty: '2027-06-15' },
  { tag: 'LEF-CRAC-001', name: 'CRAC Unit 1', category: 'Air Conditioning', site: 'DC-GAR-001', status: 'Under Maintenance', warranty: '2026-12-01' },
  { tag: 'LEF-UPS-001', name: 'UPS Bank   Barnes Road', category: 'Backup Power', site: 'DC-GAR-001', status: 'Operational', warranty: '2029-01-01' },
  { tag: 'LEF-TRF-001', name: '500kVA Transformer', category: 'Transformer', site: 'DC-GAR-002', status: 'Operational', warranty: '2031-01-01' },
  { tag: 'LEF-GEN-002', name: 'Standby Generator 350kVA', category: 'Generator', site: 'DC-GAR-002', status: 'Operational', warranty: '2027-09-01' },
  { tag: 'LEF-CRAC-002', name: 'CRAC Unit   Tema MSC', category: 'Air Conditioning', site: 'DC-GAR-002', status: 'Operational', warranty: '2026-11-20' },
  { tag: 'LEF-RECT-002', name: 'Rectifier System   KMO', category: 'Rectifier', site: 'DC-AS-001', status: 'Operational', warranty: '2030-01-01' },
  { tag: 'LEF-GEN-003', name: 'Standby Generator 250kVA', category: 'Generator', site: 'DC-AS-001', status: 'Operational', warranty: '2027-04-01' },
  { tag: 'LEF-ATS-001', name: 'ATS Panel   KMO', category: 'Electrical Panel', site: 'DC-AS-001', status: 'Under Maintenance', warranty: null },
  { tag: 'LEF-CRAC-003', name: 'CRAC Unit   Takoradi', category: 'Air Conditioning', site: 'DC-WR-001', status: 'Operational', warranty: '2028-08-01' },
  { tag: 'LEF-UPS-002', name: 'UPS Bank   Takoradi', category: 'Backup Power', site: 'DC-WR-001', status: 'Operational', warranty: '2029-05-01' },
];

// Each work order replays: create, then a list of {action, to, actor, at, note}
// transitions. actor/createdBy reference staff_no from USERS.
const WORK_ORDERS = [
  { type: 'CM', site: 'DC-GAR-001', asset: 'LEF-GEN-001', title: 'Generator failed to auto-start during test', description: 'Weekly test run showed the standby generator failed to auto-start on mains-fail simulation. Needs starter battery and control panel check.', priority: 'Critical', createdBy: 'LEF-S001', engineer: 'LEF-E001', createdAt: '2026-06-03 08:10:00',
    path: [
      { action: 'Accept', to: 'PR', actor: 'LEF-E001', at: '2026-06-03 09:00:00', note: 'Accepted   will inspect starter battery and control relay first.' },
      { action: 'Complete', to: 'CO', actor: 'LEF-E001', at: '2026-06-03 15:40:00', note: 'Replaced starter battery, cleaned control relay contacts. Ran 3 successful auto-start tests.' },
      { action: 'Close', to: 'CL', actor: 'LEF-S001', at: '2026-06-04 09:00:00', note: 'Verified on site, generator auto-starts reliably. Closing.' },
    ] },
  { type: 'CM', site: 'DC-GAR-001', asset: 'LEF-CRAC-001', title: 'CRAC unit 1 leaking coolant', description: 'Visible coolant leak under CRAC unit 1, cooling capacity reduced.', priority: 'Critical', createdBy: 'LEF-S001', engineer: 'LEF-E002', createdAt: '2026-08-29 07:45:00',
    path: [ { action: 'Accept', to: 'PR', actor: 'LEF-E002', at: '2026-08-29 08:30:00', note: 'Accepted   sourcing refrigerant and checking for the leak point.' } ] },
  { type: 'CM', site: 'DC-GAR-001', asset: 'LEF-RECT-001', title: 'Rectifier module A3 alarm', description: 'Rectifier system reporting a module A3 fault alarm, redundancy still holding.', priority: 'High', createdBy: 'LEF-S001', engineer: 'LEF-E001', createdAt: '2026-08-20 07:30:00',
    path: [ { action: 'Accept', to: 'PR', actor: 'LEF-E001', at: '2026-08-20 08:15:00', note: 'Accepted   swapping module A3, spare on order.' } ] },
  { type: 'CM', site: 'DC-GAR-002', asset: 'LEF-TRF-001', title: 'Transformer humming loudly and overheating', description: 'Abnormal humming noise and heat from the 500kVA transformer housing, thermal camera shows hotspot.', priority: 'Emergency', createdBy: 'LEF-S001', engineer: 'LEF-E001', createdAt: '2026-06-15 06:00:00',
    path: [
      { action: 'Accept', to: 'PR', actor: 'LEF-E001', at: '2026-06-15 06:20:00', note: 'Accepted   isolating and switching to generator supply while inspecting.' },
      { action: 'Complete', to: 'CO', actor: 'LEF-E001', at: '2026-06-15 11:00:00', note: 'Loose HV connection found and re-torqued, cooling fan cleaned. Thermal scan now normal.' },
      { action: 'Close', to: 'CL', actor: 'LEF-S001', at: '2026-06-15 16:00:00', note: 'Verified thermal readings normal, restored mains supply. Closing.' },
    ] },
  { type: 'CM', site: 'DC-GAR-002', asset: 'LEF-GEN-002', title: 'Generator low oil pressure warning', description: 'Standby generator showing intermittent low oil pressure warning during test runs.', priority: 'High', createdBy: 'LEF-S001', engineer: 'LEF-E003', createdAt: '2026-08-24 08:00:00',
    path: [
      { action: 'Accept', to: 'PR', actor: 'LEF-E003', at: '2026-08-24 08:30:00', note: 'Accepted   checking oil level and pressure sender.' },
      { action: 'Complete', to: 'CO', actor: 'LEF-E003', at: '2026-08-26 15:00:00', note: 'Topped up oil, replaced faulty pressure sender. Warning cleared.' },
    ] },
  { type: 'CM', site: 'DC-AS-001', asset: 'LEF-ATS-001', title: 'ATS panel fails to transfer on mains fail', description: 'Automatic transfer switch did not transfer to generator during a real mains outage last night.', priority: 'Emergency', createdBy: 'LEF-S002', engineer: 'LEF-E004', createdAt: '2026-08-30 07:30:00',
    path: [ { action: 'Accept', to: 'PR', actor: 'LEF-E004', at: '2026-08-30 08:00:00', note: 'Accepted   diagnosing ATS control board.' } ] },
  { type: 'CM', site: 'DC-AS-001', asset: 'LEF-RECT-002', title: 'Rectifier fan noise', description: 'Cooling fan on rectifier system making a grinding noise.', priority: 'Medium', createdBy: 'LEF-S002', engineer: 'LEF-E005', createdAt: '2026-08-15 09:00:00',
    path: [
      { action: 'Accept', to: 'PR', actor: 'LEF-E005', at: '2026-08-15 10:00:00', note: 'Accepted.' },
      { action: 'Cancel', to: 'CA', actor: 'LEF-E005', at: '2026-08-16 11:00:00', note: 'Replacement fan out of stock locally   cancelling this ticket, spare request raised separately.' },
    ] },
  { type: 'CM', site: 'DC-WR-001', asset: 'LEF-CRAC-003', title: 'CRAC unit high discharge temperature alarm', description: 'CRAC unit at Takoradi tripped on high discharge temperature, backup unit picked up load.', priority: 'Critical', createdBy: 'LEF-S003', engineer: 'LEF-E006', createdAt: '2026-08-31 07:20:00', path: [] },
  { type: 'CM', site: 'DC-WR-001', asset: 'LEF-UPS-002', title: 'UPS battery fault alarm', description: 'UPS bank showing a persistent battery fault alarm.', priority: 'High', createdBy: 'LEF-S003', engineer: 'LEF-E007', createdAt: '2026-08-27 09:00:00',
    path: [ { action: 'Accept', to: 'PR', actor: 'LEF-E007', at: '2026-08-27 09:45:00', note: 'Accepted   running battery bank diagnostic.' } ] },
  { type: 'CM', site: 'DC-ER-001', asset: null, title: 'Perimeter fence damaged after storm', description: 'About 6 metres of the perimeter fence is down after last night’s storm.', priority: 'Low', createdBy: 'LEF-S004', engineer: 'LEF-E008', createdAt: '2026-08-30 08:00:00',
    path: [ { action: 'Reject', to: 'RJ', actor: 'LEF-E008', at: '2026-08-30 08:50:00', note: 'Fencing contractor needed, outside in-house scope   escalating to facilities vendor.' } ] },

  { type: 'PM', site: 'DC-GAR-001', asset: 'LEF-GEN-001', title: 'Monthly generator load test & service', frequency: 'Monthly', nextDue: '2026-09-05', lastDone: '2026-08-05', description: 'Run load bank test, check oil/coolant levels, test auto-start sequence.', createdBy: 'LEF-S001', engineer: 'LEF-E001', createdAt: '2026-08-01 08:00:00',
    path: [
      { action: 'Accept', to: 'PR', actor: 'LEF-E001', at: '2026-08-01 09:00:00', note: 'Accepted, scheduled for this week.' },
      { action: 'Complete', to: 'CO', actor: 'LEF-E001', at: '2026-08-05 14:00:00', note: 'All checklist items completed, generator in good condition.' },
      { action: 'Close', to: 'CL', actor: 'LEF-S001', at: '2026-08-06 09:00:00', note: 'Reviewed log, closing.' },
    ] },
  { type: 'PM', site: 'DC-GAR-001', asset: 'LEF-CRAC-001', title: 'Quarterly CRAC unit service', frequency: 'Quarterly', nextDue: '2026-11-15', lastDone: '2026-08-15', description: 'Clean condenser coils, check refrigerant charge, inspect belts.', createdBy: 'LEF-S001', engineer: 'LEF-E002', createdAt: '2026-08-10 08:00:00',
    path: [
      { action: 'Accept', to: 'PR', actor: 'LEF-E002', at: '2026-08-10 09:00:00', note: 'Accepted.' },
      { action: 'Complete', to: 'CO', actor: 'LEF-E002', at: '2026-08-15 13:00:00', note: 'Coils cleaned, refrigerant charge within spec, belts in good condition.' },
      { action: 'Close', to: 'CL', actor: 'LEF-S001', at: '2026-08-16 09:00:00', note: 'Closing.' },
    ] },
  { type: 'PM', site: 'DC-GAR-002', asset: 'LEF-TRF-001', title: 'Biannual transformer oil test', frequency: 'Biannual', nextDue: '2026-12-01', lastDone: '2026-06-01', description: 'Oil sample dielectric test, thermal scan, tighten connections.', createdBy: 'LEF-S001', engineer: 'LEF-E001', createdAt: '2026-05-25 08:00:00',
    path: [
      { action: 'Accept', to: 'PR', actor: 'LEF-E001', at: '2026-05-25 09:00:00', note: 'Accepted.' },
      { action: 'Complete', to: 'CO', actor: 'LEF-E001', at: '2026-06-01 12:00:00', note: 'Oil dielectric strength within spec, thermal scan clean, connections tightened.' },
      { action: 'Close', to: 'CL', actor: 'LEF-S001', at: '2026-06-02 09:00:00', note: 'Closing.' },
    ] },
  { type: 'PM', site: 'DC-AS-001', asset: 'LEF-GEN-003', title: 'Weekly generator test run', frequency: 'Weekly', nextDue: '2026-09-02', lastDone: '2026-08-26', description: 'Start generator, verify load transfer, log readings.', createdBy: 'LEF-S002', engineer: 'LEF-E004', createdAt: '2026-08-25 08:00:00',
    path: [
      { action: 'Accept', to: 'PR', actor: 'LEF-E004', at: '2026-08-25 08:30:00', note: 'Accepted.' },
      { action: 'Complete', to: 'CO', actor: 'LEF-E004', at: '2026-08-26 10:00:00', note: 'Load transfer and readings within spec.' },
    ] },
  { type: 'PM', site: 'DC-AS-001', asset: 'LEF-ATS-001', title: 'Annual ATS changeover test', frequency: 'Annual', nextDue: '2027-01-15', lastDone: '2026-01-15', description: 'Simulate mains failure, verify automatic transfer switch changeover time.', createdBy: 'LEF-S002', engineer: 'LEF-E005', createdAt: '2026-08-31 08:00:00', path: [] },
  { type: 'PM', site: 'DC-WR-001', asset: 'LEF-UPS-002', title: 'Monthly UPS battery test', frequency: 'Monthly', nextDue: '2026-09-10', lastDone: '2026-08-10', description: 'Load test battery bank, check runtime, inspect terminals.', createdBy: 'LEF-S003', engineer: 'LEF-E006', createdAt: '2026-08-09 08:00:00',
    path: [
      { action: 'Accept', to: 'PR', actor: 'LEF-E006', at: '2026-08-09 09:00:00', note: 'Accepted.' },
      { action: 'Cancel', to: 'CA', actor: 'LEF-E006', at: '2026-08-10 09:00:00', note: 'Site in a change window today   rescheduling to the next available maintenance slot.' },
    ] },
  { type: 'PM', site: 'DC-WR-001', asset: 'LEF-CRAC-003', title: 'Weekly CRAC filter check', frequency: 'Weekly', nextDue: '2026-09-03', lastDone: null, description: 'Inspect and replace air filters, check airflow.', createdBy: 'LEF-S003', engineer: 'LEF-E007', createdAt: '2026-08-30 08:00:00',
    path: [ { action: 'Reject', to: 'RJ', actor: 'LEF-E007', at: '2026-08-30 08:30:00', note: 'Unit already out of service on the open CM ticket   cannot service until that repair is complete.' } ] },

  { type: 'PLM', site: 'DC-GAR-001', asset: 'LEF-TRF-001', title: 'Transformer capacity upgrade   500kVA to 750kVA', description: 'Planned upgrade of the site transformer ahead of the Q1 capacity expansion.', plannedDate: '2026-11-20', createdBy: 'LEF-S001', engineer: 'LEF-E001', createdAt: '2026-08-01 08:00:00', path: [] },
  { type: 'PLM', site: 'DC-GAR-002', asset: null, title: 'Install second CRAC unit for N+1 redundancy', description: 'Planned installation of a second CRAC unit to bring the site to N+1 cooling redundancy.', plannedDate: '2026-10-15', createdBy: 'LEF-S001', engineer: 'LEF-E003', createdAt: '2026-07-15 08:00:00',
    path: [ { action: 'Accept', to: 'PR', actor: 'LEF-E003', at: '2026-07-16 09:00:00', note: 'Accepted, procurement in progress.' } ] },
  { type: 'PLM', site: 'DC-AS-001', asset: null, title: 'Rectifier system capacity expansion', description: 'Planned addition of two rectifier modules to support projected load growth.', plannedDate: '2026-12-01', createdBy: 'LEF-S002', engineer: 'LEF-E004', createdAt: '2026-08-05 08:00:00',
    path: [
      { action: 'Accept', to: 'PR', actor: 'LEF-E004', at: '2026-08-06 09:00:00', note: 'Accepted, modules on order.' },
      { action: 'Complete', to: 'CO', actor: 'LEF-E004', at: '2026-08-28 15:00:00', note: 'Two additional rectifier modules installed and commissioned.' },
      { action: 'Close', to: 'CL', actor: 'LEF-S002', at: '2026-08-29 09:00:00', note: 'Load test passed, closing.' },
    ] },
  { type: 'PLM', site: 'DC-WR-001', asset: null, title: 'Planned generator replacement', description: 'End-of-life standby generator scheduled for replacement with a higher-capacity unit.', plannedDate: '2027-01-10', createdBy: 'LEF-S003', engineer: 'LEF-E006', createdAt: '2026-08-20 08:00:00', path: [] },
];

// Standing global checklist questions.
const WO_CHECKLIST = [
  'Equipment powered on and tested?',
  'Fluid/oil/refrigerant levels checked and topped up?',
  'Visual inspection for leaks, wear or corrosion completed?',
  'Safety guards, covers and enclosures secured?',
  'Alarm and monitoring points verified?',
  'Readings logged in the maintenance record?',
];

const EHS_CHECKLIST = [
  'Personal protective equipment (PPE) worn?',
  'Isolation / lockout-tagout procedure followed?',
  'Site safety briefing completed?',
  'Hazards identified and controls in place?',
  'Permit to work obtained where required?',
  'Work area secured and signposted?',
  'Tools and equipment inspected before use?',
  'Emergency contacts and procedures confirmed?',
];

const SPARE_ITEMS = [
  { sku: 'SP-BATT-12V', name: '12V VRLA Standby Battery', category: 'Power', unit: 'pcs', unitCost: 850, reorderLevel: 8, qty: 24, store: 'Central Store, Accra' },
  { sku: 'SP-BATT-UPS', name: 'UPS Battery Cell', category: 'Power', unit: 'pcs', unitCost: 620, reorderLevel: 10, qty: 6, store: 'Central Store, Accra' },
  { sku: 'SP-BRK-63A', name: 'MCB 63A Breaker', category: 'Electrical', unit: 'pcs', unitCost: 180, reorderLevel: 6, qty: 15, store: 'Central Store, Accra' },
  { sku: 'SP-FAN-CRAC', name: 'CRAC Condenser Fan Motor', category: 'Cooling', unit: 'pcs', unitCost: 1450, reorderLevel: 3, qty: 4, store: 'Central Store, Accra' },
  { sku: 'SP-BELT-STD', name: 'Standard Drive Belt', category: 'Cooling', unit: 'pcs', unitCost: 95, reorderLevel: 10, qty: 2, store: 'Kumasi Store' },
  { sku: 'SP-RECT-MOD', name: 'Rectifier Module 48V/50A', category: 'Power', unit: 'pcs', unitCost: 3200, reorderLevel: 2, qty: 5, store: 'Central Store, Accra' },
  { sku: 'SP-FILT-AIR', name: 'CRAC Air Filter', category: 'Cooling', unit: 'pcs', unitCost: 60, reorderLevel: 15, qty: 30, store: 'Takoradi Store' },
  { sku: 'SP-CBL-25MM', name: 'Cable 25mm² (per metre)', category: 'Electrical', unit: 'm', unitCost: 45, reorderLevel: 50, qty: 200, store: 'Central Store, Accra' },
  { sku: 'SP-CONTACTOR', name: 'AC Contactor 40A', category: 'Electrical', unit: 'pcs', unitCost: 210, reorderLevel: 5, qty: 3, store: 'Central Store, Accra' },
  { sku: 'SP-REFRIG', name: 'Refrigerant R410A (per kg)', category: 'Cooling', unit: 'kg', unitCost: 130, reorderLevel: 20, qty: 8, store: 'Central Store, Accra' },
];

const TS_COL = { PR: 'accepted_at', CO: 'completed_at', CA: 'cancelled_at', CL: 'closed_at', RJ: 'rejected_at' };

async function main() {
  const conn = await pool.getConnection();
  try {
    console.log('Seeding lefms...');

    const regionId = {};
    for (const r of REGIONS) {
      const [row] = await conn.query('INSERT INTO regions (name, code) VALUES (?, ?)', [r.name, r.code]);
      regionId[r.name] = row.insertId;
    }

    const roleId = {};
    for (const name of ROLES) {
      const [row] = await conn.query('INSERT INTO roles (name) VALUES (?)', [name]);
      roleId[name] = row.insertId;
    }

    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    const userId = {};
    for (const u of USERS) {
      const [row] = await conn.query(
        'INSERT INTO users (staff_no, full_name, email, phone, password_hash, role_id, region_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [u.staff_no, u.full_name, emailFor(u.full_name), u.phone, passwordHash, roleId[u.role], u.region ? regionId[u.region] : null]
      );
      userId[u.staff_no] = row.insertId;
    }

    const siteId = {};
    for (const s of SITES) {
      const [row] = await conn.query(
        'INSERT INTO sites (site_code, name, region_id, location, priority, assigned_engineer_id) VALUES (?, ?, ?, ?, ?, ?)',
        [s.code, s.name, regionId[s.region], s.location, s.priority, userId[s.engineer]]
      );
      siteId[s.code] = row.insertId;
    }

    const assetId = {};
    for (const a of ASSETS) {
      const [row] = await conn.query(
        `INSERT INTO assets (tag, name, category, site_id, warranty_expiry, status) VALUES (?, ?, ?, ?, ?, ?)`,
        [a.tag, a.name, a.category, siteId[a.site], a.warranty || null, a.status]
      );
      assetId[a.tag] = row.insertId;
    }

    for (let i = 0; i < WO_CHECKLIST.length; i++) {
      await conn.query('INSERT INTO wo_checklist_templates (question, sort_order) VALUES (?, ?)', [WO_CHECKLIST[i], i]);
    }
    for (let i = 0; i < EHS_CHECKLIST.length; i++) {
      await conn.query('INSERT INTO ehs_checklist_templates (question, sort_order) VALUES (?, ?)', [EHS_CHECKLIST[i], i]);
    }

    const spareItemId = {};
    for (const s of SPARE_ITEMS) {
      const [row] = await conn.query(
        `INSERT INTO spare_items (sku, name, category, unit, unit_cost, reorder_level, quantity_on_hand, store_location) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [s.sku, s.name, s.category, s.unit, s.unitCost, s.reorderLevel, s.qty, s.store]
      );
      spareItemId[s.sku] = row.insertId;
    }

    async function logHistory(entityType, entityId, fromStatus, toStatus, action, actorStaffNo, note, at) {
      await conn.query(
        'INSERT INTO ticket_history (entity_type, entity_id, from_status, to_status, action, actor_id, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [entityType, entityId, fromStatus, toStatus, action, userId[actorStaffNo], note, at]
      );
    }

    async function replay(id, createdBy, createdAt, path) {
      await logHistory('work_order', id, null, 'CR', 'Create', createdBy, 'Work order created and assigned.', createdAt);
      let status = 'CR';
      for (const step of path) {
        const col = TS_COL[step.to];
        await conn.query(`UPDATE work_orders SET status = ?, ${col} = ? WHERE id = ?`, [step.to, step.at, id]);
        await logHistory('work_order', id, status, step.to, step.action, step.actor, step.note, step.at);
        status = step.to;
      }
      return status;
    }

    let woCount = 0, cmCount = 0, pmCount = 0, plmCount = 0;
    const woIdByTitle = {}; const siteIdByWoTitle = {};
    for (const w of WORK_ORDERS) {
      const site = SITES.find((s) => s.code === w.site);
      const [r] = await conn.query(
        `INSERT INTO work_orders
           (wo_no, wo_type, site_id, site_code, site_name, region_id, region_name, site_location, site_priority,
            asset_id, title, description, priority, frequency, next_due, last_done, planned_date, created_by, engineer_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [placeholderTicketNo(), w.type, siteId[w.site], site.code, site.name, regionId[site.region], site.region, site.location, site.priority,
         w.asset ? assetId[w.asset] : null, w.title, w.description, w.priority || 'Medium',
         w.type === 'PM' ? w.frequency : null, w.type === 'PM' ? w.nextDue : null, w.lastDone || null,
         w.type === 'PLM' ? w.plannedDate : null, userId[w.createdBy], userId[w.engineer], w.createdAt]
      );
      const woId = r.insertId;
      await finalizeTicketNo(conn, 'work_orders', 'wo_no', w.type, woId);

      if (w.type === 'PM') {
        for (const q of WO_CHECKLIST) {
          await conn.query('INSERT INTO work_order_checklist (work_order_id, task, response) VALUES (?, ?, ?)', [woId, q, null]);
        }
      }

      // Every work order gets a linked EHS record, mandatory from creation.
      const [ehsR] = await conn.query(`INSERT INTO ehs_records (ehs_no, work_order_id, status) VALUES (?, ?, 'PENDING')`, [placeholderTicketNo(), woId]);
      await finalizeTicketNo(conn, 'ehs_records', 'ehs_no', 'EHS', ehsR.insertId);
      for (const q of EHS_CHECKLIST) {
        await conn.query('INSERT INTO ehs_checklist (ehs_record_id, question, response) VALUES (?, ?, ?)', [ehsR.insertId, q, null]);
      }
      // For work orders already past Accept, mark EHS submitted (and
      // reviewed if the WO itself has moved past Complete) so seeded
      // history is internally consistent with the "EHS gates Complete" rule.
      const finalStatus = await replay(woId, w.createdBy, w.createdAt, w.path);
      if (['PR', 'CO', 'CL', 'CA'].includes(finalStatus)) {
        await conn.query(`UPDATE ehs_checklist SET response = 'Yes' WHERE ehs_record_id = ?`, [ehsR.insertId]);
        await conn.query(`UPDATE ehs_records SET status = 'SUBMITTED', submitted_by = ?, submitted_at = ? WHERE id = ?`, [userId[w.engineer], w.createdAt, ehsR.insertId]);
      }
      if (['CO', 'CL'].includes(finalStatus)) {
        await conn.query(`UPDATE ehs_records SET status = 'REVIEWED', outcome = 'Approved', reviewed_by = ?, reviewed_at = ? WHERE id = ?`, [userId['LEF-EH01'], w.createdAt, ehsR.insertId]);
      }

      woIdByTitle[w.title] = woId;
      siteIdByWoTitle[w.title] = siteId[w.site];
      woCount++;
      if (w.type === 'CM') cmCount++; else if (w.type === 'PM') pmCount++; else plmCount++;
    }

    // A handful of spare requests spanning every status, so the Spare
    // Parts module has real traceable data from day one.
    async function seedSpareRequest(woTitle, requestedBy, note, createdAt, lines, path) {
      const woId = woIdByTitle[woTitle];
      const siteIdForWo = siteIdByWoTitle[woTitle];
      const [r] = await conn.query(
        'INSERT INTO spare_requests (request_no, work_order_id, site_id, requested_by, note, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [placeholderTicketNo(), woId, siteIdForWo, userId[requestedBy], note, createdAt]
      );
      const requestId = r.insertId;
      await finalizeTicketNo(conn, 'spare_requests', 'request_no', 'SR', requestId);
      const itemRowId = {};
      for (const line of lines) {
        const [[si]] = await conn.query('SELECT unit_cost FROM spare_items WHERE id = ?', [spareItemId[line.sku]]);
        const [ri] = await conn.query(
          'INSERT INTO spare_request_items (spare_request_id, spare_item_id, qty_requested, unit_cost_snapshot) VALUES (?, ?, ?, ?)',
          [requestId, spareItemId[line.sku], line.qty, si.unit_cost]
        );
        itemRowId[line.sku] = ri.insertId;
      }
      await logHistory('spare_request', requestId, null, 'Requested', 'Create', requestedBy, note, createdAt);

      let status = 'Requested';
      for (const step of path) {
        if (step.action === 'approve' || step.action === 'reject') {
          status = step.action === 'approve' ? 'Approved' : 'Rejected';
          await conn.query('UPDATE spare_requests SET status = ?, decided_by = ?, decided_at = ?, decision_note = ? WHERE id = ?', [status, userId[step.actor], step.at, step.note, requestId]);
        } else if (step.action === 'issue') {
          for (const line of step.lines) {
            const riId = itemRowId[line.sku];
            const itemId = spareItemId[line.sku];
            await conn.query('UPDATE spare_request_items SET qty_issued = qty_issued + ? WHERE id = ?', [line.qty, riId]);
            await conn.query('UPDATE spare_items SET quantity_on_hand = quantity_on_hand - ? WHERE id = ?', [line.qty, itemId]);
            await conn.query(
              'INSERT INTO spare_transactions (spare_item_id, spare_request_item_id, type, qty, work_order_id, site_id, performed_by, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [itemId, riId, 'Issue', line.qty, woId, siteIdForWo, userId[step.actor], step.note, step.at]
            );
          }
          const [items] = await conn.query('SELECT qty_requested, qty_issued FROM spare_request_items WHERE spare_request_id = ?', [requestId]);
          status = items.every((i) => i.qty_issued >= i.qty_requested) ? 'Issued' : 'Partially Issued';
          await conn.query('UPDATE spare_requests SET status = ? WHERE id = ?', [status, requestId]);
        }
        await logHistory('spare_request', requestId, status, status, step.action, step.actor, step.note, step.at);
      }
      return requestId;
    }

    let spareRequestCount = 0;
    if (woIdByTitle['Rectifier fan noise']) {
      await seedSpareRequest('Rectifier fan noise', 'LEF-E005', 'Replacement fan needed for rectifier cooling.', '2026-08-16 09:30:00',
        [{ sku: 'SP-FAN-CRAC', qty: 1 }],
        [
          { action: 'approve', actor: 'LEF-SP01', at: '2026-08-16 11:00:00', note: 'Approved, in stock.' },
          { action: 'issue', actor: 'LEF-SP01', at: '2026-08-16 14:00:00', note: 'Issued to site.', lines: [{ sku: 'SP-FAN-CRAC', qty: 1 }] },
        ]);
      spareRequestCount++;
    }
    if (woIdByTitle['UPS battery fault alarm']) {
      await seedSpareRequest('UPS battery fault alarm', 'LEF-E007', 'UPS bank showing two failed cells, need replacement batteries.', '2026-08-27 10:00:00',
        [{ sku: 'SP-BATT-UPS', qty: 2 }],
        [{ action: 'approve', actor: 'LEF-SP01', at: '2026-08-27 13:00:00', note: 'Approved.' }]);
      spareRequestCount++;
    }
    if (woIdByTitle['Rectifier module A3 alarm']) {
      await seedSpareRequest('Rectifier module A3 alarm', 'LEF-E001', 'Faulty rectifier module A3 needs replacement.', '2026-08-20 09:00:00',
        [{ sku: 'SP-RECT-MOD', qty: 1 }, { sku: 'SP-CBL-25MM', qty: 5 }],
        [
          { action: 'approve', actor: 'LEF-SP02', at: '2026-08-20 12:00:00', note: 'Approved.' },
          { action: 'issue', actor: 'LEF-SP02', at: '2026-08-21 09:00:00', note: 'Cable issued now; rectifier module on backorder.', lines: [{ sku: 'SP-CBL-25MM', qty: 5 }] },
        ]);
      spareRequestCount++;
    }
    if (woIdByTitle['ATS panel fails to transfer on mains fail']) {
      await seedSpareRequest('ATS panel fails to transfer on mains fail', 'LEF-E004', 'Suspect faulty ATS control board, requesting replacement contactor as interim.', '2026-08-30 09:00:00',
        [{ sku: 'SP-CONTACTOR', qty: 1 }],
        [{ action: 'reject', actor: 'LEF-SP01', at: '2026-08-30 11:00:00', note: 'Root cause is the control board, not the contactor   raise a fresh request once diagnosis confirms scope.' }]);
      spareRequestCount++;
    }
    if (woIdByTitle['Generator low oil pressure warning']) {
      await seedSpareRequest('Generator low oil pressure warning', 'LEF-E003', 'Need refrigerant top-up for the adjacent CRAC unit while on site.', '2026-08-24 10:00:00',
        [{ sku: 'SP-REFRIG', qty: 3 }], []);
      spareRequestCount++;
    }

    console.log(`Seeded: ${REGIONS.length} regions, ${SITES.length} sites, ${USERS.length} users, ${ASSETS.length} assets, ${SPARE_ITEMS.length} spare items, ${spareRequestCount} spare requests, ${woCount} work orders (${cmCount} CM, ${pmCount} PM, ${plmCount} PLM).`);
    console.log(`All seeded users share the password: ${DEFAULT_PASSWORD}`);
  } finally {
    conn.release();
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
