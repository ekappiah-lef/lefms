import React, { useEffect, useState, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader, Table, Td, Tr, Badge, Modal, Button, Select, IconBtn, DeleteBtn } from '../../components/ui';
import { api } from '../../api/client';

const LEVEL_OPTIONS = [
  { value: '', label: 'No access' },
  { value: 'view', label: 'View only' },
  { value: 'manage', label: 'Manage' },
];

// Roles are named bundles of module permissions   the 6 built-in roles
// (System) plus whatever custom ones an Administrator creates here (e.g.
// "NOC Engineer"). Every page in the app is governed by this except the
// Users and Roles admin pages themselves, which stay Administrator-only
// by design (a role should never be able to grant itself more access).
export default function Roles() {
  const [roles, setRoles] = useState([]);
  const [modules, setModules] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    Promise.all([api.roles(), api.rolesAdmin.modules()]).then(([r, m]) => { setRoles(r); setModules(m); }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const remove = async (role) => {
    try { await api.rolesAdmin.remove(role.id); refresh(); }
    catch (e) { window.alert(e.message); }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Roles" subtitle="What each role can see and do, page by page   click a role to configure it"
        actions={<Button icon={Plus} onClick={() => setShowNew(true)}>New Role</Button>} />

      <Table headers={['Role', 'Type', '']} empty={loading ? 'Loading…' : 'No roles found'}>
        {roles.map((r) => (
          <Tr key={r.id} onClick={() => setEditing(r)}>
            <Td className="font-semibold text-slate-800">{r.name}</Td>
            <Td><Badge tone={r.isSystem ? 'slate' : 'blue'}>{r.isSystem ? 'System' : 'Custom'}</Badge></Td>
            <Td onClick={(e) => e.stopPropagation()}>
              {!r.isSystem && <DeleteBtn label={`Delete role "${r.name}"? Users must be reassigned first.`} onDelete={() => remove(r)} />}
            </Td>
          </Tr>
        ))}
      </Table>

      {showNew && <NewRole onClose={() => setShowNew(false)} onCreated={(role) => { setShowNew(false); refresh(); setEditing(role); }} />}
      {editing && <EditPermissions role={editing} modules={modules} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refresh(); }} />}
    </div>
  );
}

function NewRole({ onClose, onCreated }) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    setBusy(true); setError('');
    try {
      const role = await api.rolesAdmin.create(name.trim());
      onCreated({ id: role.id, name: role.name, isSystem: false });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="New Role" subtitle="Give it a name, then choose what it can access"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={!name.trim() || busy}>{busy ? 'Creating…' : 'Create Role'}</Button></>}>
      {error && <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
      <label className="text-[11px] font-semibold text-slate-600">Role Name</label>
      <input value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="e.g. NOC Engineer"
        className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary" />
    </Modal>
  );
}

function EditPermissions({ role, modules, onClose, onSaved }) {
  const [perms, setPerms] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const isMsUser = role.name === 'MS User';
  const isAdministrator = role.name === 'Administrator';

  useEffect(() => { api.rolesAdmin.permissions(role.id).then(setPerms); }, [role.id]);

  const setLevel = (moduleId, level) => setPerms((p) => ({ ...p, [moduleId]: level || undefined }));

  const save = async () => {
    setBusy(true); setError('');
    try {
      await api.rolesAdmin.setPermissions(role.id, perms);
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const groups = [];
  for (const m of modules) {
    let g = groups.find((x) => x.name === m.group);
    if (!g) { g = { name: m.group, items: [] }; groups.push(g); }
    g.items.push(m);
  }

  return (
    <Modal open onClose={onClose} title={role.name} subtitle={role.isSystem ? 'Built-in role' : 'Custom role'} width="max-w-2xl"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={!perms || busy || isAdministrator}>{busy ? 'Saving…' : 'Save Permissions'}</Button></>}>
      {error && <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

      {isAdministrator && (
        <p className="text-[13px] text-slate-500 mb-4 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5">Administrator always has full access to everything   its permissions can't be changed.</p>
      )}
      {isMsUser && !isAdministrator && (
        <p className="text-[13px] text-slate-500 mb-4 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5">MS User is always read-only   "Manage" isn't available for this role.</p>
      )}

      {!perms || isAdministrator ? null : (
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {groups.map((g) => (
            <div key={g.name}>
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5">{g.name}</div>
              <div className="space-y-2">
                {g.items.map((m) => (
                  <div key={m.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2.5">
                    <span className="text-[13px] font-medium text-slate-700">{m.label}</span>
                    <div className="w-40">
                      <Select value={perms[m.id] || ''} onChange={(v) => setLevel(m.id, v)}
                        options={isMsUser ? LEVEL_OPTIONS.filter((o) => o.value !== 'manage') : LEVEL_OPTIONS} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
