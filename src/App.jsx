import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { api, backendAvailable } from './api/client';
import { patientFromDb, patientToDb, appointmentToDb } from './api/adapters';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import {
  MOCK_USERS, INITIAL_PATIENTS, INITIAL_APPOINTMENTS, INITIAL_VISITORS,
  INITIAL_DELIVERIES, INITIAL_WARDS, INITIAL_EMPLOYEES, INITIAL_SHIFTS,
  INITIAL_LEAVE, INITIAL_REQUESTS, INITIAL_WORK_ORDERS, INITIAL_PREVENTIVE_TASKS,
  INITIAL_ROUTINE_INSPECTIONS, INITIAL_PROJECTS,
} from './data/mockData';
import {
  EXTRA_USERS, INITIAL_ADMISSIONS, INITIAL_DISCHARGES, INITIAL_NURSING_TASKS,
  INITIAL_REFERRALS, INITIAL_THEATRE_CASES, INITIAL_LAB_ORDERS, INITIAL_PRESCRIPTIONS,
  INITIAL_PHARMACY_STOCK, INITIAL_INVENTORY, INITIAL_SUPPLIERS, INITIAL_PURCHASE_REQUESTS,
  INITIAL_PURCHASE_ORDERS, INITIAL_INVOICES, INITIAL_ASSETS, INITIAL_DEPARTMENTS,
  INITIAL_BIOMED_EQUIPMENT, INITIAL_BIOMED_TICKETS,
} from './data/extraData';
import { canAccess, landingDashboard, moduleById } from './config/platform';
import Login from './pages/Login';
import PatientRecords from './pages/PatientRecords';
import Biomedical from './pages/Biomedical';

// Dashboards
import GeneralDashboard from './pages/dashboards/GeneralDashboard';
import FrontDeskDashboard from './pages/dashboards/FrontDeskDashboard';
import OPDDashboard from './pages/dashboards/OPDDashboard';
import WardDashboard from './pages/dashboards/WardDashboard';
import MaintenanceDashboard from './pages/dashboards/MaintenanceDashboard';
import HRDashboard from './pages/dashboards/HRDashboard';

// Patient services
import FrontDesk from './pages/FrontDesk';
import OPD from './pages/OPD';
import PatientQueue from './pages/PatientQueue';
import Appointments from './pages/Appointments';
import Admissions from './pages/Admissions';
import Discharges from './pages/Discharges';

// Clinical
import BedManagement from './pages/BedManagement';
import Wards from './pages/Wards';
import Nursing from './pages/Nursing';
import Doctors from './pages/Doctors';
import Theatre from './pages/Theatre';
import Laboratory from './pages/Laboratory';
import Pharmacy from './pages/Pharmacy';

// Facility
import MaintenanceRequests from './pages/MaintenanceRequests';
import WorkOrders from './pages/WorkOrders';
import PreventiveMaintenance from './pages/PreventiveMaintenance';
import SafetyAudits from './pages/SafetyAudits';
import Assets from './pages/Assets';
import Engineers from './pages/Engineers';
import EngineerMobile from './pages/EngineerMobile';

// Administration
import HR from './pages/HR';
import StaffAttendance from './pages/StaffAttendance';
import ShiftManagement from './pages/ShiftManagement';
import LeaveManagement from './pages/LeaveManagement';
import Inventory from './pages/Inventory';
import Procurement from './pages/Procurement';
import Finance from './pages/Finance';

// Reports + system
import Reports from './pages/Reports';
import SystemUsers from './pages/system/SystemUsers';
import SystemRoles from './pages/system/SystemRoles';
import SystemDepartments from './pages/system/SystemDepartments';
import SystemPermissions from './pages/system/SystemPermissions';
import Settings from './pages/system/Settings';

