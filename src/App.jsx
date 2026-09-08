import React, { useState, useEffect, useRef } from 'react';
import { api, getToken, setToken, onUnauthorized } from './api/client';
import { decodeTokenExpiry, startIdleWatcher, IDLE_WARNING_MS } from './lib/session';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './pages/Login';
import Overview from './pages/Overview';
import WorkOrders from './pages/WorkOrders';
import Assets from './pages/Assets';
import SiteDatabase from './pages/SiteDatabase';
import Reports from './pages/Reports';
import TroubleTicketReports from './pages/TroubleTicketReports';
import AdminUsers from './pages/admin/Users';
import AdminRoles from './pages/admin/Roles';
import AdminChecklistTemplates from './pages/admin/ChecklistTemplates';
import SmsGroups from './pages/admin/SmsGroups';
import SmsConfig from './pages/admin/SmsConfig';
import SmsLog from './pages/admin/SmsLog';
import CreateTicketPage from './pages/CreateTicketPage';
import TicketDetailPage from './pages/TicketDetailPage';
import TroubleTickets from './pages/TroubleTickets';
import CreateTroubleTicketPage from './pages/CreateTroubleTicketPage';
import TroubleTicketDetailPage from './pages/TroubleTicketDetailPage';
import EhsWorkOrders from './pages/EhsWorkOrders';
import EhsRecordDetail from './pages/EhsRecordDetail';
import EhsReports from './pages/EhsReports';
import SpareRequests from './pages/SpareRequests';
import SpareTransactions from './pages/SpareTransactions';
import SpareInventory from './pages/SpareInventory';
import SpareReports from './pages/SpareReports';
import { canAccess, moduleById } from './config/platform';

const isVirtual = (t) => t === 'ticket-create' || t === 'ticket-detail';

