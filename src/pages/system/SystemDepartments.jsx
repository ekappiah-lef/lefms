import React, { useState } from 'react';
import { Network, Users, Plus } from 'lucide-react';
import { PageHeader, KpiGrid, Kpi, Table, Td, Tr, Badge, Button, Modal, Select, DeleteBtn } from '../../components/ui';

export default function SystemDepartments({ store }) {
  const { departments, setDepartments } = store;
  const [showAdd, setShowAdd] = useState(false);
  const totalStaff = departments.reduce((s, d) => s + d.staff, 0);
  const types = [...new Set(departments.map((d) => d.type))];

  return (
    <div className="space-y-5">
      <PageHeader title="Departments" subtitle="Department directory, heads & cost centres"
        actions={<Button icon={Plus} onClick={() => setShowAdd(true)}>Add Department</Button>} />

      <KpiGrid cols={3}>
        <Kpi title="Departments" value={departments.length} icon={Network} tone="blue" />
        <Kpi title="Total Staff" value={totalStaff} icon={Users} tone="green" />
        <Kpi title="Department Types" value={types.length} icon={Network} tone="slate" />
      </KpiGrid>

      <Table headers={['Code', 'Department', 'Head', 'Type', 'Staff', 'Cost Centre', 'Actions']}>
        {departments.map((d) => (
          <Tr key={d.id}>
            <Td className="font-semibold text-slate-800">{d.id}</Td>
            <Td className="font-medium">{d.name}</Td>
            <Td>{d.head}</Td>
            <Td><Badge tone="blue">{d.type}</Badge></Td>
            <Td>{d.staff}</Td>
            <Td>{d.costCentre}</Td>
            <Td><DeleteBtn onDelete={() => setDepartments((prev) => prev.filter((x) => x.id !== d.id))} /></Td>
          </Tr>
        ))}
      </Table>

      <AddDepartment open={showAdd} onClose={() => setShowAdd(false)} count={departments.length}
        onSave={(d) => { setDepartments((prev) => [...prev, d]); setShowAdd(false); }} />
    </div>
  );
}

function AddDepartment({ open, onClose, onSave, count }) {
  const [f, setF] = useState({ name: '', head: '', type: 'Clinical', staff: 0, costCentre: '' });
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const save = () => onSave({ id: 'DPT-' + String(count + 1).padStart(2, '0'), name: f.name, head: f.head, type: f.type, staff: Number(f.staff) || 0, costCentre: f.costCentre || 'CC-' + (600 + count) });
  const input = (label, k, full, type = 'text') => (<div className={full ? 'col-span-2' : ''}><label className="text-[11px] font-semibold text-slate-600">{label}</label><input type={type} value={f[k]} onChange={(e) => set(k)(e.target.value)} className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0b1c30]" /></div>);
  return (
    <Modal open={open} onClose={onClose} title="Add Department" width="max-w-2xl"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={!f.name}>Add Department</Button></>}>
      <div className="grid grid-cols-2 gap-3">
        {input('Department Name', 'name', true)}
        {input('Head of Department', 'head')}
        <div><label className="text-[11px] font-semibold text-slate-600">Type</label><div className="mt-1"><Select value={f.type} onChange={set('type')} options={['Clinical', 'Clinical Support', 'Diagnostic', 'Facility', 'Administrative']} /></div></div>
        {input('Staff Count', 'staff', false, 'number')}
        {input('Cost Centre', 'costCentre')}
      </div>
    </Modal>
  );
}
