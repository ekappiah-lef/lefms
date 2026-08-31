import React, { useState } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  RadialBarChart, RadialBar, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { Wallet, BedDouble, Smile, LogOut, Printer, FileDown, FileSpreadsheet, CalendarRange, ArrowRight } from 'lucide-react';
import { PageHeader, KpiGrid, Kpi, SectionCard, Select, Button } from '../components/ui';
import { WEEKLY_ADMISSIONS, PATIENT_FLOW_BY_DEPT } from '../data/mockData';

const NAVY = '#0b1c30';
const AMBER = '#febb06';
const DEMO = [{ name: 'NHIS (45%)', value: 45 }, { name: 'Private (30%)', value: 30 }, { name: 'Cash (15%)', value: 15 }, { name: 'Corporate (10%)', value: 10 }];
const DEMO_COLORS = [NAVY, AMBER, '#43506b', '#cbd5e1'];

const META = {
  hospital: { title: 'Hospital Reports', subtitle: 'Facility-wide performance & operational metrics' },
  maintenance: { title: 'Maintenance Reports', subtitle: 'Tickets, work orders, engineer performance & downtime' },
  hr: { title: 'HR Reports', subtitle: 'Attendance, leave, headcount & shift coverage' },
};

const REPORT_TYPES = {
  hospital: ['Executive Summary', 'Daily Patient Attendance', 'OPD Attendance', 'Admissions', 'Discharges', 'Bed Occupancy', 'Ward Performance'],
  maintenance: ['Maintenance Ticket Report', 'Engineer Performance', 'Preventive Maintenance', 'Equipment Downtime'],
  hr: ['Staff Attendance', 'Leave Report', 'Department Headcount', 'Shift Coverage'],
};

export default function Reports({ store, kind = 'hospital' }) {
  const meta = META[kind];
  const [range, setRange] = useState('Last 30 Days');
  const [reportType, setReportType] = useState(REPORT_TYPES[kind][0]);
  const [format, setFormat] = useState('PDF Document (.pdf)');

  const efficiency = [{ name: 'Theatre Utilisation', value: 82, fill: NAVY }, { name: 'Equipment Uptime', value: 95, fill: '#10b981' }];

  return (
    <div className="space-y-5">
      <PageHeader title={meta.title} subtitle={meta.subtitle}
        actions={
          <>
            <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"><CalendarRange className="h-4 w-4" />{range}</div>
            <Button variant="ghost" icon={Printer} onClick={() => window.print()}>Print</Button>
            <Button icon={FileDown}>Export Report</Button>
          </>
        } />

      {/* KPI row (adapts by kind) */}
      {kind === 'hospital' && (
        <KpiGrid cols={4}>
          <Kpi title="Total Revenue" value="GHS 2.4M" icon={Wallet} tone="green" hint="▲ 12% vs last period" />
          <Kpi title="Avg Length of Stay" value="4.2 days" icon={BedDouble} tone="blue" hint="▼ 0.5 days" />
          <Kpi title="Patient Satisfaction" value="94%" icon={Smile} tone="green" hint="▲ 2%" />
          <Kpi title="Discharge Rate" value="88%" icon={LogOut} tone="blue" hint="Stable" />
        </KpiGrid>
      )}
      {kind === 'maintenance' && (
        <KpiGrid cols={4}>
          <Kpi title="Tickets Raised" value={store.requests.length} icon={Wallet} tone="blue" />
          <Kpi title="Resolved" value={store.workOrders.filter((w) => ['Completed', 'Verified', 'Closed'].includes(w.status)).length} icon={Smile} tone="green" />
          <Kpi title="Avg Resolution" value="6.4h" icon={CalendarRange} tone="amber" />
          <Kpi title="Equipment Downtime" value="14h" icon={LogOut} tone="red" />
        </KpiGrid>
      )}
      {kind === 'hr' && (
        <KpiGrid cols={4}>
          <Kpi title="Headcount" value={store.employees.length} icon={Wallet} tone="blue" />
          <Kpi title="Attendance" value={`${Math.round((store.employees.filter((e) => e.present).length / store.employees.length) * 100)}%`} icon={Smile} tone="green" />
          <Kpi title="On Leave" value={store.employees.filter((e) => e.status === 'On Leave').length} icon={LogOut} tone="amber" />
          <Kpi title="Pending Leave" value={store.leave.filter((l) => l.status === 'Pending').length} icon={CalendarRange} tone="amber" />
        </KpiGrid>
      )}

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-4">
        <SectionCard title="Admissions vs Discharges" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={WEEKLY_ADMISSIONS} margin={{ left: -18, right: 10, top: 10 }}>
              <defs>
                <linearGradient id="adm" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={NAVY} stopOpacity={0.25} /><stop offset="95%" stopColor={NAVY} stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip />
              <Area type="monotone" dataKey="admissions" stroke={NAVY} strokeWidth={2.5} fill="url(#adm)" />
              <Area type="monotone" dataKey="discharges" stroke={AMBER} strokeWidth={2.5} fill="none" strokeDasharray="5 4" />
            </AreaChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title={kind === 'hr' ? 'Staff by Department' : 'Patient Demographics'}>
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie data={DEMO} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>
                {DEMO.map((_, i) => <Cell key={i} fill={DEMO_COLORS[i]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1">
            {DEMO.map((d, i) => <span key={d.name} className="flex items-center gap-1.5 text-[11px] text-slate-600"><span className="h-2 w-2 rounded-full" style={{ background: DEMO_COLORS[i] }} />{d.name}</span>)}
          </div>
        </SectionCard>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <SectionCard title="Department Performance" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={PATIENT_FLOW_BY_DEPT} margin={{ left: -18, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
              <XAxis dataKey="dept" tick={{ fontSize: 10 }} stroke="#94a3b8" interval={0} angle={-15} textAnchor="end" height={45} />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="patients" fill={NAVY} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Operational Efficiency">
          <ResponsiveContainer width="100%" height={200}>
            <RadialBarChart innerRadius="55%" outerRadius="100%" data={efficiency} startAngle={90} endAngle={-270}>
              <RadialBar minAngle={15} background dataKey="value" cornerRadius={8} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="flex justify-around">
            {efficiency.map((e) => (
              <div key={e.name} className="text-center"><div className="text-lg font-black" style={{ color: e.fill }}>{e.value}%</div><div className="text-[11px] text-slate-500">{e.name}</div></div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Custom report generation */}
      <SectionCard>
        <div className="grid lg:grid-cols-4 gap-4 items-end">
          <div className="lg:col-span-2">
            <h3 className="text-lg font-display font-extrabold text-slate-900">Custom Report Generation</h3>
            <p className="text-sm text-slate-500 mt-1">Select parameters to generate comprehensive reports for compliance or internal review.</p>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-600">Report Type</label>
            <div className="mt-1"><Select value={reportType} onChange={setReportType} options={REPORT_TYPES[kind]} /></div>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-600">Format</label>
            <div className="mt-1 flex gap-2">
              <Select value={format} onChange={setFormat} options={['PDF Document (.pdf)', 'Excel (.xlsx)', 'CSV (.csv)']} />
              <Button icon={format.includes('Excel') ? FileSpreadsheet : FileDown} onClick={() => window.print()}>Generate</Button>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
