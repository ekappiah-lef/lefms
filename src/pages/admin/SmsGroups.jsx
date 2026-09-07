import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { PageHeader, Table, Td, Tr, Modal, Button, IconBtn, Field } from '../../components/ui';
import { api } from '../../api/client';

// A Group is just a name + a list of phone numbers   the recipient list
// an SMS Config rule points at (see SmsConfig.jsx).
export default function SmsGroups() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [showNew, setShowNew] = useState(false);

  const refresh = useCallback(() => {
    setLoading(true);
    api.smsGroups.list().then(setRows).finally(() => setLoading(false));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <div className="space-y-5">
      <PageHeader title="SMS Groups" subtitle="Groups for message sending"
        actions={<Button icon={Plus} onClick={() => setShowNew(true)}>New Group</Button>} />

      <Table headers={['Name', 'Members', 'Created']} empty={loading ? 'Loading…' : 'No groups yet'}>
        {rows.map((g) => (
          <Tr key={g.id} onClick={() => setSelectedId(g.id)}>
            <Td className="font-semibold text-slate-800">{g.name}</Td>
            <Td>{g.memberCount}</Td>
            <Td>{new Date(g.createdAt).toLocaleDateString('en-GB')}</Td>
          </Tr>
        ))}
      </Table>

      {selectedId && <GroupDetail id={selectedId} onClose={() => { setSelectedId(null); refresh(); }} onDeleted={() => { setSelectedId(null); refresh(); }} />}
      {showNew && <NewGroup onClose={() => setShowNew(false)} onCreated={(id) => { setShowNew(false); refresh(); setSelectedId(id); }} />}
    </div>
  );
}

function NewGroup({ onClose, onCreated }) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    setBusy(true); setError('');
    try {
      const { id } = await api.smsGroups.create({ name: name.trim() });
      onCreated(id);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="New SMS Group" subtitle="Add members after creating it"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={!name.trim() || busy}>{busy ? 'Creating…' : 'Create Group'}</Button></>}>
      {error && <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
      <label className="text-[11px] font-semibold text-slate-600">Group Name</label>
      <input value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="e.g. Greater Accra Managers"
        className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary" />
    </Modal>
  );
}

function GroupDetail({ id, onClose, onDeleted }) {
  const [group, setGroup] = useState(null);
  const [name, setName] = useState('');
  const [memberName, setMemberName] = useState('');
  const [memberPhone, setMemberPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = () => api.smsGroups.get(id).then((g) => { setGroup(g); setName(g.name); });
  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!group) return <Modal open onClose={onClose} title="Loading…"><p className="text-sm text-slate-400">Loading…</p></Modal>;

  const renameGroup = async () => {
    if (!name.trim() || name.trim() === group.name) return;
    setBusy(true); setError('');
    try { await api.smsGroups.update(id, { name: name.trim() }); load(); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const addMember = async () => {
    if (!memberName.trim() || !memberPhone.trim()) return;
    setBusy(true); setError('');
    try {
      await api.smsGroups.addMember(id, { name: memberName.trim(), phone: memberPhone.trim() });
      setMemberName(''); setMemberPhone('');
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const removeMember = async (memberId) => {
    setBusy(true);
    try { await api.smsGroups.removeMember(memberId); load(); }
    finally { setBusy(false); }
  };

  const deleteGroup = async () => {
    if (!window.confirm(`Delete "${group.name}"? Any SMS Config rules using it will also be removed.`)) return;
    setBusy(true);
    try { await api.smsGroups.remove(id); onDeleted(); }
    finally { setBusy(false); }
  };

  return (
    <Modal open onClose={onClose} title={group.name} subtitle={`${group.members.length} member${group.members.length === 1 ? '' : 's'}`} width="max-w-xl"
      footer={<><Button variant="danger" onClick={deleteGroup} disabled={busy}>Delete Group</Button><Button variant="ghost" onClick={onClose}>Close</Button></>}>
      {error && <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

      <div className="flex items-end gap-2 mb-5">
        <div className="flex-1">
          <Field label="Group Name" value={
            <input value={name} onChange={(e) => setName(e.target.value)} onBlur={renameGroup}
              className="mt-0.5 w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary" />
          } />
        </div>
      </div>

      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 block">Members</label>
      <div className="space-y-1.5 mb-4 max-h-56 overflow-y-auto">
        {group.members.length === 0 && <p className="text-[13px] text-slate-400">No members yet.</p>}
        {group.members.map((m) => (
          <div key={m.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-[13px]">
            <span className="font-medium text-slate-700">{m.name}</span>
            <span className="text-slate-500">{m.phone}</span>
            <IconBtn icon={Trash2} tone="danger" title="Remove" onClick={() => removeMember(m.id)} />
          </div>
        ))}
      </div>

      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="text-[11px] font-semibold text-slate-600">Name</label>
          <input value={memberName} onChange={(e) => setMemberName(e.target.value)} placeholder="Full name"
            className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div className="flex-1">
          <label className="text-[11px] font-semibold text-slate-600">Phone</label>
          <input value={memberPhone} onChange={(e) => setMemberPhone(e.target.value)} placeholder="0244000000"
            className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <Button onClick={addMember} disabled={!memberName.trim() || !memberPhone.trim() || busy}>Add</Button>
      </div>
    </Modal>
  );
}
