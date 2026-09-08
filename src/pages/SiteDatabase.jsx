import React, { useEffect, useState, useCallback } from 'react';
import { MapPin, Plus, CheckCircle2, XCircle } from 'lucide-react';
import { PageHeader, KpiGrid, Kpi, FilterBar, Select, Table, Td, Tr, Badge, Modal, Button, Field, FilePicker, Pagination, pageSlice } from '../components/ui';
import { api } from '../api/client';
import { hasPerm } from '../config/platform';

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const PRIORITY_TONE = { Low: 'slate', Medium: 'blue', High: 'amber', Critical: 'red' };

// Site Database: the authoritative source Work Orders auto-populate
// from. Admin/MS User only, per spec   this is where Site ID, Region,
// Location, Priority and Assigned Engineer are set up and imported.
export default function SiteDatabase({ user }) {
  const [rows, setRows] = useState([]);
  const [regions, setRegions] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [region, setRegion] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const canManage = hasPerm(user, 'site_database', 'manage');

  const refresh = useCallback(() => {
    setLoading(true);
    api.sites.list({ ...(region ? { region } : {}), ...(search ? { q: search } : {}) }).then(setRows).finally(() => setLoading(false));
  }, [region, search]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { api.regions().then(setRegions); api.users.engineers().then(setEngineers); }, []);
  useEffect(() => { setPage(1); }, [region, search]);

  const pageRows = pageSlice(rows, page);

  return (
    <div className="space-y-5">
      <PageHeader title="Site Database" subtitle="Site List and Site Information"
        actions={canManage && <>
          <Button variant="ghost" onClick={() => setShowImport(true)}>Bulk Import</Button>
          <Button icon={Plus} onClick={() => setShowNew(true)}>New Site</Button>
        </>} />

      <KpiGrid cols={4}>
        <Kpi title="Total Sites" value={rows.length} icon={MapPin} />
        <Kpi title="Active" value={rows.filter((s) => s.isActive).length} icon={CheckCircle2} />
        <Kpi title="Inactive" value={rows.filter((s) => !s.isActive).length} icon={XCircle} tone="rose" />
        <Kpi title="Regions" value={regions.length} icon={MapPin} />
      </KpiGrid>

      <FilterBar search={search} onSearch={setSearch} placeholder="Search site ID or name…">
        <Select className="w-48" value={region} onChange={setRegion} options={regions.map((r) => ({ value: String(r.id), label: r.name }))} label="All regions" />
      </FilterBar>

      <Table headers={['Site ID', 'Name', 'Region', 'Location', 'Priority', 'Assigned Engineer', 'Status']} empty={loading ? 'Loading…' : 'No sites found'}>
        {pageRows.map((s) => (
          <Tr key={s.id} onClick={() => setSelected(s)}>
            <Td className="font-semibold text-slate-800">{s.siteCode}</Td>
            <Td className="font-medium">{s.name}</Td>
            <Td>{s.regionName}</Td>
            <Td className="max-w-[220px] truncate">{s.location || ' '}</Td>
            <Td><Badge tone={PRIORITY_TONE[s.priority]}>{s.priority}</Badge></Td>
            <Td>{s.assignedEngineerName || ' '}</Td>
            <Td><Badge tone={s.isActive ? 'green' : 'slate'}>{s.isActive ? 'Active' : 'Inactive'}</Badge></Td>
          </Tr>
        ))}
      </Table>
      <Pagination page={page} setPage={setPage} total={rows.length} />

      {selected && (
        <Modal open onClose={() => setSelected(null)} title={selected.name} subtitle={selected.siteCode}
          footer={<Button variant="ghost" onClick={() => setSelected(null)}>Close</Button>}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Region" value={selected.regionName} />
            <Field label="Priority" value={<Badge tone={PRIORITY_TONE[selected.priority]}>{selected.priority}</Badge>} />
            <Field label="Location" value={selected.location} full />
            <Field label="Assigned Engineer" value={selected.assignedEngineerName} full />
          </div>
          {canManage && (
            <div className="mt-5 pt-5 border-t border-slate-100">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Reassign Engineer</label>
              <div className="mt-2 max-w-[260px]">
                <Select value={selected.assignedEngineerId ? String(selected.assignedEngineerId) : ''} label="No engineer assigned"
                  onChange={(v) => api.sites.update(selected.id, { assignedEngineerId: v ? Number(v) : null }).then(() => { refresh(); setSelected((s) => ({ ...s, assignedEngineerId: v ? Number(v) : null })); })}
                  options={engineers.map((e) => ({ value: String(e.id), label: e.fullName }))} />
              </div>
            </div>
          )}
        </Modal>
      )}

      {showNew && <NewSite regions={regions} engineers={engineers} onClose={() => setShowNew(false)} onCreated={() => { setShowNew(false); refresh(); }} />}
      {showImport && <ImportSites onClose={() => setShowImport(false)} onDone={() => { setShowImport(false); refresh(); }} />}
    </div>
  );
}

