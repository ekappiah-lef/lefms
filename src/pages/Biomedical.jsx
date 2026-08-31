import React, { useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell,
} from 'recharts';
import { ScanLine, AlertTriangle, CheckCircle2, Clock, Plus, Printer, Wrench } from 'lucide-react';
import {
  PageHeader, KpiGrid, Kpi, Tabs, FilterBar, Select, Table, Td, Tr, Badge, Modal, Button, Field,
  ActionBtn, RowActions, SectionCard, DeleteBtn,
} from '../components/ui';
import { BIOMED_STATUSES } from '../data/extraData';

const NEXT = { Open: 'In Progress', 'In Progress': 'Resolved', 'Awaiting Parts': 'Resolved', Resolved: 'Closed' };
const COLORS = ['#febb06', '#2563eb', '#8b5cf6', '#10b981', '#94a3b8'];

export default function Biomedical({ store }) {
  const { biomedTickets, setBiomedTickets, biomedEquipment, setBiomedEquipment, currentUser } = store;
  const [tab, setTab] = useState('Tickets');
  const [status, setStatus] = useState('');
  const [sel, setSel] = useState(null);
  const [showNew, setShowNew] = useState(false);

  const rows = biomedTickets.filter((t) => !status || t.status === status);
  const pending = biomedTickets.filter((t) => !['Resolved', 'Closed'].includes(t.status)).length;
  const resolved = biomedTickets.filter((t) => ['Resolved', 'Closed'].includes(t.status)).length;

  const setTicket = (id, patch) => {
    setBiomedTickets((prev) => prev.map((t) => t.id === id ? { ...t, ...patch } : t));
    if (sel?.id === id) setSel((s) => ({ ...s, ...patch }));
  };
  const advance = (t) => {
    const n = NEXT[t.status];
    if (!n) return;
    setTicket(t.id, { status: n, resolvedAt: n === 'Resolved' ? '2026-07-19 ' + new Date().toTimeString().slice(0, 5) : t.resolvedAt });
  };

  // weekly report data
  const byStatus = BIOMED_STATUSES.map((s) => ({ name: s, value: biomedTickets.filter((t) => t.status === s).length })).filter((x) => x.value);
  const byCategory = [...new Set(biomedEquipment.map((e) => e.category))].map((c) => ({
    category: c,
    pending: biomedTickets.filter((t) => t.category === c && !['Resolved', 'Closed'].includes(t.status)).length,
    resolved: biomedTickets.filter((t) => t.category === c && ['Resolved', 'Closed'].includes(t.status)).length,
  })).filter((x) => x.pending || x.resolved);

  return (
    <div className="space-y-5">
      <PageHeader title="Biomedical Engineering" subtitle="Imaging & diagnostic equipment — fault tickets, status & weekly reporting"
        actions={<Button icon={Plus} onClick={() => setShowNew(true)}>Log Equipment Fault</Button>} />

      <KpiGrid cols={4}>
        <Kpi title="Equipment Units" value={biomedEquipment.length} icon={ScanLine} tone="blue" />
        <Kpi title="Pending Faults" value={pending} icon={AlertTriangle} tone="amber" />
        <Kpi title="Resolved" value={resolved} icon={CheckCircle2} tone="green" />
        <Kpi title="Awaiting Parts" value={biomedTickets.filter((t) => t.status === 'Awaiting Parts').length} icon={Clock} tone="red" />
      </KpiGrid>

      <Tabs tabs={['Tickets', 'Equipment', 'Weekly Report']} active={tab} onChange={setTab} />

      {tab === 'Tickets' && (
        <>
          <FilterBar>
            <Select value={status} onChange={setStatus} options={BIOMED_STATUSES} label="All statuses" />
          </FilterBar>
          <Table headers={['Ticket', 'Equipment', 'Category', 'Fault', 'Reported By', 'Priority', 'Assigned', 'Status', 'Actions']}>
            {rows.map((t) => (
              <Tr key={t.id} onClick={() => setSel(t)}>
                <Td className="font-semibold text-slate-800">{t.id}</Td>
                <Td className="font-medium">{t.equipment}</Td>
                <Td>{t.category}</Td>
                <Td className="max-w-[220px] truncate">{t.fault}</Td>
                <Td>{t.reportedBy}</Td>
                <Td><Badge value={t.priority} /></Td>
                <Td>{t.assignedTo || '—'}</Td>
                <Td><Badge value={['Resolved', 'Closed'].includes(t.status) ? 'Completed' : t.status === 'In Progress' ? 'In Progress' : 'Pending'}>{t.status}</Badge></Td>
                <Td onClick={(e) => e.stopPropagation()}>
                  <RowActions>
                    {!t.assignedTo && <ActionBtn tone="outline" onClick={() => setTicket(t.id, { assignedTo: 'Efua Sarpong', status: 'In Progress' })}>Assign</ActionBtn>}
                    {NEXT[t.status] && <ActionBtn tone={NEXT[t.status] === 'Resolved' ? 'success' : 'navy'} onClick={() => advance(t)}>{NEXT[t.status] === 'Resolved' ? 'Resolve' : NEXT[t.status]}</ActionBtn>}
                    <DeleteBtn onDelete={() => setBiomedTickets((prev) => prev.filter((x) => x.id !== t.id))} />
                  </RowActions>
                </Td>
              </Tr>
            ))}
          </Table>
        </>
      )}

      {tab === 'Equipment' && (
        <Table headers={['Tag', 'Equipment', 'Category', 'Location', 'Manufacturer', 'Last Service', 'Next Service', 'Status', 'Actions']}>
          {biomedEquipment.map((e) => (
            <Tr key={e.id}>
              <Td className="font-semibold text-slate-800">{e.id}</Td>
              <Td className="font-medium">{e.name}</Td>
              <Td>{e.category}</Td>
              <Td>{e.location}</Td>
              <Td>{e.manufacturer}</Td>
              <Td>{e.lastServiced}</Td>
              <Td>{e.nextService}</Td>
              <Td><Badge value={e.status === 'Operational' ? 'Active' : e.status === 'Under Repair' ? 'In Progress' : 'Overdue'}>{e.status}</Badge></Td>
              <Td><DeleteBtn onDelete={() => setBiomedEquipment((prev) => prev.filter((x) => x.id !== e.id))} /></Td>
            </Tr>
          ))}
        </Table>
      )}

      {tab === 'Weekly Report' && (
        <div className="space-y-4">
          <div className="flex justify-end"><Button variant="ghost" icon={Printer} onClick={() => window.print()}>Print / Export</Button></div>
          <KpiGrid cols={3}>
            <Kpi title="Faults This Week" value={biomedTickets.length} icon={AlertTriangle} tone="blue" />
            <Kpi title="Resolved This Week" value={resolved} icon={CheckCircle2} tone="green" />
            <Kpi title="Still Pending" value={pending} icon={Clock} tone="amber" />
          </KpiGrid>
          <div className="grid lg:grid-cols-2 gap-4">
            <SectionCard title="Tickets by Status">
              <ResponsiveContainer width="100%" height={230}>
                <PieChart>
                  <Pie data={byStatus} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={3}>
                    {byStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 justify-center">
                {byStatus.map((s, i) => <span key={s.name} className="flex items-center gap-1 text-[11px] text-slate-600"><span className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />{s.name}</span>)}
              </div>
            </SectionCard>
            <SectionCard title="Pending vs Resolved by Equipment Type">
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={byCategory} margin={{ left: -20, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                  <XAxis dataKey="category" tick={{ fontSize: 10 }} stroke="#94a3b8" interval={0} angle={-20} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="pending" fill="#febb06" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="resolved" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </SectionCard>
          </div>
        </div>
      )}

      {/* Ticket detail */}
      <Modal open={!!sel} onClose={() => setSel(null)} title={sel?.equipment} subtitle={sel ? `${sel.id} · ${sel.category}` : ''}
        footer={sel && (
          <>
            {!sel.assignedTo && <Button variant="ghost" onClick={() => setTicket(sel.id, { assignedTo: 'Efua Sarpong', status: 'In Progress' })}>Assign to me</Button>}
            {NEXT[sel.status] && <Button icon={sel.status === 'In Progress' ? CheckCircle2 : Wrench} onClick={() => advance(sel)}>{NEXT[sel.status] === 'Resolved' ? 'Mark Resolved' : NEXT[sel.status]}</Button>}
          </>
        )}>
        {sel && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Status" value={<Badge value={['Resolved', 'Closed'].includes(sel.status) ? 'Completed' : 'Pending'}>{sel.status}</Badge>} />
            <Field label="Priority" value={<Badge value={sel.priority} />} />
            <Field label="Reported By" value={sel.reportedBy} />
            <Field label="Reported At" value={sel.reportedAt} />
            <Field label="Assigned To" value={sel.assignedTo} />
            <Field label="Resolved At" value={sel.resolvedAt || 'Not resolved'} />
            <Field label="Fault" value={sel.fault} full />
          </div>
        )}
      </Modal>

      <NewFault open={showNew} onClose={() => setShowNew(false)} equipment={biomedEquipment} reporter={currentUser.name}
        onSave={(t) => { setBiomedTickets((prev) => [t, ...prev]); setShowNew(false); }} />
    </div>
  );
}

function NewFault({ open, onClose, onSave, equipment, reporter }) {
  const [f, setF] = useState({ equipmentId: equipment[0]?.id || '', fault: '', priority: 'Medium' });
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const save = () => {
    const eq = equipment.find((e) => e.id === f.equipmentId) || {};
    onSave({ id: 'BMT-' + String(Math.floor(6 + Math.random() * 900)).padStart(3, '0'), equipmentId: f.equipmentId, equipment: eq.name, category: eq.category, reportedBy: reporter, fault: f.fault, priority: f.priority, status: 'Open', assignedTo: '', reportedAt: '2026-07-19 ' + new Date().toTimeString().slice(0, 5), resolvedAt: '' });
  };
  return (
    <Modal open={open} onClose={onClose} title="Log Equipment Fault" width="max-w-lg"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={!f.fault}>Create Ticket</Button></>}>
      <div className="grid grid-cols-1 gap-3">
        <div><label className="text-[11px] font-semibold text-slate-600">Equipment</label><div className="mt-1"><Select value={f.equipmentId} onChange={set('equipmentId')} options={equipment.map((e) => e.id)} /></div><div className="text-[11px] text-slate-400 mt-1">{equipment.find((e) => e.id === f.equipmentId)?.name}</div></div>
        <div><label className="text-[11px] font-semibold text-slate-600">Priority</label><div className="mt-1"><Select value={f.priority} onChange={set('priority')} options={['Low', 'Medium', 'High', 'Critical']} /></div></div>
        <div><label className="text-[11px] font-semibold text-slate-600">Fault Description</label><textarea value={f.fault} onChange={(e) => set('fault')(e.target.value)} rows={3} className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
      </div>
    </Modal>
  );
}
