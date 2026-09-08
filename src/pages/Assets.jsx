import React, { useEffect, useState, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader, FilterBar, Select, Table, Td, Tr, Badge, Modal, Button, Field, Pagination, pageSlice } from '../components/ui';
import { api } from '../api/client';

const STATUSES = ['Operational', 'Under Maintenance', 'Out of Service', 'Retired'];
const STATUS_TONE = { Operational: 'green', 'Under Maintenance': 'amber', 'Out of Service': 'red', Retired: 'slate' };
const CATEGORIES = ['Generator', 'AC'];

export default function Assets({ user }) {
  const [rows, setRows] = useState([]);
  const [sites, setSites] = useState([]);
  const [site, setSite] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const canManage = user.role === 'Administrator' || user.role === 'Supervisor';

  const refresh = useCallback(() => {
    setLoading(true);
    api.assets.list({ ...(site ? { site } : {}), ...(status ? { status } : {}) }).then(setRows).finally(() => setLoading(false));
  }, [site, status]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { api.sites.list().then(setSites); }, []);
  useEffect(() => { setPage(1); }, [site, status, search]);

  const filtered = rows.filter((a) => !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.tag.toLowerCase().includes(search.toLowerCase()));
  const pageRows = pageSlice(filtered, page);

  return (
    <div className="space-y-5">
      <PageHeader title="Assets" subtitle="Equipment register across every site"
        actions={canManage && <Button icon={Plus} onClick={() => setShowNew(true)}>New Asset</Button>} />

      <FilterBar search={search} onSearch={setSearch} placeholder="Search asset…">
        <Select className="w-52" value={site} onChange={setSite} options={sites.map((s) => ({ value: String(s.id), label: `${s.siteCode}   ${s.name}` }))} label="All sites" />
        <Select className="w-44" value={status} onChange={setStatus} options={STATUSES} label="All statuses" />
      </FilterBar>

      <Table headers={['Tag', 'Name', 'Category', 'Site', 'Manufacturer', 'Calibration Due', 'Status']} empty={loading ? 'Loading…' : 'No assets found'}>
        {pageRows.map((a) => (
          <Tr key={a.id} onClick={() => setSelected(a)}>
            <Td className="font-semibold text-slate-800">{a.tag}</Td>
            <Td className="font-medium">{a.name}</Td>
            <Td>{a.category}</Td>
            <Td>{a.siteCode}   {a.siteName}</Td>
            <Td>{a.manufacturer || ' '}</Td>
            <Td>{a.calibrationDueDate ? (a.calibrationDueDate.slice ? a.calibrationDueDate.slice(0, 10) : a.calibrationDueDate) : ' '}</Td>
            <Td><Badge tone={STATUS_TONE[a.status]}>{a.status}</Badge></Td>
          </Tr>
        ))}
      </Table>
      <Pagination page={page} setPage={setPage} total={filtered.length} />

      {selected && (
        <Modal open onClose={() => setSelected(null)} title={selected.name} subtitle={`${selected.tag} · ${selected.category}`}
          footer={<Button variant="ghost" onClick={() => setSelected(null)}>Close</Button>}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Site" value={`${selected.siteCode}   ${selected.siteName}`} />
            <Field label="Manufacturer" value={selected.manufacturer} />
            <Field label="Model" value={selected.model} />
            <Field label="Serial No." value={selected.serialNo} />
            <Field label="Calibration Due" value={selected.calibrationDueDate ? (selected.calibrationDueDate.slice ? selected.calibrationDueDate.slice(0, 10) : selected.calibrationDueDate) : ' '} />
            <Field label="Warranty Expiry" value={selected.warrantyExpiry ? (selected.warrantyExpiry.slice ? selected.warrantyExpiry.slice(0, 10) : selected.warrantyExpiry) : ' '} />
          </div>
          {canManage && (
            <div className="mt-5 pt-5 border-t border-slate-100">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Update Status</label>
              <div className="mt-2 flex items-center gap-3">
                <Badge tone={STATUS_TONE[selected.status]}>{selected.status}</Badge>
                <span className="text-slate-300">→</span>
                <div className="flex-1 max-w-[220px]">
                  <Select value={selected.status} onChange={(v) => api.assets.update(selected.id, { status: v }).then(() => { refresh(); setSelected((s) => ({ ...s, status: v })); })} options={STATUSES} />
                </div>
              </div>
            </div>
          )}
        </Modal>
      )}

      {showNew && <NewAsset sites={sites} onClose={() => setShowNew(false)} onCreated={() => { setShowNew(false); refresh(); }} />}
    </div>
  );
}

function NewAsset({ sites, onClose, onCreated }) {
  const [f, setF] = useState({ tag: '', name: '', category: CATEGORIES[0], siteId: '', manufacturer: '', model: '', serialNo: '', calibrationDueDate: '', warrantyExpiry: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const canSave = f.tag && f.name && f.category && f.siteId;

  const save = async () => {
    setBusy(true); setError('');
    try {
      await api.assets.create({ ...f, siteId: Number(f.siteId) });
      onCreated();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="New Asset" subtitle="Register a new asset"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={!canSave || busy}>{busy ? 'Creating…' : 'Create Asset'}</Button></>}>
      {error && <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-[11px] font-semibold text-slate-600">Asset Tag</label><input value={f.tag} onChange={(e) => set('tag')(e.target.value)} className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary" /></div>
        <div><label className="text-[11px] font-semibold text-slate-600">Name</label><input value={f.name} onChange={(e) => set('name')(e.target.value)} className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary" /></div>
        <div><label className="text-[11px] font-semibold text-slate-600">Category</label><div className="mt-1"><Select value={f.category} onChange={set('category')} options={CATEGORIES} /></div></div>
        <div><label className="text-[11px] font-semibold text-slate-600">Site</label><div className="mt-1"><Select value={f.siteId} onChange={set('siteId')} options={sites.map((s) => ({ value: String(s.id), label: `${s.siteCode}   ${s.name}` }))} label="Select site" /></div></div>
        <div><label className="text-[11px] font-semibold text-slate-600">Manufacturer</label><input value={f.manufacturer} onChange={(e) => set('manufacturer')(e.target.value)} className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary" /></div>
        <div><label className="text-[11px] font-semibold text-slate-600">Model</label><input value={f.model} onChange={(e) => set('model')(e.target.value)} className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary" /></div>
        <div><label className="text-[11px] font-semibold text-slate-600">Serial No.</label><input value={f.serialNo} onChange={(e) => set('serialNo')(e.target.value)} className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary" /></div>
        <div><label className="text-[11px] font-semibold text-slate-600">Calibration Due</label><input type="date" value={f.calibrationDueDate} onChange={(e) => set('calibrationDueDate')(e.target.value)} className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary" /></div>
        <div><label className="text-[11px] font-semibold text-slate-600">Warranty Expiry</label><input type="date" value={f.warrantyExpiry} onChange={(e) => set('warrantyExpiry')(e.target.value)} className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary" /></div>
      </div>
    </Modal>
  );
}
