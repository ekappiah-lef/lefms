import React, { useEffect, useState, useCallback } from 'react';
import { Wrench, CheckCircle2, Clock, AlertTriangle, Plus } from 'lucide-react';
import { PageHeader, KpiGrid, Kpi, FilterBar, Select, DateInput, Table, Td, Tr, Badge, Button, Pagination, pageSlice } from '../components/ui';
import { api } from '../api/client';
import { STATUS_LABELS, STATUS_TONE, canCreateIn } from '../lib/workflow';

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical', 'Emergency'];
const WO_TYPE_LABEL = { CM: 'Corrective Maintenance', PM: 'Preventive Maintenance', PLM: 'Planned Maintenance' };
const WO_TYPE_TONE = { CM: 'red', PM: 'blue', PLM: 'purple' };

export default function WorkOrders({ user, openCreate, openDetail }) {
  const [rows, setRows] = useState([]);
  const [woType, setWoType] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [region, setRegion] = useState('');
  const [engineer, setEngineer] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [search, setSearch] = useState('');
  const [regions, setRegions] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    api.workOrders.list({
      ...(woType ? { type: woType } : {}), ...(status ? { status } : {}), ...(priority ? { priority } : {}),
      ...(region ? { region } : {}), ...(engineer ? { engineer } : {}),
      ...(from ? { from } : {}), ...(to ? { to } : {}),
    }).then(setRows).finally(() => setLoading(false));
  }, [woType, status, priority, region, engineer, from, to]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { api.regions().then(setRegions); api.users.engineers().then(setEngineers); }, []);
  useEffect(() => { setPage(1); }, [woType, status, priority, region, engineer, from, to, search]);

  const filtered = rows.filter((w) => !search
    || w.title.toLowerCase().includes(search.toLowerCase())
    || w.woNo.toLowerCase().includes(search.toLowerCase())
    || w.siteName.toLowerCase().includes(search.toLowerCase())
    || w.siteCode.toLowerCase().includes(search.toLowerCase()));
  const pageRows = pageSlice(filtered, page);

  return (
    <div className="space-y-5">
      <PageHeader title="Work Orders" subtitle="Corrective, Preventive and Planned Maintenance across every site" />

      <KpiGrid cols={6}>
        <Kpi title="Total" value={rows.length} icon={Wrench} />
        <Kpi title="CM" value={rows.filter((w) => w.woType === 'CM').length} icon={AlertTriangle} tone="rose" />
        <Kpi title="PM" value={rows.filter((w) => w.woType === 'PM').length} icon={Clock} />
        <Kpi title="PLM" value={rows.filter((w) => w.woType === 'PLM').length} icon={Wrench} />
        <Kpi title="In Progress" value={rows.filter((w) => w.status === 'PR').length} icon={Clock} />
        <Kpi title="Completed" value={rows.filter((w) => ['CO', 'CL'].includes(w.status)).length} icon={CheckCircle2} />
      </KpiGrid>

      {canCreateIn(user) && (
        <div className="flex flex-wrap gap-2">
          <Button icon={Plus} variant="danger" onClick={() => openCreate('work_order', { woType: 'CM' })}>New Corrective Maintenance</Button>
          <Button icon={Plus} variant="primary" onClick={() => openCreate('work_order', { woType: 'PM' })}>New Preventive Maintenance</Button>
          <Button icon={Plus} variant="ghost" onClick={() => openCreate('work_order', { woType: 'PLM' })}>New Planned Maintenance</Button>
        </div>
      )}

      <FilterBar search={search} onSearch={setSearch} placeholder="Search WO, site, site ID…">
        <Select className="w-44" value={woType} onChange={setWoType} options={Object.entries(WO_TYPE_LABEL).map(([value, label]) => ({ value, label }))} label="All types" />
        <Select className="w-40" value={status} onChange={setStatus} options={Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }))} label="All statuses" />
        <Select className="w-40" value={priority} onChange={setPriority} options={PRIORITIES} label="All priorities" />
        <Select className="w-40" value={region} onChange={setRegion} options={regions.map((r) => ({ value: String(r.id), label: r.name }))} label="All regions" />
        <Select className="w-44" value={engineer} onChange={setEngineer} options={engineers.map((e) => ({ value: String(e.id), label: e.fullName }))} label="All engineers" />
        <DateInput value={from} onChange={setFrom} />
        <span className="text-slate-400 text-xs">to</span>
        <DateInput value={to} onChange={setTo} />
      </FilterBar>

      <Table headers={['WO No', 'Type', 'Title', 'Site', 'Region', 'Priority', 'Engineer', 'Status', 'Created']} empty={loading ? 'Loading…' : 'No work orders found'}>
        {pageRows.map((w) => (
          <Tr key={w.id} onClick={() => openDetail('work_order', w.id)}>
            <Td className="font-semibold text-slate-800">{w.woNo}</Td>
            <Td><Badge tone={WO_TYPE_TONE[w.woType]}>{w.woType}</Badge></Td>
            <Td className="font-medium max-w-[200px] truncate">{w.title}</Td>
            <Td>{w.siteCode}   {w.siteName}</Td>
            <Td>{w.regionName}</Td>
            <Td><Badge value={w.priority} /></Td>
            <Td>{w.engineerName}</Td>
            <Td><Badge tone={STATUS_TONE[w.status]}>{STATUS_LABELS[w.status]}</Badge></Td>
            <Td>{new Date(w.createdAt).toLocaleDateString('en-GB')}</Td>
          </Tr>
        ))}
      </Table>
      <Pagination page={page} setPage={setPage} total={filtered.length} />
    </div>
  );
}
