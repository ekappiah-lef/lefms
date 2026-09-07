import React, { useEffect, useState } from 'react';
import { BackLink, PageHeader, Button, Select, Textarea } from '../components/ui';
import { api } from '../api/client';

const TITLE_BY_TYPE = { CM: 'Corrective Maintenance', PM: 'Preventive Maintenance', PLM: 'Planned Maintenance' };
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical', 'Emergency'];

const FieldLabel = ({ children }) => <label className="text-[11px] font-semibold text-slate-600">{children}</label>;
const TextInput = (props) => <input {...props} className="mt-1 w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary" />;
// Auto-populated fields are still their own individually-boxed text
// input, just read-only/greyed   not a bare label+value like elsewhere
// in the app   so every field on this form reads as one consistent kind
// of input, per the attached design.
const ReadOnlyInput = ({ label, value }) => (
  <div>
    <FieldLabel>{label}</FieldLabel>
    <input value={value || ''} readOnly tabIndex={-1}
      className="mt-1 w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-600 cursor-default" />
  </div>
);

// type is always 'work_order' here; woType (CM/PM/PLM) drives which
// extra fields show. Site selection auto-populates Site ID/Region/
// Location/Priority/Assigned Engineer from the Site Database   the user
// never re-types information the Site Database already holds.
export default function CreateTicketPage({ woType, onCancel, onCreated }) {
  const [sites, setSites] = useState([]);
  const [assets, setAssets] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [f, setF] = useState({
    siteId: '', assetId: '', title: '', description: '', priority: 'Medium', engineerId: '',
    frequency: 'Monthly', nextDue: '', lastDone: '', plannedDate: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { api.sites.list().then(setSites); api.users.engineers().then(setEngineers); }, []);

  const site = sites.find((s) => String(s.id) === f.siteId);

  useEffect(() => {
    if (!f.siteId) { setAssets([]); return; }
    api.assets.list({ site: f.siteId }).then(setAssets);
    if (site?.assignedEngineerId) setF((s) => ({ ...s, engineerId: String(site.assignedEngineerId) }));
  }, [f.siteId]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));

  const canSave = f.siteId && f.title && f.description && f.engineerId
    && (woType !== 'PM' || f.nextDue)
    && (woType !== 'PLM' || f.plannedDate);

  const save = async () => {
    setBusy(true); setError('');
    try {
      const { id } = await api.workOrders.create({
        woType, siteId: Number(f.siteId), assetId: f.assetId ? Number(f.assetId) : null,
        title: f.title, description: f.description, priority: f.priority, engineerId: Number(f.engineerId),
        ...(woType === 'PM' ? { frequency: f.frequency, nextDue: f.nextDue, lastDone: f.lastDone || null } : {}),
        ...(woType === 'PLM' ? { plannedDate: f.plannedDate } : {}),
      });
      onCreated(id);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <BackLink onClick={onCancel}>Cancel</BackLink>
      <PageHeader title={`New ${TITLE_BY_TYPE[woType]} Work Order`} subtitle="Create a new work order" />

      {error && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">{error}</div>}

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-7">
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-5">
          <div>
            <FieldLabel>Site Name or Site</FieldLabel>
            <div className="mt-1"><Select value={f.siteId} onChange={set('siteId')} options={sites.map((s) => ({ value: String(s.id), label: `${s.siteCode}   ${s.name}` }))} label="Select site" /></div>
          </div>
          <ReadOnlyInput label="Site ID" value={site?.siteCode} />
        </div>

        {site && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
            <ReadOnlyInput label="Location" value={site.location} />
            <ReadOnlyInput label="Region" value={site.regionName} />
            <ReadOnlyInput label="Site Priority" value={site.priority} />
          </div>
        )}

        <div className="mt-6">
          <FieldLabel>Title</FieldLabel>
          <TextInput value={f.title} onChange={(e) => set('title')(e.target.value)} placeholder="Short summary" />
        </div>

        <div className="mt-5">
          <FieldLabel>Description</FieldLabel>
          <div className="mt-1"><Textarea value={f.description} onChange={set('description')} rows={5} placeholder="Issue description…" /></div>
        </div>

        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-5 mt-5">
          <div>
            <FieldLabel>Asset (Generator / AC)</FieldLabel>
            <div className="mt-1"><Select value={f.assetId} onChange={set('assetId')} options={assets.map((a) => ({ value: String(a.id), label: `${a.tag}   ${a.name}` }))} label="No specific asset" /></div>
          </div>

          {woType === 'CM' && (
            <div>
              <FieldLabel>Priority</FieldLabel>
              <div className="mt-1"><Select value={f.priority} onChange={set('priority')} options={PRIORITIES} /></div>
            </div>
          )}
          {woType === 'PM' && (
            <div>
              <FieldLabel>Next Due</FieldLabel>
              <TextInput type="date" value={f.nextDue} onChange={(e) => set('nextDue')(e.target.value)} />
            </div>
          )}
          {woType === 'PLM' && (
            <div>
              <FieldLabel>Planned Date</FieldLabel>
              <TextInput type="date" value={f.plannedDate} onChange={(e) => set('plannedDate')(e.target.value)} />
            </div>
          )}
        </div>

        <div className="mt-5">
          <FieldLabel>Assigned Engineer</FieldLabel>
          <div className="mt-1"><Select value={f.engineerId} onChange={set('engineerId')} options={engineers.map((e) => ({ value: String(e.id), label: e.fullName }))} label="Select engineer" /></div>
        </div>

      
        <p className="text-[12px] text-slate-400 mt-2">An EHS record is created automatically and must be submitted by the engineer before this work order can be completed.</p>

        <div className="flex justify-center gap-2 mt-7 pt-6 border-t border-slate-100">
          <Button  style={{ backgroundColor: '#5e695c' }} onClick={save} disabled={!canSave || busy}>{busy ? 'Creating…' : `Create ${TITLE_BY_TYPE[woType]}`}</Button>
          <Button variant="danger" onClick={onCancel}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}
