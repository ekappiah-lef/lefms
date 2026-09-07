import React, { useEffect, useState } from 'react';
import { UsersRound, Plus, Eye, Pencil } from 'lucide-react';
import { PageHeader, KpiGrid, Kpi, Tabs, Table, Td, Tr, Badge, Modal, Button, Select, Field, RowActions, IconBtn, DeleteBtn, Pagination, pageSlice } from '../../components/ui';
import { api } from '../../api/client';

const REGION_SCOPED_ROLES = ['Supervisor', 'Engineer'];

export default function Users() {
  const [rows, setRows] = useState([]);
  const [roles, setRoles] = useState([]);
  const [regions, setRegions] = useState([]);
  const [tab, setTab] = useState('All Users');
  const [showNew, setShowNew] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [editing, setEditing] = useState(null);
  const [page, setPage] = useState(1);

  const refresh = () => api.users.list().then(setRows);
  useEffect(() => { refresh(); api.regions().then(setRegions); api.roles().then(setRoles); }, []);
  useEffect(() => { setPage(1); }, [tab]);

  const toggleActive = async (u) => { await api.users.update(u.id, { isActive: !u.isActive }); refresh(); };

  const remove = async (u) => {
    try {
      await api.users.remove(u.id);
      refresh();
    } catch (e) {
      window.alert(e.message);
    }
  };

  const visible = tab === 'Engineers / Field Users' ? rows.filter((u) => u.role === 'Engineer') : rows;

  return (
    <div className="space-y-5">
      <PageHeader title="Users" subtitle="Administrators, supervisors, engineers and other staff with access to this system"
        actions={<Button icon={Plus} onClick={() => setShowNew(true)}>New User</Button>} />

      <KpiGrid cols={4}>
        <Kpi title="Total Users" value={rows.length} icon={UsersRound} />
        <Kpi title="Engineers" value={rows.filter((u) => u.role === 'Engineer').length} icon={UsersRound} />
        <Kpi title="Supervisors" value={rows.filter((u) => u.role === 'Supervisor').length} icon={UsersRound} />
        <Kpi title="Active" value={rows.filter((u) => u.isActive).length} icon={UsersRound} />
      </KpiGrid>

      <Tabs tabs={['All Users', 'Engineers / Field Users']} active={tab} onChange={setTab} />

      <Table headers={['Staff No.', 'Name', 'Email', 'Role', 'Region', 'Status', 'Last Login', 'Actions']}>
        {pageSlice(visible, page).map((u) => (
          <Tr key={u.id}>
            <Td className="font-semibold text-slate-800">{u.staffNo}</Td>
            <Td className="font-medium">{u.fullName}</Td>
            <Td>{u.email}</Td>
            <Td>{u.role}</Td>
            <Td>{u.regionName || ' '}</Td>
            <Td>
              <button onClick={() => toggleActive(u)}>
                <Badge tone={u.isActive ? 'green' : 'slate'}>{u.isActive ? 'Active' : 'Deactivated'}</Badge>
              </button>
            </Td>
            <Td>{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('en-GB') : 'Never'}</Td>
            <Td>
              <RowActions>
                <IconBtn icon={Eye} title="View" onClick={() => setViewing(u)} />
                <IconBtn icon={Pencil} title="Edit" onClick={() => setEditing(u)} />
                <DeleteBtn label={`Delete ${u.fullName}? This cannot be undone.`} onDelete={() => remove(u)} />
              </RowActions>
            </Td>
          </Tr>
        ))}
      </Table>
      <Pagination page={page} setPage={setPage} total={visible.length} />

      {showNew && <NewUser roles={roles} regions={regions} onClose={() => setShowNew(false)} onCreated={() => { setShowNew(false); refresh(); }} />}
      {viewing && <ViewUser user={viewing} onClose={() => setViewing(null)} />}
      {editing && <EditUser user={editing} roles={roles} regions={regions} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refresh(); }} />}
    </div>
  );
}

function ViewUser({ user, onClose }) {
  return (
    <Modal open onClose={onClose} title={user.fullName} subtitle={user.staffNo}
      footer={<Button variant="ghost" onClick={onClose}>Close</Button>}>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Staff No." value={user.staffNo} />
        <Field label="Role" value={user.role} />
        <Field label="Email" value={user.email} />
        <Field label="Phone" value={user.phone} />
        <Field label="Region" value={user.regionName} />
        <Field label="Status" value={user.isActive ? 'Active' : 'Deactivated'} />
        <Field label="Last Login" value={user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('en-GB') : 'Never'} />
        <Field label="Created" value={user.createdAt ? new Date(user.createdAt).toLocaleString('en-GB') : ' '} />
      </div>
    </Modal>
  );
}

