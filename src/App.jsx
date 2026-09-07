import React, { useState, useEffect } from 'react';
import { api, getToken, setToken } from './api/client';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './pages/Login';
import Overview from './pages/Overview';
import WorkOrders from './pages/WorkOrders';
import Assets from './pages/Assets';
import SiteDatabase from './pages/SiteDatabase';
import Reports from './pages/Reports';
import AdminUsers from './pages/admin/Users';
import AdminChecklistTemplates from './pages/admin/ChecklistTemplates';
import SmsGroups from './pages/admin/SmsGroups';
import SmsConfig from './pages/admin/SmsConfig';
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

  // "Pages" for Create/Detail (not modals)   a flat virtual route on top of
  // the existing tab router, remembering where to go "Back" to.
  const [createTarget, setCreateTarget] = useState(null);
  const [detailTarget, setDetailTarget] = useState(null);
  const [returnTab, setReturnTab] = useState('dashboard');

  useEffect(() => {
    if (!getToken()) { setBooting(false); return; }
    api.auth.me().then(setCurrentUser)
      .catch(() => setToken(null))
      .finally(() => setBooting(false));
  }, []);

  const handleLogin = (user) => {
    setCurrentUser(user);
    setCurrentTab('dashboard');
  };

  const handleLogout = () => { setToken(null); setCurrentUser(null); };

  if (booting) return null;
  if (!currentUser) return <Login onLogin={handleLogin} />;

  const accessUser = { role: currentUser.role, id: currentUser.id, regionId: currentUser.regionId, regionName: currentUser.regionName };
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
      return <TicketDetailPage id={detailTarget.id} user={accessUser} onBack={closeVirtual} onChanged={() => {}} />;
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
    if (mod?.page === 'admin-users') return <AdminUsers />;
    if (mod?.page === 'admin-wo-checklist') return <AdminChecklistTemplates kind="wo" title="PM Checklist" subtitle="PM Checklist Questions" />;
    if (mod?.page === 'admin-ehs-checklist') return <AdminChecklistTemplates kind="ehs" title="EHS Checklist" subtitle="EHS Checklist Questions" />;
    if (mod?.page === 'admin-sms-groups') return <SmsGroups />;
    if (mod?.page === 'admin-sms-config') return <SmsConfig />;
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
        <Header currentUser={currentUser} currentTab={currentTab} onLogout={handleLogout} />
        <main className="flex-1 p-4 sm:p-6 max-w-[1500px] w-full mx-auto overflow-x-hidden">
          {renderTab()}
        </main>
      </div>
    </div>
  );
}