function NewSite({ regions, engineers, onClose, onCreated }) {
  const [f, setF] = useState({ siteCode: '', name: '', regionId: '', location: '', priority: 'Medium', assignedEngineerId: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const canSave = f.siteCode && f.name && f.regionId;

  const save = async () => {
    setBusy(true); setError('');
    try {
      await api.sites.create({ ...f, regionId: Number(f.regionId), assignedEngineerId: f.assignedEngineerId ? Number(f.assignedEngineerId) : null });
      onCreated();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="New Site" subtitle="Add a site to the Site Database"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={!canSave || busy}>{busy ? 'Creating…' : 'Create Site'}</Button></>}>
      {error && <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-[11px] font-semibold text-slate-600">Site ID</label><input value={f.siteCode} onChange={(e) => set('siteCode')(e.target.value)} className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary" /></div>
        <div><label className="text-[11px] font-semibold text-slate-600">Site Name</label><input value={f.name} onChange={(e) => set('name')(e.target.value)} className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary" /></div>
        <div><label className="text-[11px] font-semibold text-slate-600">Region</label><div className="mt-1"><Select value={f.regionId} onChange={set('regionId')} options={regions.map((r) => ({ value: String(r.id), label: r.name }))} label="Select region" /></div></div>
        <div><label className="text-[11px] font-semibold text-slate-600">Priority</label><div className="mt-1"><Select value={f.priority} onChange={set('priority')} options={PRIORITIES} /></div></div>
        <div className="col-span-2"><label className="text-[11px] font-semibold text-slate-600">Location</label><input value={f.location} onChange={(e) => set('location')(e.target.value)} className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary" /></div>
        <div className="col-span-2"><label className="text-[11px] font-semibold text-slate-600">Assigned Engineer</label><div className="mt-1"><Select value={f.assignedEngineerId} onChange={set('assignedEngineerId')} options={engineers.map((e) => ({ value: String(e.id), label: e.fullName }))} label="No engineer assigned" /></div></div>
      </div>
    </Modal>
  );
}

function ImportSites({ onClose, onDone }) {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState(null);

  const run = async () => {
    if (!file) return;
    setBusy(true); setError('');
    try {
      const result = await api.sites.bulkImport(file);
      setReport(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Bulk Import Sites" subtitle="Excel (.xlsx) with columns: Site ID, Site Name, Region, Location, Priority, Assigned Engineer"
      footer={<>
        <Button variant="ghost" onClick={onClose}>{report ? 'Close' : 'Cancel'}</Button>
        {!report && <Button onClick={run} disabled={!file || busy}>{busy ? 'Importing…' : 'Import'}</Button>}
        {report && <Button onClick={onDone}>Done</Button>}
      </>}>
      {error && <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
      {!report && (file ? (
        <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
          <span className="truncate">{file.name}</span>
          <button onClick={() => setFile(null)} className="text-red-600 text-xs font-semibold">Remove</button>
        </div>
      ) : <FilePicker onFile={setFile} accept=".xlsx" hint="Click or drag an .xlsx file here" />)}
      {report && (
        <div className="space-y-3">
          <div className="flex gap-4 text-sm">
            <span className="font-semibold text-emerald-600">{report.inserted} imported</span>
            <span className="font-semibold text-red-600">{report.failed} failed</span>
            <span className="text-slate-400">{report.total} rows read</span>
          </div>
          {report.failed > 0 && (
            <div className="max-h-64 overflow-y-auto space-y-1.5">
              {report.results.filter((r) => r.status === 'failed').map((r) => (
                <div key={r.row} className="text-[12px] rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-red-700">
                  Row {r.row} ({r.siteCode || 'no ID'}): {r.errors.join('; ')}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
