import React, { useState } from 'react';
import { UsersRound, UserCheck, Shield, Plus, Power, Eye } from 'lucide-react';
import { PageHeader, KpiGrid, Kpi, FilterBar, Select, Table, Td, Tr, Badge, Button, Modal, Field, ActionBtn, RowActions, IconBtn, DeleteBtn } from '../../components/ui';
import { ROLES } from '../../config/platform';

function emailFor(name = '') { return name.toLowerCase().replace(/^dr\.?\s+/, '').replace(/[^a-z]+/g, '.').replace(/^\.|\.$/g, '') + '@tbh.gh'; }

export default function SystemUsers({ store }) {
  const { allUsers, employees } = store;
  // seed the account list from the platform users; keep it in local state so
  // we can add / activate / deactivate accounts.
  const [accounts, setAccounts] = useState(() => allUsers.map((u, i) => ({
    id: u.id, name: u.name, role: u.role, department: u.department,
    email: emailFor(u.name), status: 'Active', lastLogin: '2026-07-19 08:0' + (i % 9),
  })));
  const [role, setRole] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [manage, setManage] = useState(null);

  const roles = [...new Set(accounts.map((a) => a.role))];
  const rows = accounts.filter((a) => !role || a.role === role);
  const toggle = (id) => setAccounts((prev) => prev.map((a) => a.id === id ? { ...a, status: a.status === 'Active' ? 'Suspended' : 'Active' } : a));

  return (
    <div className="space-y-5">
      <PageHeader title="Users" subtitle="System accounts linked to employees & roles"
        actions={<Button icon={Plus} onClick={() => setShowAdd(true)}>Add User</Button>} />

      <KpiGrid cols={3}>
        <Kpi title="User Accounts" value={accounts.length} icon={UsersRound} tone="blue" />
        <Kpi title="Active" value={accounts.filter((a) => a.status === 'Active').length} icon={UserCheck} tone="green" />
        <Kpi title="Linked Employees" value={employees.length} icon={Shield} tone="slate" />
      </KpiGrid>

      <FilterBar>
        <Select value={role} onChange={setRole} options={roles} label="All roles" />
      </FilterBar>

      <Table headers={['User', 'Email', 'Role', 'Department', 'Last Login', 'Status', 'Actions']}>
        {rows.map((a) => (
          <Tr key={a.id}>
            <Td><div className="flex items-center gap-2"><div className="h-7 w-7 rounded-full bg-[#0b1c30] text-white flex items-center justify-center text-[10px] font-bold">{a.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}</div><span className="font-medium text-slate-800">{a.name}</span></div></Td>
            <Td>{a.email}</Td>
            <Td>{a.role}</Td>
            <Td>{a.department}</Td>
            <Td>{a.lastLogin}</Td>
            <Td><Badge value={a.status === 'Active' ? 'Active' : 'Overdue'}>{a.status}</Badge></Td>
            <Td>
              <RowActions>
                <IconBtn icon={Eye} title="Manage" onClick={() => setManage(a)} />
                <ActionBtn tone={a.status === 'Active' ? 'outline' : 'success'} icon={Power} onClick={() => toggle(a.id)}>{a.status === 'Active' ? 'Suspend' : 'Activate'}</ActionBtn>
                <DeleteBtn onDelete={() => setAccounts((prev) => prev.filter((x) => x.id !== a.id))} />
              </RowActions>
            </Td>
          </Tr>
        ))}
      </Table>

      {/* Manage user */}
      <Modal open={!!manage} onClose={() => setManage(null)} title={manage?.name} subtitle="Manage account" width="max-w-2xl"
        footer={manage && <><Button variant="ghost" onClick={() => setManage(null)}>Close</Button><Button variant={manage.status === 'Active' ? 'danger' : 'success'} onClick={() => { toggle(manage.id); setManage((m) => ({ ...m, status: m.status === 'Active' ? 'Suspended' : 'Active' })); }}>{manage.status === 'Active' ? 'Suspend account' : 'Activate account'}</Button></>}>
        {manage && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Email" value={manage.email} />
            <Field label="Role" value={manage.role} />
            <Field label="Department" value={manage.department} />
            <Field label="Status" value={<Badge value={manage.status === 'Active' ? 'Active' : 'Overdue'}>{manage.status}</Badge>} />
            <Field label="Last Login" value={manage.lastLogin} />
          </div>
        )}
      </Modal>

      <AddUser open={showAdd} onClose={() => setShowAdd(false)} employees={employees}
        onSave={(u) => { setAccounts((prev) => [u, ...prev]); setShowAdd(false); }} />
    </div>
  );
}

function AddUser({ open, onClose, onSave, employees }) {
  const [f, setF] = useState({ name: '', role: ROLES[0], department: 'OPD', email: '' });
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const save = () => onSave({ id: 'U-' + Math.floor(20 + Math.random() * 900), name: f.name, role: f.role, department: f.department, email: f.email || emailFor(f.name), status: 'Active', lastLogin: '—' });
  return (
    <Modal open={open} onClose={onClose} title="Add User Account" subtitle="Link a login to an employee & role" width="max-w-2xl"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={!f.name}>Create User</Button></>}>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><label className="text-[11px] font-semibold text-slate-600">Employee</label><input list="emps" value={f.name} onChange={(e) => set('name')(e.target.value)} className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0b1c30]" /><datalist id="emps">{employees.map((e) => <option key={e.id} value={e.name} />)}</datalist></div>
        <div><label className="text-[11px] font-semibold text-slate-600">Role</label><div className="mt-1"><Select value={f.role} onChange={set('role')} options={ROLES} /></div></div>
        <div><label className="text-[11px] font-semibold text-slate-600">Department</label><div className="mt-1"><Select value={f.department} onChange={set('department')} options={['OPD', 'Wards', 'Front Desk', 'Maintenance', 'Biomedical', 'Human Resources', 'Finance', 'Laboratory', 'Pharmacy', 'Administration']} /></div></div>
        <div className="col-span-2"><label className="text-[11px] font-semibold text-slate-600">Email (optional)</label><input value={f.email} onChange={(e) => set('email')(e.target.value)} placeholder="auto-generated if blank" className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0b1c30]" /></div>
      </div>
    </Modal>
  );
}
