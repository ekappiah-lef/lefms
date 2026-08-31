import React, { useState } from 'react';
import { HardHat, Wrench, CheckCircle2, Plus } from 'lucide-react';
import { PageHeader, KpiGrid, Kpi, Table, Td, Tr, Badge, SectionCard, Button, Modal, Select, DeleteBtn } from '../components/ui';

export default function Engineers({ store }) {
  const { employees, setEmployees, workOrders } = store;
  const [showNew, setShowNew] = useState(false);
  const engineers = employees.filter((e) => ['Engineer', 'Biomedical Engineer'].includes(e.role));

  const load = (name) => workOrders.filter((w) => w.engineer === name && !['Closed', 'Verified'].includes(w.status));

  return (
    <div className="space-y-5">
      <PageHeader title="Engineers" subtitle="Team availability & current workload"
        actions={<Button icon={Plus} onClick={() => setShowNew(true)}>Add Engineer</Button>} />
      <KpiGrid cols={3}>
        <Kpi title="Engineers" value={engineers.length} icon={HardHat} tone="blue" />
        <Kpi title="On Duty" value={engineers.filter((e) => e.present).length} icon={CheckCircle2} tone="green" />
        <Kpi title="Active Jobs" value={workOrders.filter((w) => !['Closed', 'Verified'].includes(w.status)).length} icon={Wrench} tone="amber" />
      </KpiGrid>

      <Table headers={['Staff ID', 'Name', 'Role', 'Dept', 'Shift', 'Status', 'Active Jobs', 'Actions']}>
        {engineers.map((e) => (
          <Tr key={e.id}>
            <Td className="font-semibold text-slate-800">{e.staffId}</Td>
            <Td className="font-medium">{e.name}</Td>
            <Td>{e.role}</Td>
            <Td>{e.dept}</Td>
            <Td>{e.shift}</Td>
            <Td><Badge value={e.present ? 'On Duty' : e.status} /></Td>
            <Td className="font-bold">{load(e.name).length}</Td>
            <Td><DeleteBtn onDelete={() => setEmployees((prev) => prev.filter((x) => x.id !== e.id))} /></Td>
          </Tr>
        ))}
      </Table>

      <SectionCard title="Assignments by Engineer">
        <div className="space-y-3">
          {engineers.filter((e) => load(e.name).length).map((e) => (
            <div key={e.id}>
              <div className="text-[12px] font-bold text-slate-600 mb-1">{e.name}</div>
              <div className="flex flex-wrap gap-2">
                {load(e.name).map((w) => (
                  <span key={w.id} className="px-2 py-1 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 ring-1 ring-blue-200">{w.id} · {w.equipment}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <NewEngineer open={showNew} onClose={() => setShowNew(false)} count={employees.length} onSave={(e) => { setEmployees((prev) => [e, ...prev]); setShowNew(false); }} />
    </div>
  );
}

function NewEngineer({ open, onClose, onSave, count }) {
  const [f, setF] = useState({ name: '', role: 'Engineer', dept: 'Maintenance', shift: 'Morning', phone: '', qualification: '' });
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const save = () => onSave({ id: 'E-' + String(count + 1).padStart(3, '0'), staffId: 'TBH-' + String(count + 1).padStart(4, '0'), status: 'Active', present: true, hired: '2026-07-19', ...f });
  const input = (label, k, full) => (<div className={full ? 'col-span-2' : ''}><label className="text-[11px] font-semibold text-slate-600">{label}</label><input value={f[k]} onChange={(e) => set(k)(e.target.value)} className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>);
  return (
    <Modal open={open} onClose={onClose} title="Add Engineer / Technician"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={!f.name}>Add Engineer</Button></>}>
      <div className="grid grid-cols-2 gap-3">
        {input('Full Name', 'name', true)}
        <div><label className="text-[11px] font-semibold text-slate-600">Role</label><div className="mt-1"><Select value={f.role} onChange={set('role')} options={['Engineer', 'Biomedical Engineer']} /></div></div>
        <div><label className="text-[11px] font-semibold text-slate-600">Department</label><div className="mt-1"><Select value={f.dept} onChange={set('dept')} options={['Maintenance', 'Biomedical']} /></div></div>
        <div><label className="text-[11px] font-semibold text-slate-600">Shift</label><div className="mt-1"><Select value={f.shift} onChange={set('shift')} options={['Morning', 'Afternoon', 'Night', 'On-Call']} /></div></div>
        {input('Phone', 'phone')}
        {input('Qualification', 'qualification', true)}
      </div>
    </Modal>
  );
}
