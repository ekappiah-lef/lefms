import React, { useState } from 'react';
import { Plus, ClipboardList, AlertTriangle, CheckCircle2, ArrowRightCircle } from 'lucide-react';
import {
  PageHeader, KpiGrid, Kpi, FilterBar, Select, Table, Td, Tr, Badge, Modal, Button, Field, ActionBtn, RowActions, DeleteBtn,
} from '../components/ui';
import {
  REQUEST_CATEGORIES, REQUEST_PRIORITIES, REQUEST_STATUSES, INITIAL_EMPLOYEES,
} from '../data/mockData';

const ENGINEERS = INITIAL_EMPLOYEES.filter((e) => ['Engineer', 'Biomedical Engineer'].includes(e.role)).map((e) => e.name);
const FLOW = ['Submitted', 'Reviewed', 'Approved', 'Assigned', 'In Progress', 'On Hold', 'Completed', 'Verified', 'Closed'];

export default function MaintenanceRequests({ store }) {
  const { requests, setRequests, setWorkOrders, currentUser, go } = store;
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [sel, setSel] = useState(null);
  const [showNew, setShowNew] = useState(false);

  const canManage = ['Maintenance Manager', 'Hospital Administrator', 'System Administrator'].includes(currentUser.role);

  const rows = requests
    .filter((r) => !search || r.equipment.toLowerCase().includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase()) || r.location.toLowerCase().includes(search.toLowerCase()))
    .filter((r) => !status || r.status === status)
    .filter((r) => !priority || r.priority === priority);

  const update = (id, patch) => {
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, ...patch } : r));
    if (sel?.id === id) setSel((s) => ({ ...s, ...patch }));
  };

  const advance = (r) => {
    const i = FLOW.indexOf(r.status);
    if (i < FLOW.length - 1) update(r.id, { status: FLOW[i + 1] });
  };

  const convertToWO = (r) => {
    const woId = 'WO-2026-0' + Math.floor(42 + Math.random() * 50);
    setWorkOrders((prev) => [{
      id: woId, title: `${r.category} — ${r.equipment}`, dept: r.dept, location: r.location, equipment: r.equipment,
      priority: r.priority, engineer: r.assignedTo || 'Unassigned', due: '2026-07-20', status: 'Assigned', category: r.category,
      createdFrom: r.id, checklist: [{ t: 'Assess fault', done: false }, { t: 'Repair', done: false }, { t: 'Test', done: false }],
      materials: [], cost: 0, comments: [], history: [{ at: '12:00', text: `Generated from ${r.id}` }],
    }, ...prev]);
    update(r.id, { status: 'Assigned' });
    setSel(null);
    go('work-orders');
  };

  const open = requests.filter((r) => !['Closed', 'Verified'].includes(r.status)).length;

  return (
    <div className="space-y-5">
      <PageHeader title="Maintenance Requests" subtitle="Centralised help desk — raise, review, assign & convert to work orders"
        actions={<Button icon={Plus} onClick={() => setShowNew(true)}>New Request</Button>} />

      <KpiGrid cols={4}>
        <Kpi title="Open Requests" value={open} icon={ClipboardList} tone="blue" />
        <Kpi title="Pending Review" value={requests.filter((r) => ['Submitted', 'Reviewed'].includes(r.status)).length} icon={ClipboardList} tone="amber" />
        <Kpi title="Critical / Emergency" value={requests.filter((r) => ['Critical', 'Emergency'].includes(r.priority) && r.status !== 'Closed').length} icon={AlertTriangle} tone="red" />
        <Kpi title="Completed" value={requests.filter((r) => ['Completed', 'Verified', 'Closed'].includes(r.status)).length} icon={CheckCircle2} tone="green" />
      </KpiGrid>

      <FilterBar search={search} onSearch={setSearch} placeholder="Search ticket, equipment or location…">
        <Select value={priority} onChange={setPriority} options={REQUEST_PRIORITIES} label="All priorities" />
        <Select value={status} onChange={setStatus} options={REQUEST_STATUSES} label="All statuses" />
      </FilterBar>

      <Table headers={['Ticket', 'Dept', 'Location', 'Equipment', 'Priority', 'Reporter', 'Assigned Engineer', 'Status', 'Actions']}>
        {rows.map((r) => (
          <Tr key={r.id} onClick={() => setSel(r)}>
            <Td className="font-semibold text-slate-800">{r.id}</Td>
            <Td>{r.dept}</Td>
            <Td>{r.location}</Td>
            <Td className="font-medium">{r.equipment}</Td>
            <Td><Badge value={r.priority} /></Td>
            <Td>{r.reporter}</Td>
            <Td onClick={(e) => e.stopPropagation()} className="min-w-[160px]">
              {canManage
                ? <Select value={r.assignedTo || ''} onChange={(v) => update(r.id, { assignedTo: v, status: r.status === 'Submitted' || r.status === 'Reviewed' || r.status === 'Approved' ? 'Assigned' : r.status })} options={ENGINEERS} label="Assign…" />
                : (r.assignedTo || '—')}
            </Td>
            <Td><Badge value={r.status} /></Td>
            <Td onClick={(e) => e.stopPropagation()}>
              <RowActions>
                {canManage && FLOW.indexOf(r.status) < FLOW.length - 1 && <ActionBtn tone="navy" onClick={() => advance(r)}>Advance</ActionBtn>}
                {canManage && <DeleteBtn onDelete={() => setRequests((prev) => prev.filter((x) => x.id !== r.id))} />}
              </RowActions>
            </Td>
          </Tr>
        ))}
      </Table>

      {/* Detail modal */}
      <Modal open={!!sel} onClose={() => setSel(null)} title={sel ? `${sel.equipment}` : ''} subtitle={sel ? `${sel.id} · reported ${sel.date}` : ''}
        footer={sel && canManage && (
          <>
            <Select value={sel.assignedTo || ''} onChange={(v) => update(sel.id, { assignedTo: v, status: sel.status === 'Submitted' ? 'Assigned' : sel.status })} options={ENGINEERS} label="Assign engineer…" />
            {['Critical', 'Emergency'].indexOf(sel.priority) === -1 && <Button variant="danger" onClick={() => update(sel.id, { priority: 'Critical' })}>Escalate</Button>}
            <Button variant="ghost" onClick={() => advance(sel)}>Advance Status</Button>
            <Button icon={ArrowRightCircle} onClick={() => convertToWO(sel)}>Convert to Work Order</Button>
          </>
        )}>
        {sel && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Status" value={<Badge value={sel.status} />} />
              <Field label="Priority" value={<Badge value={sel.priority} />} />
              <Field label="Department" value={sel.dept} />
              <Field label="Location" value={sel.location} />
              <Field label="Room / Bed" value={[sel.room, sel.bed].filter(Boolean).join(' / ')} />
              <Field label="Category" value={sel.category} />
              <Field label="Reporter" value={sel.reporter} />
              <Field label="Assigned To" value={sel.assignedTo} />
              <Field label="Description" value={sel.description} full />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Workflow</div>
              <div className="flex flex-wrap gap-1">
                {FLOW.map((s) => (
                  <span key={s} className={`px-2 py-1 rounded text-[10px] font-semibold ${FLOW.indexOf(s) <= FLOW.indexOf(sel.status) ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>{s}</span>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <NewRequest open={showNew} onClose={() => setShowNew(false)} reporter={currentUser.name} onSave={(r) => { setRequests((prev) => [r, ...prev]); setShowNew(false); }} />
    </div>
  );
}

function NewRequest({ open, onClose, onSave, reporter }) {
  const [f, setF] = useState({ dept: 'Wards', location: '', room: '', bed: '', equipment: '', category: 'Electrical', priority: 'Medium', assignedTo: '', description: '' });
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const save = () => onSave({ id: 'MR-2026-0' + Math.floor(15 + Math.random() * 80), reporter, date: '2026-07-19 ' + new Date().toTimeString().slice(0, 5), status: f.assignedTo ? 'Assigned' : 'Submitted', ...f });
  const input = (label, k, full) => (
    <div className={full ? 'col-span-2' : ''}><label className="text-[11px] font-semibold text-slate-600">{label}</label><input value={f[k]} onChange={(e) => set(k)(e.target.value)} className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
  );
  return (
    <Modal open={open} onClose={onClose} title="New Maintenance Request"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={!f.equipment}>Submit Request</Button></>}>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-[11px] font-semibold text-slate-600">Department</label><div className="mt-1"><Select value={f.dept} onChange={set('dept')} options={['Front Desk', 'OPD', 'Wards', 'ICU', 'Theatre', 'Laboratory', 'Pharmacy', 'Administration', 'HR', 'Finance']} /></div></div>
        {input('Location', 'location')}
        {input('Room', 'room')}
        {input('Bed', 'bed')}
        {input('Equipment', 'equipment', true)}
        <div><label className="text-[11px] font-semibold text-slate-600">Category</label><div className="mt-1"><Select value={f.category} onChange={set('category')} options={REQUEST_CATEGORIES} /></div></div>
        <div><label className="text-[11px] font-semibold text-slate-600">Priority</label><div className="mt-1"><Select value={f.priority} onChange={set('priority')} options={REQUEST_PRIORITIES} /></div></div>
        <div className="col-span-2"><label className="text-[11px] font-semibold text-slate-600">Assign Engineer (optional)</label><div className="mt-1"><Select value={f.assignedTo} onChange={set('assignedTo')} options={ENGINEERS} label="Leave unassigned…" /></div><div className="text-[11px] text-slate-400 mt-1">You can reassign to another engineer any time from the requests table.</div></div>
        <div className="col-span-2"><label className="text-[11px] font-semibold text-slate-600">Description</label><textarea value={f.description} onChange={(e) => set('description')(e.target.value)} rows={3} className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
      </div>
    </Modal>
  );
}
