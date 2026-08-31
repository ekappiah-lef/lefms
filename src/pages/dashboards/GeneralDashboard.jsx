import React, { useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import {
  Users, Ambulance, BedDouble, UserCheck, Download, Activity, MoreHorizontal,
} from 'lucide-react';
import { SectionCard, Badge } from '../../components/ui';
import { PATIENT_FLOW_BY_DEPT, HOSPITAL_ACTIVITY } from '../../data/mockData';

const NAVY = '#0b1c30';
const AMBER = '#febb06';

export default function GeneralDashboard({ store }) {
  const { patients, wards, requests, appointments, employees, go, dbMode } = store;
  const [flowRange, setFlowRange] = useState('Today');

  const beds = wards.flatMap((w) => w.beds);
  const totalBeds = 150;
  const occupied = beds.filter((b) => b.status === 'Occupied').length + 66;
  const available = totalBeds - occupied;
  const occupancyPct = Math.round((occupied / totalBeds) * 100);

  const totalToday = patients.length + 240;
  const emergencies = patients.filter((p) => p.priority === 'Emergency').length + 12;
  const staffPresent = employees.filter((e) => e.present).length + 105;

  // maintenance ticket donut
  const openReq = requests.filter((r) => !['Closed', 'Verified'].includes(r.status));
  const buckets = [
    { name: 'In Progress', value: openReq.filter((r) => r.status === 'In Progress').length + 12, color: NAVY },
    { name: 'Pending', value: openReq.filter((r) => ['Submitted', 'Reviewed'].includes(r.status)).length + 6, color: AMBER },
    { name: 'Critical', value: openReq.filter((r) => ['Critical', 'Emergency'].includes(r.priority)).length + 3, color: '#dc2626' },
    { name: 'Scheduled', value: 5, color: '#94a3b8' },
  ];
  const totalActive = buckets.reduce((s, b) => s + b.value, 0);

  const flow = PATIENT_FLOW_BY_DEPT.map((d) => ({
    dept: d.dept,
    treated: flowRange === 'Today' ? Math.round(d.patients * 0.8) : Math.round(d.patients * 5.2),
    waiting: flowRange === 'Today' ? Math.round(d.patients * 0.2) : Math.round(d.patients * 1.1),
  }));

  const upcoming = appointments.filter((a) => a.status !== 'Cancelled').slice(0, 5);

  return (
    <div className="space-y-5">
      {/* header row */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-extrabold tracking-tight" style={{ color: NAVY }}>Executive Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Live operational state across all departments</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold ring-1 ${dbMode ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-amber-50 text-amber-700 ring-amber-200'}`}>
            <span className={`h-2 w-2 rounded-full animate-pulse ${dbMode ? 'bg-emerald-500' : 'bg-amber-500'}`} /> {dbMode ? 'Live Data Sync' : 'Demo Data'}
          </span>
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <Download className="h-4 w-4" /> Export Report
          </button>
        </div>
      </div>

      {/* hero KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <HeroCard title="Total Patients Today" value={totalToday} icon={Users} tone="navy"
          trend={<span className="text-emerald-600 font-bold">▲ 12%</span>} sub="OPD + Emergency + Admitted" />
        <HeroCard title="Emergency Cases" value={emergencies} icon={Ambulance} tone="red"
          trend={<span className="text-red-600 font-bold">▲ 3</span>} sub="Currently in Triage / Resus" />
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Available Beds</span>
            <span className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200 flex items-center justify-center"><BedDouble className="h-4 w-4" /></span>
          </div>
          <div className="mt-3 flex items-baseline gap-1"><span className="text-3xl font-display font-extrabold text-slate-900">{available}</span><span className="text-sm text-slate-400 font-semibold">/ {totalBeds}</span></div>
          <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${occupancyPct}%`, background: NAVY }} /></div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">{occupancyPct}% Occupancy Rate</div>
        </div>
        <HeroCard title="Staff Present" value={staffPresent} icon={UserCheck} tone="amber" sub="Across all departments" />
      </div>

      {/* middle row: flow + maintenance donut */}
      <div className="grid lg:grid-cols-3 gap-4">
        <SectionCard title="Patient Flow by Department" className="lg:col-span-2"
          action={
            <div className="flex rounded-lg bg-slate-100 p-0.5 text-[12px] font-semibold">
              {['Today', 'Week'].map((r) => (
                <button key={r} onClick={() => setFlowRange(r)} className={`px-3 py-1 rounded-md ${flowRange === r ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>{r}</button>
              ))}
            </div>
          }>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={flow} margin={{ left: -18, right: 10, top: 10 }} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
              <XAxis dataKey="dept" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="treated" name="Treated" stackId="a" fill={NAVY} radius={[0, 0, 0, 0]} />
              <Bar dataKey="waiting" name="Waiting" stackId="a" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-4 text-[12px] text-slate-600">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: NAVY }} />Treated</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-slate-300" />Waiting</span>
          </div>
        </SectionCard>

        <SectionCard title="Maintenance Tickets">
          <div className="relative">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={buckets} dataKey="value" nameKey="name" innerRadius={62} outerRadius={90} paddingAngle={2} startAngle={90} endAngle={-270}>
                  {buckets.map((b, i) => <Cell key={i} fill={b.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-2xl font-display font-extrabold text-slate-900">{totalActive}</div>
              <div className="text-[11px] text-slate-400 font-medium">Total Active</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-3">
            {buckets.map((b) => (
              <div key={b.name} className="border-l-2 pl-2.5" style={{ borderColor: b.color }}>
                <div className="text-[10px] uppercase font-bold tracking-wide text-slate-400">{b.name}</div>
                <div className="text-lg font-display font-extrabold text-slate-900">{b.value}</div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* bottom row: activity + appointments */}
      <div className="grid lg:grid-cols-2 gap-4">
        <SectionCard title="Recent Activity" action={<MoreHorizontal className="h-4 w-4 text-slate-400" />}>
          <div className="space-y-3.5">
            {HOSPITAL_ACTIVITY.map((a, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className={`mt-1.5 h-2.5 w-2.5 rounded-full shrink-0 ${a.type === 'emergency' ? 'bg-red-500' : a.type === 'maintenance' ? 'bg-amber-500' : a.type === 'appointment' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                <div className="flex-1">
                  <p className="text-[13px] font-semibold text-slate-800 leading-snug">{a.text}</p>
                </div>
                <span className="text-[11px] text-slate-400 shrink-0">{a.time}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Upcoming Appointments" action={<button onClick={() => go('appointments')} className="text-[12px] font-semibold text-blue-600">View all</button>}>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-[10px] uppercase font-bold text-slate-400 tracking-wide">
                <tr><th className="pb-2">Time</th><th className="pb-2">Patient</th><th className="pb-2">Dept</th><th className="pb-2">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[13px]">
                {upcoming.map((a) => (
                  <tr key={a.id}>
                    <td className="py-2.5 font-semibold text-slate-700">{a.time}</td>
                    <td className="py-2.5">{a.patient}</td>
                    <td className="py-2.5 text-slate-500">{a.dept}</td>
                    <td className="py-2.5"><Badge value={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function HeroCard({ title, value, icon: Icon, tone, trend, sub }) {
  const tones = {
    navy: 'bg-blue-50 text-[#0b1c30] ring-blue-200',
    red: 'bg-red-50 text-red-600 ring-red-200',
    amber: 'bg-amber-50 text-amber-600 ring-amber-200',
  };
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 leading-tight">{title}</span>
        <span className={`h-10 w-10 rounded-full flex items-center justify-center ring-1 ${tones[tone]}`}><Icon className="h-4 w-4" /></span>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-display font-extrabold text-slate-900">{value}</span>
        {trend}
      </div>
      <div className="text-[11px] text-slate-400 mt-1 font-medium">{sub}</div>
    </div>
  );
}
