import React, { useState } from 'react';
import { PageHeader, SectionCard, FilterBar, Select, DateInput, Button } from '../components/ui';
import { api } from '../api/client';

const TX_TYPES = ['Issue', 'Return', 'Direct Issue', 'Direct Return', 'Adjustment', 'Restock', 'Sent for Service'];

export default function SpareReports() {
  const [type, setType] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [busy, setBusy] = useState(false);

  const exportExcel = async () => {
    setBusy(true);
    try { await api.reports.sparesExcel({ ...(type ? { type } : {}), ...(from ? { from } : {}), ...(to ? { to } : {}) }); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Spare Reports" subtitle="Current inventory  status" />
      <SectionCard title="Raw Data Export (Excel)">
        <FilterBar>
          <Select className="w-48" value={type} onChange={setType} options={TX_TYPES} label="All transaction types" />
          <DateInput value={from} onChange={setFrom} />
          <span className="text-slate-400 text-xs">to</span>
          <DateInput value={to} onChange={setTo} />
        </FilterBar>
        <Button onClick={exportExcel} disabled={busy}>Export to Excel</Button>
      </SectionCard>
    </div>
  );
}
