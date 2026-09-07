import React, { useEffect, useState, useCallback } from 'react';
import { PageHeader, SectionCard, FilterBar, Select, Table, Td, Tr, Badge, Button, Pagination, pageSlice } from '../components/ui';
import { api } from '../api/client';
import { STATUS_LABELS, STATUS_TONE } from '../lib/workflow';

const WO_TYPE_LABEL = { CM: 'Corrective Maintenance', PM: 'Preventive Maintenance', PLM: 'Planned Maintenance' };

export default function Reports() {
  const [woType, setWoType] = useState('');
  const [region, setRegion] = useState('');
  const [status, setStatus] = useState('');
  const [regions, setRegions] = useState([]);
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [busy, setBusy] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => { api.regions().then(setRegions); }, []);

  const refresh = useCallback(() => {
    api.workOrders.list({ ...(woType ? { type: woType } : {}), ...(region ? { region } : {}), ...(status ? { status } : {}) })
      .then((r) => { setRows(r); setSelected(new Set()); setPage(1); });
  }, [woType, region, status]);

  useEffect(() => { refresh(); }, [refresh]);

  const toggle = (id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected((s) => (s.size === rows.length ? new Set() : new Set(rows.map((r) => r.id))));

  const exportExcel = async () => {
    setBusy('excel');
    try { await api.reports.excel({ ...(woType ? { type: woType } : {}), ...(region ? { region } : {}), ...(status ? { status } : {}) }); }
    finally { setBusy(''); }
  };
  const exportPdf = async (id) => { setBusy('pdf-' + id); try { await api.reports.pdf(id); } finally { setBusy(''); } };
  const exportBulk = async () => {
    if (!selected.size) return;
    setBusy('bulk');
    try { await api.reports.bulkZip([...selected]); } finally { setBusy(''); }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Reports" subtitle="Raw data exports" />

      <SectionCard title="Raw Data Export (Excel)">
        <p className="text-sm text-slate-500 mb-3">Exports data into an Excel file with no formatting applied.</p>
        <Button onClick={exportExcel} disabled={busy === 'excel'}>Export to Excel</Button>
      </SectionCard>

      <SectionCard title="Export to PDF"
        action={<Button disabled={!selected.size || busy === 'bulk'} onClick={exportBulk}>Export Selected as ZIP ({selected.size})</Button>}>
        <FilterBar>
          <Select className="w-48" value={woType} onChange={setWoType} options={Object.entries(WO_TYPE_LABEL).map(([value, label]) => ({ value, label }))} label="All types" />
          <Select className="w-44" value={region} onChange={setRegion} options={regions.map((r) => ({ value: String(r.id), label: r.name }))} label="All regions" />
          <Select className="w-44" value={status} onChange={setStatus} options={Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }))} label="All statuses" />
        </FilterBar>

        <Table headers={[<input key="all" type="checkbox" checked={rows.length > 0 && selected.size === rows.length} onChange={toggleAll} className="h-4 w-4 accent-primary" />, 'No.', 'Title', 'Site', 'Status', 'Export']}>
          {pageSlice(rows, page).map((r) => (
            <Tr key={r.id}>
              <Td><input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} className="h-4 w-4 accent-primary" /></Td>
              <Td className="font-semibold text-slate-800">{r.woNo}</Td>
              <Td className="max-w-[240px] truncate">{r.title}</Td>
              <Td>{r.siteName}</Td>
              <Td><Badge tone={STATUS_TONE[r.status]}>{STATUS_LABELS[r.status]}</Badge></Td>
              <Td><Button size="sm" variant="ghost" disabled={busy === 'pdf-' + r.id} onClick={() => exportPdf(r.id)}>PDF</Button></Td>
            </Tr>
          ))}
        </Table>
        <Pagination page={page} setPage={setPage} total={rows.length} />
      </SectionCard>
    </div>
  );
}
