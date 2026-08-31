import React, { useState } from 'react';
import { Wrench, CheckCircle2, Clock, AlertTriangle, Plus } from 'lucide-react';
import {
  PageHeader, KpiGrid, Kpi, FilterBar, Select, Table, Td, Tr, Badge, Modal, Button, Field, Tabs, ActionBtn, RowActions, DeleteBtn,
} from '../components/ui';
import { WORK_ORDER_STATUSES, REQUEST_CATEGORIES, REQUEST_PRIORITIES, INITIAL_EMPLOYEES } from '../data/mockData';

const NEXT = { Open: 'Assigned', Assigned: 'In Progress', 'In Progress': 'Completed', 'On Hold': 'In Progress', Completed: 'Verified', Verified: 'Closed' };
const ENGINEERS = INITIAL_EMPLOYEES.filter((e) => ['Engineer', 'Biomedical Engineer'].includes(e.role)).map((e) => e.name);

export default function WorkOrders({ store }) {
  const { workOrders, setWorkOrders } = store;
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sel, setSel] = useState(null);
  const [showNew, setShowNew] = useState(false);

  const rows = workOrders
    .filter((w) => !search || w.title.toLowerCase().includes(search.toLowerCase()) || w.id.toLowerCase().includes(search.toLowerCase()))
    .filter((w) => !status || w.status === status);

  const update = (id, patch) => {
    setWorkOrders((prev) => prev.map((w) => w.id === id ? { ...w, ...patch } : w));
    if (sel?.id === id) setSel((s) => ({ ...s, ...patch }));
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Work Orders" subtitle="Assigned jobs, checklists, materials & cost tracking"
        actions={<Button icon={Plus} onClick={() => setShowNew(true)}>New Work Order</Button>} />

      <KpiGrid cols={4}>
        <Kpi title="Total" value={workOrders.length} icon={Wrench} tone="slate" />
        <Kpi title="In Progress" value={workOrders.filter((w) => w.status === 'In Progress').length} icon={Clock} tone="amber" />
        <Kpi title="Emergency" value={workOrders.filter((w) => w.priority === 'Emergency').length} icon={AlertTriangle} tone="red" />
        <Kpi title="Completed" value={workOrders.filter((w) => ['Completed', 'Verified', 'Closed'].includes(w.status)).length} icon={CheckCircle2} tone="green" />
      </KpiGrid>

      <FilterBar search={search} onSearch={setSearch} placeholder="Search work order…">
        <Select value={status} onChange={setStatus} options={WORK_ORDER_STATUSES} label="All statuses" />
      </FilterBar>

      <Table headers={['WO No', 'Title', 'Dept', 'Location', 'Equipment', 'Priority', 'Engineer', 'Due', 'Status', '']}>
        {rows.map((w) => (
          <Tr key={w.id} onClick={() => setSel(w)}>
            <Td className="font-semibold text-slate-800">{w.id}</Td>
            <Td className="font-medium">{w.title}</Td>
            <Td>{w.dept}</Td>
            <Td>{w.location}</Td>
            <Td>{w.equipment}</Td>
            <Td><Badge value={w.priority} /></Td>
            <Td>{w.engineer}</Td>
            <Td>{w.due}</Td>
            <Td><Badge value={w.status} /></Td>
            <Td onClick={(e) => e.stopPropagation()}>
              <RowActions>
                {NEXT[w.status] && <ActionBtn tone={NEXT[w.status] === 'Completed' ? 'success' : 'navy'} onClick={() => update(w.id, { status: NEXT[w.status] })}>{NEXT[w.status]}</ActionBtn>}
                <DeleteBtn onDelete={() => setWorkOrders((prev) => prev.filter((x) => x.id !== w.id))} />
              </RowActions>
            </Td>
          </Tr>
        ))}
      </Table>

      <WorkOrderModal wo={sel} onClose={() => setSel(null)} update={update} />
      <NewWorkOrder open={showNew} onClose={() => setShowNew(false)} onSave={(wo) => { setWorkOrders((prev) => [wo, ...prev]); setShowNew(false); }} />
    </div>
  );
}

