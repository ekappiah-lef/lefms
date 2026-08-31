import React, { useState } from 'react';
import { Boxes, Wrench, CheckCircle2, AlertTriangle, Ticket, Plus, Eye } from 'lucide-react';
import { PageHeader, KpiGrid, Kpi, FilterBar, Select, Table, Td, Tr, Badge, Modal, Button, Field, IconBtn, RowActions, DeleteBtn } from '../components/ui';
import { ASSET_STATUSES } from '../data/extraData';

const ASSET_CATEGORIES = ['Power', 'Building', 'Fleet', 'Biomedical', 'Pharmacy', 'HVAC', 'IT', 'Furniture'];

export default function Assets({ store }) {
  const { assets, setAssets, setRequests, go } = store;
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [sel, setSel] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const cats = [...new Set(assets.map((a) => a.category))];
  const rows = assets.filter((a) => (!status || a.status === status) && (!category || a.category === category));

  const raiseTicket = (a) => {
    const id = 'MR-2026-0' + Math.floor(15 + Math.random() * 80);
    setRequests((prev) => [{ id, dept: 'Biomedical', location: a.location, room: a.location, bed: '', equipment: a.name, category: a.category === 'Biomedical' ? 'Biomedical' : 'Mechanical', priority: 'High', reporter: 'Asset Register', date: '2026-07-19 12:00', status: 'Submitted', description: `Fault reported on asset ${a.tag}`, assignedTo: '' }, ...prev]);
    setAssets((prev) => prev.map((x) => x.id === a.id ? { ...x, status: 'Under Maintenance', linkedWO: id } : x));
    setSel(null);
    go('requests');
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Assets" subtitle="Asset & equipment register, warranty & linked work orders"
        actions={<Button icon={Plus} onClick={() => setShowNew(true)}>Add Asset</Button>} />

      <KpiGrid cols={4}>
        <Kpi title="Total Assets" value={assets.length} icon={Boxes} tone="slate" />
        <Kpi title="Operational" value={assets.filter((a) => a.status === 'Operational').length} icon={CheckCircle2} tone="green" />
        <Kpi title="Under Maintenance" value={assets.filter((a) => a.status === 'Under Maintenance').length} icon={Wrench} tone="amber" />
        <Kpi title="Out of Service" value={assets.filter((a) => a.status === 'Out of Service').length} icon={AlertTriangle} tone="red" />
      </KpiGrid>

      <FilterBar>
        <Select value={category} onChange={setCategory} options={cats} label="All categories" />
        <Select value={status} onChange={setStatus} options={ASSET_STATUSES} label="All statuses" />
      </FilterBar>

      <Table headers={['Tag', 'Asset', 'Category', 'Location', 'Warranty', 'Linked WO', 'Status', 'Actions']}>
        {rows.map((a) => (
          <Tr key={a.id} onClick={() => setSel(a)}>
            <Td className="font-semibold text-slate-800">{a.tag}</Td>
            <Td className="font-medium">{a.name}</Td>
            <Td>{a.category}</Td>
            <Td>{a.location}</Td>
            <Td>{a.warranty}</Td>
            <Td>{a.linkedWO || '—'}</Td>
            <Td><Badge value={a.status === 'Operational' ? 'Active' : a.status === 'Under Maintenance' ? 'In Progress' : 'Overdue'}>{a.status}</Badge></Td>
            <Td onClick={(e) => e.stopPropagation()}>
              <RowActions>
                <IconBtn icon={Eye} title="View" onClick={() => setSel(a)} />
                <DeleteBtn onDelete={() => setAssets((prev) => prev.filter((x) => x.id !== a.id))} />
              </RowActions>
            </Td>
          </Tr>
        ))}
      </Table>

      <Modal open={!!sel} onClose={() => setSel(null)} title={sel?.name} subtitle={sel ? `${sel.tag} · ${sel.category}` : ''}
        footer={sel && (<><Button variant="ghost" onClick={() => setSel(null)}>Close</Button>{sel.linkedWO ? <Button onClick={() => { setSel(null); go('work-orders'); }}>Open Work Order</Button> : <Button variant="danger" icon={Ticket} onClick={() => raiseTicket(sel)}>Report Fault</Button>}</>)}>
        {sel && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Status" value={<Badge value={sel.status === 'Operational' ? 'Active' : 'In Progress'}>{sel.status}</Badge>} />
            <Field label="Location" value={sel.location} />
            <Field label="Category" value={sel.category} />
            <Field label="Vendor" value={sel.vendor} />
            <Field label="Warranty Expiry" value={sel.warranty} />
            <Field label="Linked Work Order" value={sel.linkedWO || '—'} />
          </div>
        )}
      </Modal>

      <NewAsset open={showNew} onClose={() => setShowNew(false)} onSave={(a) => { setAssets((prev) => [a, ...prev]); setShowNew(false); }} />
    </div>
  );
}

function NewAsset({ open, onClose, onSave }) {
  const [f, setF] = useState({ tag: '', name: '', category: ASSET_CATEGORIES[0], location: '', status: 'Operational', warranty: '', vendor: '' });
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const save = () => onSave({ id: 'AST-' + Math.floor(7 + Math.random() * 900), tag: f.tag || 'TBH-AST-' + Math.floor(10 + Math.random() * 90), name: f.name, category: f.category, location: f.location, status: f.status, warranty: f.warranty, vendor: f.vendor, linkedWO: '' });
  const input = (label, k, full) => (<div className={full ? 'col-span-2' : ''}><label className="text-[11px] font-semibold text-slate-600">{label}</label><input value={f[k]} onChange={(e) => set(k)(e.target.value)} className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0b1c30]" /></div>);
  return (
    <Modal open={open} onClose={onClose} title="Add Asset" width="max-w-2xl"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={!f.name}>Add Asset</Button></>}>
      <div className="grid grid-cols-2 gap-3">
        {input('Asset Name', 'name', true)}
        {input('Asset Tag', 'tag')}
        <div><label className="text-[11px] font-semibold text-slate-600">Category</label><div className="mt-1"><Select value={f.category} onChange={set('category')} options={ASSET_CATEGORIES} /></div></div>
        {input('Location', 'location')}
        <div><label className="text-[11px] font-semibold text-slate-600">Status</label><div className="mt-1"><Select value={f.status} onChange={set('status')} options={ASSET_STATUSES} /></div></div>
        {input('Warranty Expiry', 'warranty')}
        {input('Vendor', 'vendor', true)}
      </div>
    </Modal>
  );
}
