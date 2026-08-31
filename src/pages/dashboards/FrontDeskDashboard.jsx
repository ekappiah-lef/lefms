import React from 'react';
import { UserPlus, CalendarClock, Users, Building2, Clock, Truck, Search, LogIn, Ticket } from 'lucide-react';
import { Kpi, KpiGrid, SectionCard, PageHeader, Button, Badge } from '../../components/ui';

export default function FrontDeskDashboard({ store }) {
  const { patients, appointments, visitors, deliveries, requests, go } = store;
  const registeredToday = patients.filter((p) => p.registered?.startsWith('2026-07-19')).length;
  const walkIns = patients.filter((p) => p.visitType === 'Walk-in').length;
  const waiting = patients.filter((p) => ['Waiting', 'Registered', 'In Triage'].includes(p.status)).length;
  const onPremises = visitors.filter((v) => v.status === 'On Premises').length;
  const upcoming = appointments.filter((a) => a.status === 'Scheduled');
  const fdTickets = requests.filter((r) => r.dept === 'Front Desk');

  const quickActions = [
    { label: 'Register New Patient', icon: UserPlus, tab: 'front-desk' },
    { label: 'Search Patient', icon: Search, tab: 'front-desk' },
    { label: 'Book Appointment', icon: CalendarClock, tab: 'appointments' },
    { label: 'Patient Check-In', icon: LogIn, tab: 'patient-queue' },
    { label: 'Register Visitor', icon: Building2, tab: 'front-desk' },
    { label: 'Raise Service Ticket', icon: Ticket, tab: 'requests' },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title="Front Desk Dashboard" subtitle="Reception — registration, check-in, visitors & deliveries" />

      <KpiGrid cols={5}>
        <Kpi title="Registered Today" value={registeredToday} icon={UserPlus} tone="blue" />
        <Kpi title="Walk-In Patients" value={walkIns} icon={Users} tone="blue" />
        <Kpi title="Waiting Patients" value={waiting} icon={Clock} tone="amber" />
        <Kpi title="Upcoming Appts" value={upcoming.length} icon={CalendarClock} tone="blue" />
        <Kpi title="Visitors On-Site" value={onPremises} icon={Building2} tone="green" />
      </KpiGrid>

      <SectionCard title="Quick Actions">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((a) => (
            <button key={a.label} onClick={() => go(a.tab)} className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 hover:border-blue-300 hover:bg-blue-50/50 transition-colors">
              <a.icon className="h-6 w-6 text-blue-600" />
              <span className="text-[12px] font-semibold text-slate-700 text-center leading-tight">{a.label}</span>
            </button>
          ))}
        </div>
      </SectionCard>

      <div className="grid lg:grid-cols-2 gap-4">
        <SectionCard title="Upcoming Appointments" action={<button onClick={() => go('appointments')} className="text-[11px] font-semibold text-blue-600">Open</button>}>
          <div className="space-y-2.5">
            {upcoming.slice(0, 5).map((a) => (
              <div key={a.id} className="flex items-center justify-between border-b border-slate-50 pb-2 last:border-0">
                <div>
                  <div className="text-[13px] font-semibold text-slate-800">{a.patient}</div>
                  <div className="text-[11px] text-slate-500">{a.doctor} · {a.dept}</div>
                </div>
                <div className="text-right"><div className="text-[12px] font-bold text-slate-700">{a.time}</div><Badge value={a.type} tone="blue" /></div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Visitors On Premises">
          <div className="space-y-2.5">
            {visitors.filter((v) => v.status === 'On Premises').map((v) => (
              <div key={v.id} className="flex items-center justify-between border-b border-slate-50 pb-2 last:border-0">
                <div>
                  <div className="text-[13px] font-semibold text-slate-800">{v.name}</div>
                  <div className="text-[11px] text-slate-500">Visiting: {v.visiting}</div>
                </div>
                <div className="text-right"><div className="text-[11px] text-slate-500">In {v.checkIn}</div><Badge value={v.badge} tone="slate" /></div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Deliveries Log">
          <div className="space-y-2.5">
            {deliveries.map((d) => (
              <div key={d.id} className="flex items-center justify-between border-b border-slate-50 pb-2 last:border-0">
                <div>
                  <div className="text-[13px] font-semibold text-slate-800">{d.item}</div>
                  <div className="text-[11px] text-slate-500">From {d.from} → {d.recipient}</div>
                </div>
                <Badge value={d.status} />
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Front Desk Tickets" action={<Button size="sm" variant="subtle" icon={Ticket} onClick={() => go('requests')}>New</Button>}>
          <div className="space-y-2.5">
            {fdTickets.length === 0 && <p className="text-[13px] text-slate-400">No open tickets from reception.</p>}
            {fdTickets.map((t) => (
              <div key={t.id} className="flex items-center justify-between border-b border-slate-50 pb-2 last:border-0">
                <div>
                  <div className="text-[13px] font-semibold text-slate-800">{t.equipment}</div>
                  <div className="text-[11px] text-slate-500">{t.id} · {t.category}</div>
                </div>
                <Badge value={t.status} />
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
