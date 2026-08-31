import React, { useState } from 'react';
import { PlaneTakeoff, CheckCircle2, Clock, Plus } from 'lucide-react';
import { PageHeader, KpiGrid, Kpi, FilterBar, Select, Table, Td, Tr, Badge, Button, Modal, ActionBtn, RowActions, DeleteBtn } from '../components/ui';

export default function LeaveManagement({ store }) {
  const { leave, setLeave, employees } = store;
  const [status, setStatus] = useState('');
  const [showNew, setShowNew] = useState(false);
  const rows = leave.filter((l) => !status || l.status === status);
  const decide = (id, s) => setLeave((prev) => prev.map((l) => l.id === id ? { ...l, status: s } : l));

  return (
    <div className="space-y-5">
      <PageHeader title="Leave Management" subtitle="Requests, approvals & balances"
        actions={<Button icon={Plus} onClick={() => setShowNew(true)}>New Leave Request</Button>} />
      <KpiGrid cols={3}>
        <Kpi title="Pending" value={leave.filter((l) => l.status === 'Pending').length} icon={Clock} tone="amber" />
        <Kpi title="Approved" value={leave.filter((l) => l.status === 'Approved').length} icon={CheckCircle2} tone="green" />
        <Kpi title="On Leave Now" value={leave.filter((l) => l.status === 'Approved' && l.from <= '2026-07-19' && l.to >= '2026-07-19').length} icon={PlaneTakeoff} tone="blue" />
      </KpiGrid>
      <FilterBar>
        <Select value={status} onChange={setStatus} options={['Pending', 'Approved', 'Rejected']} label="All statuses" />
      </FilterBar>
      <Table headers={['Ref', 'Staff', 'Role', 'Type', 'From', 'To', 'Days', 'Status', 'Actions']}>
        {rows.map((l) => (
          <Tr key={l.id}>
            <Td className="font-semibold text-slate-800">{l.id}</Td>
            <Td className="font-medium">{l.staff}</Td>
            <Td>{l.role}</Td>
            <Td>{l.type}</Td>
            <Td>{l.from}</Td>
            <Td>{l.to}</Td>
            <Td>{l.days}</Td>
            <Td><Badge value={l.status} /></Td>
            <Td>
              <RowActions>
                {l.status === 'Pending' && <ActionBtn tone="success" onClick={() => decide(l.id, 'Approved')}>Approve</ActionBtn>}
                {l.status === 'Pending' && <ActionBtn tone="danger" onClick={() => decide(l.id, 'Rejected')}>Reject</ActionBtn>}
                <DeleteBtn onDelete={() => setLeave((prev) => prev.filter((x) => x.id !== l.id))} />
              </RowActions>
            </Td>
          </Tr>
        ))}
      </Table>

      <NewLeave open={showNew} onClose={() => setShowNew(false)} employees={employees}
        onSave={(l) => { setLeave((prev) => [l, ...prev]); setShowNew(false); }} />
    </div>
  );
}

function daysBetween(a, b) {
  const d = (new Date(b) - new Date(a)) / 86400000 + 1;
  return Number.isFinite(d) && d > 0 ? Math.round(d) : 1;
}

function NewLeave({ open, onClose, onSave, employees }) {
  const [f, setF] = useState({ staffKey: '', type: 'Annual', from: '2026-08-01', to: '2026-08-05' });
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const emp = employees.find((e) => e.name === f.staffKey);
  const save = () => {
    if (!emp) return;
    onSave({ id: 'LV-' + String(Math.floor(5 + Math.random() * 90)).padStart(2, '0'), staff: emp.name, role: emp.role, type: f.type, from: f.from, to: f.to, days: daysBetween(f.from, f.to), status: 'Pending' });
  };
  return (
    <Modal open={open} onClose={onClose} title="New Leave Request" width="max-w-2xl"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={!emp}>Submit Request</Button></>}>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><label className="text-[11px] font-semibold text-slate-600">Staff</label><div className="mt-1"><Select value={f.staffKey} onChange={set('staffKey')} options={employees.map((e) => e.name)} label="Select staff…" /></div></div>
        <div><label className="text-[11px] font-semibold text-slate-600">Leave Type</label><div className="mt-1"><Select value={f.type} onChange={set('type')} options={['Annual', 'Sick', 'Casual', 'Maternity', 'Study']} /></div></div>
        <div><label className="text-[11px] font-semibold text-slate-600">Duration</label><div className="mt-1 text-sm text-slate-700 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200">{daysBetween(f.from, f.to)} day(s)</div></div>
        <div><label className="text-[11px] font-semibold text-slate-600">From</label><input type="date" value={f.from} onChange={(e) => set('from')(e.target.value)} className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0b1c30]" /></div>
        <div><label className="text-[11px] font-semibold text-slate-600">To</label><input type="date" value={f.to} onChange={(e) => set('to')(e.target.value)} className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0b1c30]" /></div>
      </div>
    </Modal>
  );
}
