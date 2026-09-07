import React, { useEffect, useState } from 'react';
import { PageHeader, SectionCard, FilterBar, Select, DateInput, Button } from '../components/ui';
import { api } from '../api/client';

const EHS_LABEL = { PENDING: 'Pending', SUBMITTED: 'Submitted', REVIEWED: 'Reviewed' };

export default function EhsReports() {
  const [status, setStatus] = useState('');
  const [region, setRegion] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [regions, setRegions] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => { api.regions().then(setRegions); }, []);

  const exportExcel = async () => {
    setBusy(true);
    try {
      await api.reports.ehsExcel({ ...(status ? { status } : {}), ...(region ? { region } : {}), ...(from ? { from } : {}), ...(to ? { to } : {}) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="EHS Reports" subtitle="Export EHS records for the selected filters" />
      <SectionCard title="Raw Data Export (Excel)">
        <p className="text-sm text-slate-500 mb-3">Export all EHS Records into Excel.</p>
        <FilterBar>
          <Select className="w-40" value={status} onChange={setStatus} options={Object.entries(EHS_LABEL).map(([value, label]) => ({ value, label }))} label="All statuses" />
          <Select className="w-44" value={region} onChange={setRegion} options={regions.map((r) => ({ value: String(r.id), label: r.name }))} label="All regions" />
          <DateInput value={from} onChange={setFrom} />
          <span className="text-slate-400 text-xs">to</span>
          <DateInput value={to} onChange={setTo} />
        </FilterBar>
        <Button onClick={exportExcel} disabled={busy}>Export to Excel</Button>
      </SectionCard>
    </div>
  );
}
