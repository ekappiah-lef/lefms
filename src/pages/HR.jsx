import React, { useState } from 'react';
import { Users, UserPlus, UserCheck, PlaneTakeoff, Eye } from 'lucide-react';
import { PageHeader, KpiGrid, Kpi, FilterBar, Select, Table, Td, Tr, Badge, Modal, Button, Field, IconBtn, RowActions, DeleteBtn } from '../components/ui';

const ROLES = ['Doctor', 'Nurse', 'Ward Manager', 'Front Desk Officer', 'OPD Officer', 'Engineer', 'Biomedical Engineer', 'HR Officer', 'Finance Officer', 'Cleaner', 'Security'];

export default function HR({ store }) {
  const { employees, setEmployees } = store;
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('');
  const [sel, setSel] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  const depts = [...new Set(employees.map((e) => e.dept))];
  const rows = employees
    .filter((e) => !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.staffId.toLowerCase().includes(search.toLowerCase()))
    .filter((e) => !dept || e.dept === dept);

  return (
    <div className="space-y-5">
      <PageHeader title="Human Resources" subtitle="Employee records, roles & employment status"
        actions={<Button icon={UserPlus} onClick={() => setShowAdd(true)}>Add Employee</Button>} />

      <KpiGrid cols={4}>
        <Kpi title="Total Employees" value={employees.length} icon={Users} tone="blue" />
        <Kpi title="Present" value={employees.filter((e) => e.present).length} icon={UserCheck} tone="green" />
        <Kpi title="On Leave" value={employees.filter((e) => e.status === 'On Leave').length} icon={PlaneTakeoff} tone="amber" />
        <Kpi title="Departments" value={depts.length} icon={Users} tone="slate" />
      </KpiGrid>

      <FilterBar search={search} onSearch={setSearch} placeholder="Search name or staff ID…">
        <Select value={dept} onChange={setDept} options={depts} label="All departments" />
      </FilterBar>

      <Table headers={['Staff ID', 'Name', 'Role', 'Department', 'Shift', 'Qualification', 'Status', '']}>
        {rows.map((e) => (
          <Tr key={e.id} onClick={() => setSel(e)}>
            <Td className="font-semibold text-slate-800">{e.staffId}</Td>
            <Td className="font-medium">{e.name}</Td>
            <Td>{e.role}</Td>
            <Td>{e.dept}</Td>
            <Td>{e.shift}</Td>
            <Td>{e.qualification}</Td>
            <Td><Badge value={e.present ? 'Active' : e.status} /></Td>
            <Td onClick={(ev) => ev.stopPropagation()}><RowActions><IconBtn icon={Eye} title="View profile" onClick={() => setSel(e)} /><DeleteBtn onDelete={() => setEmployees((prev) => prev.filter((x) => x.id !== e.id))} /></RowActions></Td>
          </Tr>
        ))}
      </Table>

      <Modal open={!!sel} onClose={() => setSel(null)} title={sel?.name} subtitle={sel ? `${sel.staffId} · ${sel.role}` : ''}>
        {sel && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Department" value={sel.dept} />
            <Field label="Role" value={sel.role} />
            <Field label="Shift" value={sel.shift} />
            <Field label="Employment Status" value={<Badge value={sel.status} />} />
            <Field label="Phone" value={sel.phone} />
            <Field label="Qualification" value={sel.qualification} />
            <Field label="Date Hired" value={sel.hired} />
            <Field label="Present Today" value={sel.present ? 'Yes' : 'No'} />
          </div>
        )}
      </Modal>

      <AddEmployee open={showAdd} onClose={() => setShowAdd(false)} count={employees.length} onSave={(e) => { setEmployees((prev) => [e, ...prev]); setShowAdd(false); }} />
    </div>
  );
}

function Section({ title, desc, children }) {
  return (
    <div className="grid md:grid-cols-3 gap-4 py-4 border-b border-slate-100 last:border-0">
      <div><h4 className="text-sm font-bold text-slate-800">{title}</h4><p className="text-[12px] text-slate-500 mt-0.5">{desc}</p></div>
      <div className="md:col-span-2 grid grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

function AddEmployee({ open, onClose, onSave, count }) {
  const [f, setF] = useState({ name: '', role: 'Nurse', dept: 'Wards', shift: 'Morning', employment: 'Active', phone: '', email: '', qualification: '', hired: '2026-07-19' });
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const save = () => onSave({ id: 'E-' + String(count + 1).padStart(3, '0'), staffId: 'TBH-' + String(count + 1).padStart(4, '0'), status: f.employment, present: true, ...f });
  const input = (label, k, full, type = 'text') => (<div className={full ? 'col-span-2' : ''}><label className="text-[11px] font-semibold text-slate-600">{label}</label><input type={type} value={f[k]} onChange={(e) => set(k)(e.target.value)} className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0b1c30]" /></div>);
  const sel = (label, k, opts) => (<div><label className="text-[11px] font-semibold text-slate-600">{label}</label><div className="mt-1"><Select value={f[k]} onChange={set(k)} options={opts} /></div></div>);
  return (
    <Modal open={open} onClose={onClose} title="Add Employee" subtitle="A staff ID is auto-generated on save" width="max-w-3xl"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={!f.name}>Save Employee</Button></>}>
      <div className="divide-y divide-slate-100">
        <Section title="Identity" desc="Name and job role.">
          {input('Full Name', 'name', true)}
          {sel('Role', 'role', ROLES)}
          {sel('Department', 'dept', ['OPD', 'Wards', 'Front Desk', 'Maintenance', 'Biomedical', 'Human Resources', 'Finance', 'Housekeeping', 'Security', 'Laboratory', 'Pharmacy'])}
        </Section>
        <Section title="Employment" desc="Status, shift & start date.">
          {sel('Employment Status', 'employment', ['Active', 'On Leave', 'Suspended'])}
          {sel('Default Shift', 'shift', ['Morning', 'Afternoon', 'Night', 'On-Call'])}
          {input('Date Hired', 'hired', false, 'date')}
        </Section>
        <Section title="Contact & Credentials" desc="How to reach them and their qualification.">
          {input('Phone', 'phone')}
          {input('Email', 'email')}
          {input('Qualification', 'qualification', true)}
        </Section>
      </div>
    </Modal>
  );
}