const ALL_USERS = [...MOCK_USERS, ...EXTRA_USERS];

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(ALL_USERS[0]);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [dbMode, setDbMode] = useState(false);

  // ---- Global data store (React-managed, propagates live everywhere) ----
  const [patients, setPatients] = useState(INITIAL_PATIENTS);
  const [appointments, setAppointments] = useState(INITIAL_APPOINTMENTS);
  const [visitors, setVisitors] = useState(INITIAL_VISITORS);
  const [deliveries, setDeliveries] = useState(INITIAL_DELIVERIES);
  const [wards, setWards] = useState(INITIAL_WARDS);
  const [employees, setEmployees] = useState(INITIAL_EMPLOYEES);
  const [shifts, setShifts] = useState(INITIAL_SHIFTS);
  const [leave, setLeave] = useState(INITIAL_LEAVE);
  const [requests, setRequests] = useState(INITIAL_REQUESTS);
  const [workOrders, setWorkOrders] = useState(INITIAL_WORK_ORDERS);
  const [preventiveTasks, setPreventiveTasks] = useState(INITIAL_PREVENTIVE_TASKS);
  const [inspections, setInspections] = useState(INITIAL_ROUTINE_INSPECTIONS);
  const [projects, setProjects] = useState(INITIAL_PROJECTS);
  // extended domains
  const [admissions, setAdmissions] = useState(INITIAL_ADMISSIONS);
  const [discharges, setDischarges] = useState(INITIAL_DISCHARGES);
  const [nursingTasks, setNursingTasks] = useState(INITIAL_NURSING_TASKS);
  const [referrals, setReferrals] = useState(INITIAL_REFERRALS);
  const [theatreCases, setTheatreCases] = useState(INITIAL_THEATRE_CASES);
  const [labOrders, setLabOrders] = useState(INITIAL_LAB_ORDERS);
  const [prescriptions, setPrescriptions] = useState(INITIAL_PRESCRIPTIONS);
  const [pharmacyStock, setPharmacyStock] = useState(INITIAL_PHARMACY_STOCK);
  const [inventory, setInventory] = useState(INITIAL_INVENTORY);
  const [suppliers, setSuppliers] = useState(INITIAL_SUPPLIERS);
  const [purchaseRequests, setPurchaseRequests] = useState(INITIAL_PURCHASE_REQUESTS);
  const [purchaseOrders, setPurchaseOrders] = useState(INITIAL_PURCHASE_ORDERS);
  const [invoices, setInvoices] = useState(INITIAL_INVOICES);
  const [assets, setAssets] = useState(INITIAL_ASSETS);
  const [departments, setDepartments] = useState(INITIAL_DEPARTMENTS);
  const [biomedEquipment, setBiomedEquipment] = useState(INITIAL_BIOMED_EQUIPMENT);
  const [biomedTickets, setBiomedTickets] = useState(INITIAL_BIOMED_TICKETS);

  // ---- Auto-sync engine: React store <-> MySQL (via /api/ui) ----------
  // Map of store array -> API resource. Raw setters here; the store hands
  // pages a "synced" version that diffs prev/next and persists changes.
  const RAW = {
    requests: setRequests, workOrders: setWorkOrders, preventiveTasks: setPreventiveTasks,
    inspections: setInspections, biomedEquipment: setBiomedEquipment, biomedTickets: setBiomedTickets,
    admissions: setAdmissions, discharges: setDischarges, labOrders: setLabOrders,
    prescriptions: setPrescriptions, theatreCases: setTheatreCases, invoices: setInvoices,
    appointments: setAppointments, suppliers: setSuppliers, purchaseRequests: setPurchaseRequests,
    purchaseOrders: setPurchaseOrders,
  };
  const WIRED = {
    requests: 'maintenance-requests', workOrders: 'work-orders', preventiveTasks: 'pm-plans',
    inspections: 'safety-audits', biomedEquipment: 'biomedical-equipment', biomedTickets: 'biomedical-tickets',
    admissions: 'admissions', discharges: 'discharges', labOrders: 'lab-orders', prescriptions: 'prescriptions',
    theatreCases: 'theatre-cases', invoices: 'invoices', appointments: 'appointments',
    suppliers: 'suppliers', purchaseRequests: 'purchase-requests', purchaseOrders: 'purchase-orders',
  };
  const NESTED = {
    'work-orders': ['checklist', 'materials', 'comments', 'history'], 'lab-orders': ['tests'],
    prescriptions: ['items'], 'theatre-cases': ['checklist'], 'pm-plans': ['checklist'], invoices: ['services'],
  };

  const clean = (resource, o) => {
    const c = { ...o }; delete c.__synced; delete c.dbId;
    (NESTED[resource] || []).forEach((k) => delete c[k]);
    return c;
  };
  const syncDiff = (resource, prev, next) => {
    const nextIds = new Set(next.map((o) => o.id));
    const prevById = new Map(prev.map((o) => [o.id, o]));
    next.forEach((o) => {
      const before = prevById.get(o.id);
      if (!before) { if (!o.__synced) api.uiCreate(resource, clean(resource, o)).catch(() => {}); }
      else if (JSON.stringify(clean(resource, before)) !== JSON.stringify(clean(resource, o))) {
        api.uiUpdate(resource, o.id, clean(resource, o)).catch(() => {});
      }
    });
    prev.forEach((o) => { if (!nextIds.has(o.id)) api.uiRemove(resource, o.id).catch(() => {}); });
  };
  const makeSynced = (resource, rawSetter) => (updater) => rawSetter((prev) => {
    const next = typeof updater === 'function' ? updater(prev) : updater;
    if (dbMode) syncDiff(resource, prev, next);
    return next;
  });
  const SYNCED = Object.fromEntries(Object.entries(WIRED).map(([k, r]) => [k, makeSynced(r, RAW[k])]));

  // ---- Load real data on login -----------------------------------------
  useEffect(() => {
    if (!loggedIn) return;
    let cancelled = false;
    (async () => {
      if (!(await backendAvailable()) || cancelled) return;
      setDbMode(true);
      try {
        const p = await api.list('patients');
        if (!cancelled && Array.isArray(p) && p.length) setPatients(p.map(patientFromDb));
      } catch { /* keep demo */ }
      for (const [stateKey, resource] of Object.entries(WIRED)) {
        try {
          const rows = await api.uiList(resource);
          if (cancelled || !Array.isArray(rows) || !rows.length) continue;
          const fill = Object.fromEntries((NESTED[resource] || []).map((k) => [k, []]));
          RAW[stateKey](rows.map((r) => ({ ...fill, ...r })));
        } catch { /* keep demo for this resource */ }
      }
    })();
    return () => { cancelled = true; };
  }, [loggedIn]);

  // Create a patient — persists to MySQL when the API is live.
  const addPatient = (uiPatient) => {
    if (dbMode) {
      api.create('patients', patientToDb(uiPatient))
        .then(({ id }) => setPatients((prev) => [{ ...uiPatient, dbId: id }, ...prev]))
        .catch(() => setPatients((prev) => [uiPatient, ...prev]));
    } else {
      setPatients((prev) => [uiPatient, ...prev]);
    }
  };

  // Create an appointment + its pending invoice. The transactional
  // POST /appointments endpoint creates both atomically; we then add them
  // locally flagged __synced so the auto-sync engine won't double-insert.
  const addAppointment = (appt, invoice, patient) => {
    if (dbMode && patient?.dbId) {
      api.create('appointments', appointmentToDb(appt, patient))
        .then((r) => {
          const inv = { ...invoice, id: r.invoice_no || invoice.id, __synced: true };
          const a = { ...appt, invoiceId: r.invoice_no || invoice.id, __synced: true };
          setInvoices((prev) => [inv, ...prev]);
          setAppointments((prev) => [a, ...prev]);
        })
        .catch(() => {
          setInvoices((prev) => [invoice, ...prev]);
          setAppointments((prev) => [{ ...appt, invoiceId: invoice.id }, ...prev]);
        });
    } else {
      setInvoices((prev) => [invoice, ...prev]);
      setAppointments((prev) => [{ ...appt, invoiceId: invoice.id }, ...prev]);
    }
  };

  const store = {
    dbMode, addPatient, addAppointment,
    patients, setPatients, appointments, setAppointments, visitors, setVisitors,
    deliveries, setDeliveries, wards, setWards, employees, setEmployees,
    shifts, setShifts, leave, setLeave, requests, setRequests, workOrders, setWorkOrders,
    preventiveTasks, setPreventiveTasks, inspections, setInspections, projects, setProjects,
    admissions, setAdmissions, discharges, setDischarges, nursingTasks, setNursingTasks,
    referrals, setReferrals, theatreCases, setTheatreCases, labOrders, setLabOrders,
    prescriptions, setPrescriptions, pharmacyStock, setPharmacyStock, inventory, setInventory,
    suppliers, setSuppliers, purchaseRequests, setPurchaseRequests, purchaseOrders, setPurchaseOrders,
    invoices, setInvoices, assets, setAssets, departments, setDepartments,
    biomedEquipment, setBiomedEquipment, biomedTickets, setBiomedTickets,
    allUsers: ALL_USERS, currentUser, go: setCurrentTab,
  };
  // Replace wired setters with auto-persisting versions (pages unchanged).
  Object.entries(SYNCED).forEach(([k, fn]) => { store['set' + k[0].toUpperCase() + k.slice(1)] = fn; });

  const handleUserChange = (user) => {
    setCurrentUser(user);
    if (currentTab !== 'dashboard' && !canAccess(user.role, currentTab)) setCurrentTab('dashboard');
  };

  const navigate = (tab) => {
    if (tab === 'dashboard' || canAccess(currentUser.role, tab)) setCurrentTab(tab);
  };

  const renderDashboard = () => {
    switch (landingDashboard(currentUser.role)) {
      case 'front-desk': return <FrontDeskDashboard store={store} />;
      case 'opd': return <OPDDashboard store={store} />;
      case 'ward': return <WardDashboard store={store} />;
      case 'maintenance': return <MaintenanceDashboard store={store} />;
      case 'hr': return <HRDashboard store={store} />;
      case 'engineer-mobile': return <EngineerMobile store={store} />;
      case 'pharmacy': return <Pharmacy store={store} />;
      case 'laboratory': return <Laboratory store={store} />;
      case 'biomedical': return <Biomedical store={store} />;
      case 'inventory': return <Inventory store={store} />;
      case 'finance': return <Finance store={store} />;
      default: return <GeneralDashboard store={store} />;
    }
  };

  const PAGES = {
    'front-desk': FrontDesk, appointments: Appointments, opd: OPD, 'patient-queue': PatientQueue,
    admissions: Admissions, discharges: Discharges, wards: Wards, 'bed-mgmt': BedManagement,
    nursing: Nursing, doctors: Doctors, theatre: Theatre, laboratory: Laboratory, pharmacy: Pharmacy,
    requests: MaintenanceRequests, 'work-orders': WorkOrders, preventive: PreventiveMaintenance,
    safety: SafetyAudits, assets: Assets, engineers: Engineers, 'engineer-mobile': EngineerMobile,
    hr: HR, attendance: StaffAttendance, shifts: ShiftManagement, leave: LeaveManagement,
    inventory: Inventory, procurement: Procurement, finance: Finance,
    biomedical: Biomedical, 'patient-records': PatientRecords,
    'sys-users': SystemUsers, 'sys-roles': SystemRoles, 'sys-departments': SystemDepartments,
    'sys-permissions': SystemPermissions, settings: Settings,
  };

  const renderTab = () => {
    if (currentTab === 'dashboard') return renderDashboard();
    if (!canAccess(currentUser.role, currentTab)) return renderDashboard();
    if (currentTab === 'hospital-reports') return <Reports store={store} kind="hospital" />;
    if (currentTab === 'maintenance-reports') return <Reports store={store} kind="maintenance" />;
    if (currentTab === 'hr-reports') return <Reports store={store} kind="hr" />;
    const Page = PAGES[currentTab];
    return Page ? <Page store={store} /> : renderDashboard();
  };

  if (!loggedIn) {
    return <Login users={ALL_USERS} onLogin={(u) => { setCurrentUser(u); setCurrentTab('dashboard'); setLoggedIn(true); }} />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar role={currentUser.role} currentTab={currentTab} setCurrentTab={navigate} collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className={`flex flex-col min-h-screen transition-all duration-200 ${collapsed ? 'pl-16' : 'pl-64'}`}>
        <Header currentUser={currentUser} onUserChange={handleUserChange} currentTab={currentTab} users={ALL_USERS} onLogout={() => setLoggedIn(false)} />
        <main className="flex-1 p-5 sm:p-6 max-w-[1400px] w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div key={currentTab + currentUser.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}>
              {renderTab()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
