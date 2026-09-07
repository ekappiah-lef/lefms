import React, { useEffect, useState } from 'react';
import { BackLink, PageHeader, Button, Select, Textarea } from '../components/ui';
import { api } from '../api/client';
import { resize } from 'motion';

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical', 'Emergency'];

const FieldLabel = ({ children }) => <label className="text-[11px] font-semibold text-slate-600">{children}</label>;
const TextInput = (props) => <input {...props} className="mt-1 w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary" />;
const ReadOnlyInput = ({ label, value }) => (
  <div>
    <FieldLabel>{label}</FieldLabel>
    <input value={value || ''} readOnly tabIndex={-1}
      className="mt-1 w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-600 cursor-default" />
  </div>
);

// A Trouble Ticket precedes a Work Order   it holds the same site/asset/
// description/priority information, but no woType, EHS or Spare Parts
// yet (those only start once "Create Work Order" turns it into one).
export default function CreateTroubleTicketPage({ onCancel, onCreated }) {
  const [sites, setSites] = useState([]);
  const [assets, setAssets] = useState([]);
  const [f, setF] = useState({ siteId: '', assetId: '', title: '', description: '', priority: 'Medium' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { api.sites.list().then(setSites); }, []);

  const site = sites.find((s) => String(s.id) === f.siteId);

  useEffect(() => {
    if (!f.siteId) { setAssets([]); return; }
    api.assets.list({ site: f.siteId }).then(setAssets);
  }, [f.siteId]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const canSave = f.siteId && f.title && f.description;

  const save = async () => {
    setBusy(true); setError('');
    try {
      const { id } = await api.troubleTickets.create({
        siteId: Number(f.siteId), assetId: f.assetId ? Number(f.assetId) : null,
        title: f.title, description: f.description, priority: f.priority,
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
      <PageHeader title="New Trouble Ticket" subtitle="Raise a fault before a Work Order is created" />

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
          <div className="mt-1"><Textarea   value={f.description} onChange={set('description')} rows={5} placeholder="Description of Issue…" /></div>
        </div>

        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-5 mt-5">
          <div>
            <FieldLabel>Asset (Generator / AC)</FieldLabel>
            <div className="mt-1"><Select value={f.assetId} onChange={set('assetId')} options={assets.map((a) => ({ value: String(a.id), label: `${a.tag}   ${a.name}` }))} label="No specific asset" /></div>
          </div>
          <div>
            <FieldLabel>Priority</FieldLabel>
            <div className="mt-1"><Select value={f.priority} onChange={set('priority')} options={PRIORITIES} /></div>
          </div>
        </div>


        <div className="flex justify-center gap-2 mt-7 pt-6 border-t border-slate-100">
          <Button  style={{ backgroundColor: '#5e695c' }} onClick={save} disabled={!canSave || busy}>{busy ? 'Creating…' : 'Create Trouble Ticket'}</Button>
          <Button variant="danger" onClick={onCancel}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}
