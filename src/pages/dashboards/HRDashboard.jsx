import React from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { Users, UserCheck, UserX, PlaneTakeoff, UserPlus, FileClock, ArrowRight } from 'lucide-react';
import { Kpi, KpiGrid, SectionCard, PageHeader, Badge, Button } from '../../components/ui';

export default function HRDashboard({ store }) {
  const { employees, leave, go } = store;
  const present = employees.filter((e) => e.present).length;
  const absent = employees.filter((e) => !e.present && e.status === 'Active').length;
  const onLeave = employees.filter((e) => e.status === 'On Leave').length;
  const pendingLeave = leave.filter((l) => l.status === 'Pending').length;

  const byDept = Object.entries(
    employees.reduce((acc, e) => { acc[e.dept] = (acc[e.dept] || 0) + 1; return acc; }, {})
  ).map(([dept, count]) => ({ dept, count })).sort((a, b) => b.count - a.count).slice(0, 6);

  return (
    <div className="space-y-5">
      <PageHeader title="HR Dashboard" subtitle="Workforce — headcount, attendance & leave"
        actions={<Button icon={ArrowRight} onClick={() => go('hr')}>Employee Records</Button>} />

      <KpiGrid cols={6}>
        <Kpi title="Total Employees" value={employees.length} icon={Users} tone="blue" onClick={() => go('hr')} />
        <Kpi title="Present" value={present} icon={UserCheck} tone="green" />
        <Kpi title="Absent" value={absent} icon={UserX} tone="red" />
        <Kpi title="On Leave" value={onLeave} icon={PlaneTakeoff} tone="amber" />
        <Kpi title="New (30d)" value={2} icon={UserPlus} tone="blue" />
        <Kpi title="Pending Leave" value={pendingLeave} icon={FileClock} tone="amber" onClick={() => go('leave')} />
      </KpiGrid>

      <div className="grid lg:grid-cols-2 gap-4">
        <SectionCard title="Department Headcount">
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={byDept} layout="vertical" margin={{ left: 30, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
              <YAxis type="category" dataKey="dept" tick={{ fontSize: 11 }} stroke="#94a3b8" width={80} />
              <Tooltip />
              <Bar dataKey="count" fill="#2563eb" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Pending Leave Requests" action={<button onClick={() => go('leave')} className="text-[11px] font-semibold text-blue-600">Manage</button>}>
          <div className="space-y-2.5">
            {leave.filter((l) => l.status === 'Pending').map((l) => (
              <div key={l.id} className="flex items-center justify-between border-b border-slate-50 pb-2 last:border-0">
                <div>
                  <div className="text-[13px] font-semibold text-slate-800">{l.staff}</div>
                  <div className="text-[11px] text-slate-500">{l.type} · {l.from} → {l.to} · {l.days}d</div>
                </div>
                <Badge value={l.status} />
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