export default function App() {
  const [booting, setBooting] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [logoutNotice, setLogoutNotice] = useState('');
  const [idleWarning, setIdleWarning] = useState(false);

  // "Pages" for Create/Detail (not modals)   a flat virtual route on top of
  // the existing tab router, remembering where to go "Back" to.
  const [createTarget, setCreateTarget] = useState(null);
  const [detailTarget, setDetailTarget] = useState(null);
  const [returnTab, setReturnTab] = useState('dashboard');

  const currentUserRef = useRef(currentUser);
  currentUserRef.current = currentUser;

  const handleLogout = (notice = '') => {
    setToken(null);
    setCurrentUser(null);
    setIdleWarning(false);
    if (notice) setLogoutNotice(notice);
  };

  useEffect(() => {
    if (!getToken()) { setBooting(false); return; }
    api.auth.me().then(setCurrentUser)
      .catch(() => setToken(null))
      .finally(() => setBooting(false));
  }, []);

  // Session control, part 1: any request that comes back 401 while we
  // believed we had a valid session (token expired mid-use, or an
  // Administrator deactivated this account) forces an immediate logout
  // instead of leaving stale "logged in" UI on screen.
  useEffect(() => {
    onUnauthorized(() => {
      if (currentUserRef.current) handleLogout('Your session has ended. Please log in again.');
    });
  }, []);

  // Session control, part 2: proactively log out the moment the token's
  // own expiry is reached (don't wait for the next API call to 401), and
  // part 3: log out after IDLE_TIMEOUT_MS of no keyboard/mouse/touch
  // activity, with a warning shortly before   this is the actual fix for
  // "I logged in yesterday and was still logged in today": a tab left
  // open and untouched no longer stays authenticated indefinitely.
  useEffect(() => {
    if (!currentUser) return;
    const token = getToken();
    const expiresAt = token ? decodeTokenExpiry(token) : null;
    const expiryTimer = expiresAt
      ? setTimeout(() => handleLogout('Your session has expired. Please log in again.'), Math.max(0, expiresAt - Date.now()))
      : null;

    const stopIdleWatcher = startIdleWatcher({
      onWarn: () => setIdleWarning(true),
      onExpire: () => handleLogout('You were logged out after a period of inactivity.'),
      onActivity: () => setIdleWarning(false),
    });

    return () => { if (expiryTimer) clearTimeout(expiryTimer); stopIdleWatcher(); };
  }, [currentUser]);

  const handleLogin = (user) => {
    setLogoutNotice('');
    setCurrentUser(user);
    setCurrentTab('dashboard');
  };

  if (booting) return null;
  if (!currentUser) return <Login onLogin={handleLogin} notice={logoutNotice} />;

  const accessUser = { role: currentUser.role, roleId: currentUser.roleId, id: currentUser.id, regionId: currentUser.regionId, regionName: currentUser.regionName, permissions: currentUser.permissions };
  const navigate = (tab) => { if (tab === 'dashboard' || canAccess(accessUser, tab)) setCurrentTab(tab); };

  const openCreate = (type, extra = {}) => {
    if (!isVirtual(currentTab)) setReturnTab(currentTab);
    setCreateTarget({ type, ...extra });
    setCurrentTab('ticket-create');
  };
  const openDetail = (type, id) => {
    if (!isVirtual(currentTab)) setReturnTab(currentTab);
    setDetailTarget({ type, id });
    setCurrentTab('ticket-detail');
  };
  const closeVirtual = () => setCurrentTab(returnTab);

  const renderTab = () => {
    if (currentTab === 'ticket-create' && createTarget) {
      if (createTarget.type === 'trouble_ticket') {
        return <CreateTroubleTicketPage onCancel={closeVirtual} onCreated={(id) => openDetail('trouble_ticket', id)} />;
      }
      return <CreateTicketPage {...createTarget} onCancel={closeVirtual} onCreated={(id) => openDetail(createTarget.type, id)} />;
    }
    if (currentTab === 'ticket-detail' && detailTarget) {
      if (detailTarget.type === 'ehs_record') return <EhsRecordDetail id={detailTarget.id} user={accessUser} onBack={closeVirtual} />;
      if (detailTarget.type === 'trouble_ticket') {
        return <TroubleTicketDetailPage id={detailTarget.id} user={accessUser} onBack={closeVirtual} onOpenWorkOrder={(woId) => openDetail('work_order', woId)} />;
      }
      return <TicketDetailPage id={detailTarget.id} user={accessUser} onBack={closeVirtual} onChanged={() => {}} onOpenEhs={(ehsId) => openDetail('ehs_record', ehsId)} />;
    }
    if (currentTab !== 'dashboard' && !canAccess(accessUser, currentTab)) return <Overview go={navigate} />;
    const mod = moduleById(currentTab);
    const props = { user: accessUser, go: navigate, openCreate, openDetail };

    if (currentTab === 'dashboard') return <Overview {...props} />;
    if (mod?.page === 'trouble-tickets') return <TroubleTickets {...props} />;
    if (mod?.page === 'work-orders') return <WorkOrders {...props} />;
    if (mod?.page === 'assets') return <Assets {...props} />;
    if (mod?.page === 'site-database') return <SiteDatabase {...props} />;
    if (mod?.page === 'reports') return <Reports {...props} />;
    if (mod?.page === 'tt-reports') return <TroubleTicketReports {...props} />;
    if (mod?.page === 'admin-users') return <AdminUsers />;
    if (mod?.page === 'admin-roles') return <AdminRoles />;
    if (mod?.page === 'admin-wo-checklist') return <AdminChecklistTemplates kind="wo" title="PM Checklist" subtitle="PM Checklist Questions" />;
    if (mod?.page === 'admin-ehs-checklist') return <AdminChecklistTemplates kind="ehs" title="EHS Checklist" subtitle="EHS Checklist Questions" />;
    if (mod?.page === 'admin-sms-groups') return <SmsGroups />;
    if (mod?.page === 'admin-sms-config') return <SmsConfig />;
    if (mod?.page === 'admin-sms-log') return <SmsLog />;
    if (mod?.page === 'ehs-work-orders') return <EhsWorkOrders {...props} />;
    if (mod?.page === 'ehs-reports') return <EhsReports {...props} />;
    if (mod?.page === 'spare-requests') return <SpareRequests {...props} />;
    if (mod?.page === 'spare-transactions') return <SpareTransactions {...props} />;
    if (mod?.page === 'spare-inventory') return <SpareInventory {...props} />;
    if (mod?.page === 'spare-reports') return <SpareReports {...props} />;
    return <Overview {...props} />;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar user={accessUser} currentTab={currentTab} setCurrentTab={navigate} />
      <div className="flex flex-col min-h-screen pl-64">
        <Header currentUser={currentUser} currentTab={currentTab} onLogout={() => handleLogout()} />
        <main className="flex-1 p-4 sm:p-6 max-w-[1500px] w-full mx-auto overflow-x-hidden">
          {renderTab()}
        </main>
      </div>

      {idleWarning && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm rounded-xl border border-amber-200 bg-white shadow-lg p-4">
          <p className="text-sm font-semibold text-slate-800">Still there?</p>
          <p className="text-[13px] text-slate-500 mt-1">
            You'll be logged out in about {Math.round(IDLE_WARNING_MS / 1000)} seconds due to inactivity.
          </p>
          <button
            onClick={() => setIdleWarning(false)}
            className="mt-3 w-full rounded-lg bg-primary text-primary-foreground text-sm font-semibold py-2 hover:opacity-90"
          >
            Stay logged in
          </button>
        </div>
      )}
    </div>
  );
}
