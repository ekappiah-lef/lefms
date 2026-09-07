import React, { useEffect, useState, useCallback } from 'react';
import { ShieldCheck, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { PageHeader, KpiGrid, Kpi, FilterBar, Select, Table, Td, Tr, Badge, Pagination, pageSlice } from '../components/ui';
import { api } from '../api/client';

const EHS_LABEL = { PENDING: 'Pending', SUBMITTED: 'Submitted', REVIEWED: 'Reviewed' };
const EHS_TONE = { PENDING: 'amber', SUBMITTED: 'blue', REVIEWED: 'green' };
const WO_TYPE_TONE = { CM: 'red', PM: 'blue', PLM: 'purple' };

// EHS Work Orders: every work order's linked EHS record, reviewable here
// by EHS User/Administrator. Folds in the "EHS Dashboard" stats spec
// asks for (pending/submitted/reviewed, flagged rate) at the top, rather
// than a separate nav item, since that's where the data is being worked.
export default function EhsWorkOrders({ user, openDetail }) {
  const [rows, setRows] = useState([]);
  const [dash, setDash] = useState(null);
  const [status, setStatus] = useState('');
  const [region, setRegion] = useState('');
  const [woType, setWoType] = useState('');
  const [regions, setRegions] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    api.ehsRecords.list({ ...(status ? { status } : {}), ...(region ? { region } : {}), ...(woType ? { type: woType } : {}) })
      .then(setRows).finally(() => setLoading(false));
  }, [status, region, woType]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { api.regions().then(setRegions); api.dashboard.ehs().then(setDash); }, []);
  useEffect(() => { setPage(1); }, [status, region, woType]);

  const pageRows = pageSlice(rows, page);

  return (
    <div className="space-y-5">
      <PageHeader title="EHS records" subtitle="EHS records linked to work orders" />

      {dash && (
        <KpiGrid cols={4}>
          <Kpi title="Total EHS Records" value={dash.total} icon={ShieldCheck} />
          <Kpi title="Pending" value={dash.statusCounts.PENDING} icon={Clock} tone="amber" />
          <Kpi title="Submitted (awaiting review)" value={dash.statusCounts.SUBMITTED} icon={Clock} tone="blue" />
          <Kpi title="Flagged Rate" value={`${dash.flaggedRate}%`} icon={AlertTriangle} tone={dash.flaggedRate > 0 ? 'rose' : 'green'} />
        </KpiGrid>
      )}

      <FilterBar>
        <Select className="w-40" value={status} onChange={setStatus} options={Object.entries(EHS_LABEL).map(([value, label]) => ({ value, label }))} label="All statuses" />
        <Select className="w-40" value={woType} onChange={setWoType} options={[{ value: 'CM', label: 'Corrective' }, { value: 'PM', label: 'Preventive' }, { value: 'PLM', label: 'Planned' }]} label="All types" />
        <Select className="w-44" value={region} onChange={setRegion} options={regions.map((r) => ({ value: String(r.id), label: r.name }))} label="All regions" />
      </FilterBar>

      <Table headers={['EHS No', 'Work Order', 'Type', 'Site', 'Region', 'Engineer', 'Status', 'Outcome']} empty={loading ? 'Loading…' : 'No EHS records found'}>
        {pageRows.map((e) => (
          <Tr key={e.id} onClick={() => openDetail('ehs_record', e.id)}>
            <Td className="font-semibold text-slate-800">{e.ehsNo}</Td>
            <Td>{e.woNo}   <span className="text-slate-400">{e.woTitle}</span></Td>
            <Td><Badge tone={WO_TYPE_TONE[e.woType]}>{e.woType}</Badge></Td>
            <Td>{e.siteCode}   {e.siteName}</Td>
            <Td>{e.regionName}</Td>
            <Td>{e.engineerName}</Td>
            <Td><Badge tone={EHS_TONE[e.status]}>{EHS_LABEL[e.status]}</Badge></Td>
            <Td>{e.outcome ? <Badge tone={e.outcome === 'Approved' ? 'green' : 'red'}>{e.outcome}</Badge> : ' '}</Td>
          </Tr>
        ))}
      </Table>
      <Pagination page={page} setPage={setPage} total={rows.length} />
    </div>
  );
}
