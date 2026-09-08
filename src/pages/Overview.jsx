import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { ListChecks, Wrench, CheckCircle2, Lock, AlertTriangle, Clock, CalendarClock } from 'lucide-react';
import { PageHeader, KpiGrid, Kpi, SectionCard, Table, Tr, Td, Badge } from '../components/ui';
import DonutBreakdown from '../components/DonutBreakdown';
import { api } from '../api/client';
import { STATUS_LABELS, STATUS_TONE } from '../lib/workflow';

const NAVY = '#4f46e5'; const AMBER = '#febb06';
const STATUS_COLORS = { CR: '#2563eb', PR: '#febb06', CO: '#10b981', CL: '#94a3b8', RJ: '#dc2626', CA: '#f97316' };
const ASSET_STATUS_COLORS = { Operational: '#10b981', 'Under Maintenance': '#f59e0b', 'Out of Service': '#ef4444', Retired: '#94a3b8' };
const TYPE_COLORS = { CM: '#dc2626', PM: NAVY, PLM: '#7c3aed' };
const CATEGORY_COLORS = ['#2563eb', '#f59e0b', '#10b981', '#ec4899', '#7c3aed', '#dc2626', '#0891b2', '#84cc16'];

export default function Overview({ user }) {
  const [data, setData] = useState(null);
  const [ttData, setTtData] = useState(null);
  const [error, setError] = useState('');
  const isMsUser = user?.role === 'MS User';

  useEffect(() => {
    api.dashboard.overview().then(setData).catch((e) => setError(e.message));
    api.dashboard.troubleTickets().then(setTtData).catch(() => {});
  }, []);

  if (error) return <p className="text-sm text-red-600">Could not load the dashboard: {error}</p>;
  if (!data) return <p className="text-sm text-slate-400">Loading…</p>;

  const ttBySite = (ttData?.bySite || []).map((s) => ({ name: s.siteName, count: s.count }));
  const ttByCategory = (ttData?.byCategory || []).map((c, i) => ({ name: c.category, value: c.count, color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }));

  const statusDonut = Object.entries(data.combinedStatus).map(([k, v]) => ({ name: STATUS_LABELS[k], value: v, color: STATUS_COLORS[k] }));
  const assetsDonut = data.assetsByStatus.map((a) => ({ name: a.status, value: a.c, color: ASSET_STATUS_COLORS[a.status] || '#94a3b8' }));
  // Same clean per-status categories as the Status Mix donut, just grouped
  // by region (or by data centre/site below)   no lossy "completed
  // (awaiting close)" bucket, Closed is its own segment like every other
  // status. Bars are grouped side-by-side, not stacked.
  const regionBar = data.byRegion.map((r) => ({ name: r.regionName, ...r }));
  const siteBar = (data.bySite || []).map((s) => ({ name: s.siteName, ...s }));
  const trend = data.trend.map((r) => ({ ym: r.ym, c: Number(r.c) }));

  return (
    <div className="space-y-5">
      <PageHeader title="LEF MS Dashboard" subtitle="Operational overview of every Work Order across all sites" />

      <KpiGrid cols={4} size="lg">
        <Kpi title="Total Work Orders" value={data.total} icon={ListChecks} />
        <Kpi title="Corrective (CM)" value={data.byType.CM} icon={AlertTriangle} tone="rose" />
        <Kpi title="Preventive (PM)" value={data.byType.PM} icon={CalendarClock} />
        <Kpi title="Planned (PLM)" value={data.byType.PLM} icon={Wrench} />
      </KpiGrid>
      <KpiGrid cols={4} size="lg">
        <Kpi title="Open" value={data.open} icon={Clock} />
        <Kpi title="In Progress" value={data.combinedStatus.PR} icon={Clock} />
        <Kpi title="Completed" value={data.completed} icon={CheckCircle2} />
        <Kpi title="Closed" value={data.closed} icon={Lock} hint={`${data.closeRate}% close rate`} />
      </KpiGrid>

      <div className="grid lg:grid-cols-3 gap-4">
        <SectionCard title="Work Orders by Region" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={regionBar} margin={{ left: -18, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="CR" name={STATUS_LABELS.CR} fill={STATUS_COLORS.CR} radius={[3, 3, 0, 0]} />
              <Bar dataKey="PR" name={STATUS_LABELS.PR} fill={STATUS_COLORS.PR} radius={[3, 3, 0, 0]} />
              <Bar dataKey="RJ" name={STATUS_LABELS.RJ} fill={STATUS_COLORS.RJ} radius={[3, 3, 0, 0]} />
              <Bar dataKey="CA" name={STATUS_LABELS.CA} fill={STATUS_COLORS.CA} radius={[3, 3, 0, 0]} />
              <Bar dataKey="CO" name={STATUS_LABELS.CO} fill={STATUS_COLORS.CO} radius={[3, 3, 0, 0]} />
              <Bar dataKey="CL" name={STATUS_LABELS.CL} fill={STATUS_COLORS.CL} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        <DonutBreakdown title="All Status" data={statusDonut} totalLabel="Work Orders" />
      </div>

      <div className="grid lg:grid-cols-1 gap-4">
        <SectionCard title="Work Orders by Data Center">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={siteBar} margin={{ left: -18, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="CR" name={STATUS_LABELS.CR} fill={STATUS_COLORS.CR} radius={[3, 3, 0, 0]} />
              <Bar dataKey="PR" name={STATUS_LABELS.PR} fill={STATUS_COLORS.PR} radius={[3, 3, 0, 0]} />
              <Bar dataKey="RJ" name={STATUS_LABELS.RJ} fill={STATUS_COLORS.RJ} radius={[3, 3, 0, 0]} />
              <Bar dataKey="CA" name={STATUS_LABELS.CA} fill={STATUS_COLORS.CA} radius={[3, 3, 0, 0]} />
              <Bar dataKey="CO" name={STATUS_LABELS.CO} fill={STATUS_COLORS.CO} radius={[3, 3, 0, 0]} />
              <Bar dataKey="CL" name={STATUS_LABELS.CL} fill={STATUS_COLORS.CL} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <SectionCard title="Trouble Ticket Issues by Data Centre" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={ttBySite} margin={{ left: -18, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" name="Issues" fill={NAVY} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        <DonutBreakdown title="Issues by System / Fault Type" data={ttByCategory} totalLabel="Trouble Tickets" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <SectionCard title="Work Orders Created   Monthly Trend" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trend} margin={{ left: -18, right: 10, top: 10 }}>
              <defs><linearGradient id="trend" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={NAVY} stopOpacity={0.3} /><stop offset="95%" stopColor={NAVY} stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
              <XAxis dataKey="ym" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
              <Tooltip />
              <Area type="monotone" dataKey="c" name="Work orders created" stroke={NAVY} strokeWidth={2.5} fill="url(#trend)" />
            </AreaChart>
          </ResponsiveContainer>
        </SectionCard>

        <DonutBreakdown title="Assets by Status" data={assetsDonut} totalLabel="Assets" />
      </div>

      <div className={isMsUser ? 'grid grid-cols-1 gap-4' : 'grid lg:grid-cols-2 gap-4'}>
        {!isMsUser && (
          <SectionCard title="Engineer Performance">
            <Table headers={['Engineer', 'Assigned', 'Completed', 'Closed', 'Completion Rate']}>
              {data.engineerPerformance.map((e) => (
                <Tr key={e.id}>
                  <Td className="font-medium whitespace-nowrap">{e.engineer.split(' ')[0]}</Td>
                  <Td>{e.total}</Td>
                  <Td>{e.completed}</Td>
                  <Td>{e.closed}</Td>
                  <Td><Badge tone={e.completionRate >= 70 ? 'green' : e.completionRate >= 40 ? 'amber' : 'red'}>{e.completionRate}%</Badge></Td>
                </Tr>
              ))}
            </Table>
          </SectionCard>
        )}

        <SectionCard title="Longest Pending Open Work Orders">
          <Table headers={['Type', 'WO Number', 'Title', 'Status', 'Age']}>
            {data.agingList.map((t) => (
              <Tr key={t.id}>
                <Td><Badge tone={TYPE_COLORS[t.type] ? undefined : 'slate'}>{t.type}</Badge></Td>
                <Td className="font-semibold text-slate-800 whitespace-nowrap">{t.no}</Td>
                <Td className="max-w-[200px] truncate">{t.title}</Td>
                <Td><Badge tone={STATUS_TONE[t.status]}>{STATUS_LABELS[t.status]}</Badge></Td>
                <Td>{Math.round(t.ageHours / 24)}d {t.ageHours % 24}h</Td>
              </Tr>
            ))}
          </Table>
        </SectionCard>
      </div>
    </div>
  );
}
