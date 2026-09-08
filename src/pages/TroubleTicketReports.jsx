import React, { useEffect, useState } from 'react';
import { PageHeader, SectionCard, FilterBar, Select, DateInput, Button } from '../components/ui';
import { api } from '../api/client';
import { TT_STATUS_LABELS } from '../lib/workflow';

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical', 'Emergency'];

export default function TroubleTicketReports() {
  const [status, setStatus] = useState('');
  const [region, setRegion] = useState('');
  const [priority, setPriority] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [regions, setRegions] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => { api.regions().then(setRegions); }, []);

  const exportExcel = async () => {
    setBusy(true);
    try {
      await api.reports.ttExcel({
        ...(status ? { status } : {}), ...(region ? { region } : {}), ...(priority ? { priority } : {}),
        ...(from ? { from } : {}), ...(to ? { to } : {}),
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Trouble Ticket Reports" subtitle="Export trouble tickets for the selected filters" />
      <SectionCard title="Raw Data Export (Excel)">
        <p className="text-sm text-slate-500 mb-3">Export all Trouble Tickets into Excel, including the Work Order each was converted to (if any).</p>
        <FilterBar>
          <Select className="w-40" value={status} onChange={setStatus} options={Object.entries(TT_STATUS_LABELS).map(([value, label]) => ({ value, label }))} label="All statuses" />
          <Select className="w-44" value={region} onChange={setRegion} options={regions.map((r) => ({ value: String(r.id), label: r.name }))} label="All regions" />
          <Select className="w-40" value={priority} onChange={setPriority} options={PRIORITIES} label="All priorities" />
          <DateInput value={from} onChange={setFrom} />
          <span className="text-slate-400 text-xs">to</span>
          <DateInput value={to} onChange={setTo} />
        </FilterBar>
        <Button onClick={exportExcel} disabled={busy}>Export to Excel</Button>
      </SectionCard>
    </div>
  );
}