function NewUser({ roles, regions, onClose, onCreated }) {
  const [f, setF] = useState({ staffNo: '', fullName: '', email: '', phone: '', password: '', roleId: roles[0]?.id || '', regionId: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));

  const roleName = roles.find((r) => String(r.id) === String(f.roleId))?.name;
  const needsRegion = REGION_SCOPED_ROLES.includes(roleName);
  const canSave = f.staffNo && f.fullName && f.email && f.password && f.roleId && (!needsRegion || f.regionId);

  const save = async () => {
    setBusy(true); setError('');
    try {
      await api.users.create({ ...f, roleId: Number(f.roleId), regionId: f.regionId ? Number(f.regionId) : null });
      onCreated();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="New User"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={!canSave || busy}>{busy ? 'Creating…' : 'Create User'}</Button></>}>
      {error && <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-[11px] font-semibold text-slate-600">Staff No.</label><input value={f.staffNo} onChange={(e) => set('staffNo')(e.target.value)} className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary" /></div>
        <div><label className="text-[11px] font-semibold text-slate-600">Full Name</label><input value={f.fullName} onChange={(e) => set('fullName')(e.target.value)} className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary" /></div>
        <div><label className="text-[11px] font-semibold text-slate-600">Email</label><input type="email" value={f.email} onChange={(e) => set('email')(e.target.value)} className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary" /></div>
        <div><label className="text-[11px] font-semibold text-slate-600">Phone</label><input value={f.phone} onChange={(e) => set('phone')(e.target.value)} className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary" /></div>
        <div><label className="text-[11px] font-semibold text-slate-600">Temporary Password</label><input value={f.password} onChange={(e) => set('password')(e.target.value)} className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary" /></div>
        <div><label className="text-[11px] font-semibold text-slate-600">Role</label><div className="mt-1"><Select value={String(f.roleId)} onChange={(v) => set('roleId')(v)} options={roles.map((r) => ({ value: String(r.id), label: r.name }))} /></div></div>
        {needsRegion && <div><label className="text-[11px] font-semibold text-slate-600">Region</label><div className="mt-1"><Select value={f.regionId} onChange={set('regionId')} options={regions.map((r) => ({ value: String(r.id), label: r.name }))} label="Select region" /></div></div>}
      </div>
    </Modal>
  );
}

function EditUser({ user, roles, regions, onClose, onSaved }) {
  const [f, setF] = useState({
    fullName: user.fullName, email: user.email, phone: user.phone || '', password: '',
    roleId: String(user.roleId), regionId: user.regionId ? String(user.regionId) : '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));

  const roleName = roles.find((r) => String(r.id) === String(f.roleId))?.name;
  const needsRegion = REGION_SCOPED_ROLES.includes(roleName);
  const canSave = f.fullName && f.email && f.roleId && (!needsRegion || f.regionId);

  const save = async () => {
    setBusy(true); setError('');
    try {
      await api.users.update(user.id, {
        fullName: f.fullName, email: f.email, phone: f.phone || null,
        roleId: Number(f.roleId), regionId: f.regionId ? Number(f.regionId) : null,
        ...(f.password ? { password: f.password } : {}),
      });
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={`Edit ${user.fullName}`} subtitle={user.staffNo}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={!canSave || busy}>{busy ? 'Saving…' : 'Save Changes'}</Button></>}>
      {error && <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-[11px] font-semibold text-slate-600">Full Name</label><input value={f.fullName} onChange={(e) => set('fullName')(e.target.value)} className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary" /></div>
        <div><label className="text-[11px] font-semibold text-slate-600">Email</label><input type="email" value={f.email} onChange={(e) => set('email')(e.target.value)} className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary" /></div>
        <div><label className="text-[11px] font-semibold text-slate-600">Phone</label><input value={f.phone} onChange={(e) => set('phone')(e.target.value)} className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary" /></div>
        <div><label className="text-[11px] font-semibold text-slate-600">New Password (optional)</label><input value={f.password} onChange={(e) => set('password')(e.target.value)} placeholder="Leave blank to keep current" className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary" /></div>
        <div><label className="text-[11px] font-semibold text-slate-600">Role</label><div className="mt-1"><Select value={String(f.roleId)} onChange={(v) => set('roleId')(v)} options={roles.map((r) => ({ value: String(r.id), label: r.name }))} /></div></div>
        {needsRegion && <div><label className="text-[11px] font-semibold text-slate-600">Region</label><div className="mt-1"><Select value={f.regionId} onChange={set('regionId')} options={regions.map((r) => ({ value: String(r.id), label: r.name }))} label="Select region" /></div></div>}
      </div>
    </Modal>
  );
}
