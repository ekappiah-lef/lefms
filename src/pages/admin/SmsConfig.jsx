import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { PageHeader, Table, Td, Tr, Badge, Modal, Button, Select, IconBtn } from '../../components/ui';
import { api } from '../../api/client';

const EVENT_LABEL = { wo_high_critical: 'High / Critical Work Order Created', wo_pending: 'Work Order Pending 10+ Days' };

// Which Group gets texted for which event, optionally scoped to one
// region (e.g. a group that only wants Greater Accra work orders).
export default function SmsConfig() {
  const [rows, setRows] = useState([]);
  const [groups, setGroups] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);

  const refresh = useCallback(() => {
    setLoading(true);
    api.smsConfigs.list().then(setRows).finally(() => setLoading(false));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { api.smsGroups.list().then(setGroups); api.regions().then(setRegions); }, []);

  const toggleActive = async (row) => {
    await api.smsConfigs.update(row.id, { isActive: !row.isActive });
    refresh();
  };

  const remove = async (row) => {
    if (!window.confirm(`Remove this SMS Config rule?`)) return;
    await api.smsConfigs.remove(row.id);
    refresh();
  };

  return (
    <div className="space-y-5">
      <PageHeader title="SMS Config" subtitle="Send SMS to Special Groups for certain events"
        actions={<Button icon={Plus} onClick={() => setShowNew(true)} disabled={!groups.length}>New Rule</Button>} />

      {!groups.length && !loading && (
        <p className="text-sm text-slate-500">Create an SMS Group first.</p>
      )}

      <Table headers={['Event', 'Group', 'Region', 'Active', '']} empty={loading ? 'Loading…' : 'No SMS Config rules yet'}>
        {rows.map((r) => (
          <Tr key={r.id}>
            <Td className="font-medium">{EVENT_LABEL[r.eventType] || r.eventType}</Td>
            <Td>{r.groupName}</Td>
            <Td>{r.regionName || <span className="text-slate-400">All regions</span>}</Td>
            <Td>
              <button onClick={() => toggleActive(r)}>
                <Badge tone={r.isActive ? 'green' : 'slate'}>{r.isActive ? 'Active' : 'Inactive'}</Badge>
              </button>
            </Td>
            <Td><IconBtn icon={Trash2} tone="danger" title="Remove" onClick={() => remove(r)} /></Td>
          </Tr>
        ))}
      </Table>

      {showNew && (
        <NewConfig groups={groups} regions={regions} onClose={() => setShowNew(false)} onCreated={() => { setShowNew(false); refresh(); }} />
      )}
    </div>
  );
}

function NewConfig({ groups, regions, onClose, onCreated }) {
  const [eventType, setEventType] = useState('wo_high_critical');
  const [groupId, setGroupId] = useState('');
  const [regionId, setRegionId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    setBusy(true); setError('');
    try {
      await api.smsConfigs.create({ eventType, groupId: Number(groupId), regionId: regionId ? Number(regionId) : null });
      onCreated();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="New SMS Config Rule"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={!groupId || busy}>{busy ? 'Creating…' : 'Create Rule'}</Button></>}>
      {error && <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
      <div className="space-y-3">
        <div>
          <label className="text-[11px] font-semibold text-slate-600">Event</label>
          <div className="mt-1"><Select value={eventType} onChange={setEventType} options={Object.entries(EVENT_LABEL).map(([value, label]) => ({ value, label }))} /></div>
        </div>
        <div>
          <label className="text-[11px] font-semibold text-slate-600">Group</label>
          <div className="mt-1"><Select value={groupId} onChange={setGroupId} options={groups.map((g) => ({ value: String(g.id), label: `${g.name} (${g.memberCount} member${g.memberCount === 1 ? '' : 's'})` }))} label="Select group" /></div>
        </div>
        <div>
          <label className="text-[11px] font-semibold text-slate-600">Region (optional)</label>
          <div className="mt-1"><Select value={regionId} onChange={setRegionId} options={regions.map((r) => ({ value: String(r.id), label: r.name }))} label="All regions" /></div>
          <p className="text-[11px] text-slate-400 mt-1">Leave as "All regions" to alert this group for every region's work orders.</p>
        </div>
      </div>
    </Modal>
  );
}