function NewWorkOrder({ open, onClose, onSave }) {
  const [f, setF] = useState({ title: '', dept: 'Wards', location: '', equipment: '', category: 'Electrical', priority: 'Medium', engineer: ENGINEERS[0], due: '2026-07-21' });
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const save = () => onSave({
    id: 'WO-2026-0' + Math.floor(42 + Math.random() * 90), title: f.title, dept: f.dept, location: f.location, equipment: f.equipment,
    category: f.category, priority: f.priority, engineer: f.engineer, due: f.due, status: 'Assigned', createdFrom: '',
    checklist: [{ t: 'Assess fault', done: false }, { t: 'Carry out repair', done: false }, { t: 'Test & verify', done: false }],
    materials: [], cost: 0, comments: [], history: [{ at: new Date().toTimeString().slice(0, 5), text: 'Work order created & assigned to ' + f.engineer }],
  });
  const input = (label, k, full) => (<div className={full ? 'col-span-2' : ''}><label className="text-[11px] font-semibold text-slate-600">{label}</label><input value={f[k]} onChange={(e) => set(k)(e.target.value)} className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>);
  return (
    <Modal open={open} onClose={onClose} title="New Work Order" subtitle="Assign a job directly to an engineer"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={!f.title}>Create &amp; Assign</Button></>}>
      <div className="grid grid-cols-2 gap-3">
        {input('Title', 'title', true)}
        <div><label className="text-[11px] font-semibold text-slate-600">Department</label><div className="mt-1"><Select value={f.dept} onChange={set('dept')} options={['Front Desk', 'OPD', 'Wards', 'ICU', 'Theatre', 'Laboratory', 'Pharmacy', 'Maternity', 'Facility']} /></div></div>
        {input('Location', 'location')}
        {input('Equipment', 'equipment')}
        <div><label className="text-[11px] font-semibold text-slate-600">Category</label><div className="mt-1"><Select value={f.category} onChange={set('category')} options={REQUEST_CATEGORIES} /></div></div>
        <div><label className="text-[11px] font-semibold text-slate-600">Priority</label><div className="mt-1"><Select value={f.priority} onChange={set('priority')} options={REQUEST_PRIORITIES} /></div></div>
        <div><label className="text-[11px] font-semibold text-slate-600">Assign Engineer</label><div className="mt-1"><Select value={f.engineer} onChange={set('engineer')} options={ENGINEERS} /></div></div>
        {input('Due Date', 'due', true)}
      </div>
    </Modal>
  );
}

function WorkOrderModal({ wo, onClose, update }) {
  const [tab, setTab] = useState('Overview');
  if (!wo) return null;
  const tabs = ['Overview', 'Checklist', 'Comments', 'Attachments', 'Materials', 'Cost', 'History'];
  const toggleCheck = (i) => update(wo.id, { checklist: wo.checklist.map((c, idx) => idx === i ? { ...c, done: !c.done } : c) });
  const done = wo.checklist.filter((c) => c.done).length;

  return (
    <Modal open={!!wo} onClose={onClose} title={wo.title} subtitle={`${wo.id} · ${wo.createdFrom ? 'from ' + wo.createdFrom : ''}`}
      footer={<><Button variant="ghost" onClick={onClose}>Close</Button>{NEXT[wo.status] && <Button onClick={() => update(wo.id, { status: NEXT[wo.status] })}>Move to {NEXT[wo.status]}</Button>}</>}>
      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {tab === 'Overview' && (
        <div className="grid grid-cols-2 gap-4">
          <Field label="Status" value={<Badge value={wo.status} />} />
          <Field label="Priority" value={<Badge value={wo.priority} />} />
          <Field label="Department" value={wo.dept} />
          <Field label="Location" value={wo.location} />
          <Field label="Equipment" value={wo.equipment} />
          <Field label="Category" value={wo.category} />
          <Field label="Assigned Engineer" value={wo.engineer} />
          <Field label="Due Date" value={wo.due} />
          <Field label="Checklist Progress" value={`${done}/${wo.checklist.length} complete`} />
        </div>
      )}

      {tab === 'Checklist' && (
        <div className="space-y-2">
          {wo.checklist.map((c, i) => (
            <label key={i} className="flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-2 cursor-pointer hover:bg-slate-50">
              <input type="checkbox" checked={c.done} onChange={() => toggleCheck(i)} className="h-4 w-4 accent-blue-600" />
              <span className={`text-[13px] ${c.done ? 'line-through text-slate-400' : 'text-slate-700'}`}>{c.t}</span>
            </label>
          ))}
        </div>
      )}

      {tab === 'Comments' && (
        <div className="space-y-2">
          {wo.comments.length === 0 && <p className="text-sm text-slate-400">No comments yet.</p>}
          {wo.comments.map((c, i) => (
            <div key={i} className="rounded-lg border border-slate-100 px-3 py-2"><div className="text-[13px] text-slate-700">{c.text}</div><div className="text-[11px] text-slate-400 mt-0.5">{c.by} · {c.at}</div></div>
          ))}
        </div>
      )}

      {tab === 'Attachments' && <p className="text-sm text-slate-400">Before / after photos and documents attach here. Engineers upload from the mobile view.</p>}

      {tab === 'Materials' && (
        <Table headers={['Item', 'Qty', 'Cost (GHS)']}>
          {wo.materials.map((m, i) => (<Tr key={i}><Td>{m.item}</Td><Td>{m.qty}</Td><Td>{m.cost}</Td></Tr>))}
        </Table>
      )}

      {tab === 'Cost' && (
        <div className="grid grid-cols-2 gap-4">
          <Field label="Materials Cost" value={`GHS ${wo.materials.reduce((s, m) => s + m.cost, 0)}`} />
          <Field label="Total Logged Cost" value={`GHS ${wo.cost}`} />
        </div>
      )}

      {tab === 'History' && (
        <div className="space-y-2">
          {wo.history.map((h, i) => (
            <div key={i} className="flex gap-3"><span className="text-[11px] text-slate-400 w-12 shrink-0">{h.at}</span><span className="text-[13px] text-slate-700">{h.text}</span></div>
          ))}
        </div>
      )}
    </Modal>
  );
}
