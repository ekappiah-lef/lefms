import React from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { Wrench, ClipboardList, AlertTriangle, CalendarCheck, HardHat, CheckCircle2, ArrowRight } from 'lucide-react';
import { Kpi, KpiGrid, SectionCard, PageHeader, Badge, Button } from '../../components/ui';

export default function MaintenanceDashboard({ store }) {
  const { requests, workOrders, preventiveTasks, employees, go } = store;
  const openWO = workOrders.filter((w) => !['Closed', 'Verified'].includes(w.status)).length;
  const pending = requests.filter((r) => ['Submitted', 'Reviewed'].includes(r.status)).length;
  const critical = requests.filter((r) => ['Critical', 'Emergency'].includes(r.priority) && r.status !== 'Closed').length;
  const pmDue = preventiveTasks.filter((p) => ['Due Today', 'Overdue'].includes(p.status)).length;
  const engineers = employees.filter((e) => ['Engineer', 'Biomedical Engineer'].includes(e.role));
  const available = engineers.filter((e) => e.present).length;
  const onAssignment = new Set(workOrders.filter((w) => w.status === 'In Progress').map((w) => w.engineer)).size;
  const completed = workOrders.filter((w) => ['Completed', 'Verified'].includes(w.status)).length;

  const byCategory = ['Electrical', 'Biomedical', 'HVAC', 'Mechanical', 'Furniture'].map((c) => ({
    cat: c, count: requests.filter((r) => r.category === c).length,
  }));

  return (
    <div className="space-y-5">
      <PageHeader title="Maintenance Dashboard" subtitle="Facility & biomedical operations"
        actions={<Button icon={ArrowRight} onClick={() => go('work-orders')}>Work Orders</Button>} />

      <KpiGrid cols={4}>
        <Kpi title="Open Work Orders" value={openWO} icon={Wrench} tone="blue" onClick={() => go('work-orders')} />
        <Kpi title="Pending Requests" value={pending} icon={ClipboardList} tone="amber" onClick={() => go('requests')} />
        <Kpi title="Critical Tickets" value={critical} icon={AlertTriangle} tone="red" />
        <Kpi title="PM Due / Overdue" value={pmDue} icon={CalendarCheck} tone="amber" onClick={() => go('preventive')} />
        <Kpi title="Engineers Available" value={available} icon={HardHat} tone="green" />
        <Kpi title="On Assignment" value={onAssignment} icon={HardHat} tone="blue" />
        <Kpi title="Completed Work" value={completed} icon={CheckCircle2} tone="green" />
        <Kpi title="Equip. Downtime (h)" value={14} icon={AlertTriangle} tone="amber" />
      </KpiGrid>

      <div className="grid lg:grid-cols-2 gap-4">
        <SectionCard title="Requests by Category">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byCategory} margin={{ left: -20, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
              <XAxis dataKey="cat" tick={{ fontSize: 10 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Recent Requests" action={<button onClick={() => go('requests')} className="text-[11px] font-semibold text-blue-600">View all</button>}>
          <div className="space-y-2.5">
            {requests.slice(0, 6).map((r) => (
              <div key={r.id} className="flex items-center justify-between border-b border-slate-50 pb-2 last:border-0">
                <div>
                  <div className="text-[13px] font-semibold text-slate-800">{r.equipment}</div>
                  <div className="text-[11px] text-slate-500">{r.id} · {r.location} · {r.reporter}</div>
                </div>
                <div className="flex items-center gap-2"><Badge value={r.priority} /><Badge value={r.status} /></div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
