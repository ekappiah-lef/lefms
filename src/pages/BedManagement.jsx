import React, { useState } from 'react';
import { BedDouble, DoorOpen, Wrench, Sparkles, LayoutGrid, List, Ticket } from 'lucide-react';
import { PageHeader, KpiGrid, Kpi, SectionCard, Table, Td, Tr, Badge, Modal, Button, Field, Select } from '../components/ui';
import { BED_STATUSES } from '../data/mockData';

const BED_TONE = {
  Available: 'bg-emerald-50 text-emerald-700 ring-emerald-200 hover:bg-emerald-100',
  Occupied: 'bg-blue-50 text-blue-700 ring-blue-200 hover:bg-blue-100',
  Reserved: 'bg-amber-50 text-amber-700 ring-amber-200 hover:bg-amber-100',
  Cleaning: 'bg-amber-50 text-amber-600 ring-amber-200 hover:bg-amber-100',
  Maintenance: 'bg-red-50 text-red-700 ring-red-200 hover:bg-red-100',
  Isolation: 'bg-purple-50 text-purple-700 ring-purple-200 hover:bg-purple-100',
  Unavailable: 'bg-slate-100 text-slate-500 ring-slate-200',
};

export default function BedManagement({ store }) {
  const { wards, setWards, setRequests, patients, go } = store;
  const [view, setView] = useState('grid');
  const [sel, setSel] = useState(null); // {wardId, bed}
  const [wardFilter, setWardFilter] = useState('');
  const [pickPatient, setPickPatient] = useState('');

  const beds = wards.flatMap((w) => w.beds);
  const count = (s) => beds.filter((b) => b.status === s).length;
  const occupancy = Math.round((count('Occupied') / beds.length) * 100);

  const setBedStatus = (wardId, bedId, patch) =>
    setWards((prev) => prev.map((w) => w.id !== wardId ? w : { ...w, beds: w.beds.map((b) => b.id === bedId ? { ...b, ...patch } : b) }));

  const raiseTicket = (wardId, b, ward) => {
    const id = 'MR-2026-0' + Math.floor(15 + Math.random() * 80);
    setRequests((prev) => [{ id, dept: 'Wards', location: ward.name.split('—')[0].trim(), room: b.id, bed: b.id, equipment: 'Hospital bed', category: 'Furniture', priority: 'High', reporter: 'Ward Staff', date: '2026-07-19 12:00', status: 'Submitted', description: `Fault reported on bed ${b.id}`, assignedTo: '' }, ...prev]);
    setBedStatus(wardId, b.id, { status: 'Maintenance', ticket: id, patient: null });
    setSel(null);
    go('requests');
  };

  const shownWards = wards.filter((w) => !wardFilter || w.name === wardFilter);

  return (
    <div className="space-y-5">
      <PageHeader title="Bed Management" subtitle="Hospital → Building → Floor → Ward → Room → Bed"
        actions={
          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            <button onClick={() => setView('grid')} className={`px-3 py-2 text-sm font-semibold flex items-center gap-1.5 ${view === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600'}`}><LayoutGrid className="h-4 w-4" />Layout</button>
            <button onClick={() => setView('table')} className={`px-3 py-2 text-sm font-semibold flex items-center gap-1.5 ${view === 'table' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600'}`}><List className="h-4 w-4" />Table</button>
          </div>
        } />

      <KpiGrid cols={5}>
        <Kpi title="Total Beds" value={beds.length} icon={BedDouble} tone="slate" />
        <Kpi title="Available" value={count('Available')} icon={DoorOpen} tone="green" />
        <Kpi title="Occupancy" value={`${occupancy}%`} icon={BedDouble} tone="blue" />
        <Kpi title="Under Maintenance" value={count('Maintenance')} icon={Wrench} tone="red" />
        <Kpi title="Awaiting Cleaning" value={count('Cleaning')} icon={Sparkles} tone="amber" />
      </KpiGrid>

      <div className="flex flex-wrap items-center gap-3">
        <Select value={wardFilter} onChange={setWardFilter} options={wards.map((w) => w.name)} label="All wards" />
        <div className="flex flex-wrap gap-2 text-[11px]">
          {BED_STATUSES.map((s) => (
            <span key={s} className={`px-2 py-0.5 rounded ring-1 font-semibold ${BED_TONE[s]}`}>{s}</span>
          ))}
        </div>
      </div>

      {view === 'grid' ? (
        <div className="space-y-4">
          {shownWards.map((w) => (
            <SectionCard key={w.id} title={w.name} action={<span className="text-[11px] text-slate-500">{w.building} · {w.floor} · {w.staffOnDuty} staff</span>}>
              <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-10 gap-2">
                {w.beds.map((b) => (
                  <button key={b.id} onClick={() => setSel({ wardId: w.id, ward: w, bed: b })}
                    className={`rounded-lg ring-1 p-2 text-center transition-colors ${BED_TONE[b.status]}`}>
                    <div className="text-[12px] font-bold">{b.id}</div>
                    <div className="text-[9px] font-medium truncate">{b.patient || b.status}</div>
                  </button>
                ))}
              </div>
            </SectionCard>
          ))}
        </div>
      ) : (
        <Table headers={['Bed', 'Ward', 'Building', 'Floor', 'Status', 'Patient / Note', 'Ticket', '']}>
          {shownWards.flatMap((w) => w.beds.map((b) => (
            <Tr key={w.id + b.id} onClick={() => setSel({ wardId: w.id, ward: w, bed: b })}>
              <Td className="font-semibold text-slate-800">{b.id}</Td>
              <Td>{w.name.split('—')[0].trim()}</Td>
              <Td>{w.building}</Td>
              <Td>{w.floor}</Td>
              <Td><Badge value={b.status} /></Td>
              <Td>{b.patient || '—'}</Td>
              <Td>{b.ticket || '—'}</Td>
              <Td><span className="text-[11px] font-semibold text-blue-600">Manage</span></Td>
            </Tr>
          )))}
        </Table>
      )}

      {/* Bed detail / actions */}
      <Modal open={!!sel} onClose={() => setSel(null)} width="max-w-lg"
        title={sel ? `Bed ${sel.bed.id}` : ''} subtitle={sel ? `${sel.ward.name}` : ''}>
        {sel && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Status" value={<Badge value={sel.bed.status} />} />
              <Field label="Patient / Note" value={sel.bed.patient} />
              <Field label="Ward" value={sel.ward.name} />
              <Field label="Location" value={`${sel.ward.building} · ${sel.ward.floor}`} />
              {sel.bed.ticket && <Field label="Linked Ticket" value={sel.bed.ticket} />}
            </div>
            <div className="border-t border-slate-100 pt-3">
              {sel.bed.status === 'Available' && (
                <div className="mb-3">
                  <label className="text-[11px] font-semibold text-slate-600">Select patient (from Patient Records)</label>
                  <div className="mt-1"><Select value={pickPatient} onChange={setPickPatient} options={patients.map((p) => `${p.id} — ${p.name}`)} label="Choose a registered patient…" /></div>
                </div>
              )}
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Actions</div>
              <div className="flex flex-wrap gap-2">
                {sel.bed.status !== 'Available' && <Button variant="success" onClick={() => { setBedStatus(sel.wardId, sel.bed.id, { status: 'Available', patient: null, ticket: undefined }); setSel(null); }}>Release Bed</Button>}
                {sel.bed.status === 'Available' && <Button disabled={!pickPatient} onClick={() => { setBedStatus(sel.wardId, sel.bed.id, { status: 'Occupied', patient: pickPatient.split(' — ')[1] || pickPatient }); setSel(null); setPickPatient(''); }}>Allocate Patient</Button>}
                {sel.bed.status === 'Available' && <Button variant="ghost" disabled={!pickPatient} onClick={() => { setBedStatus(sel.wardId, sel.bed.id, { status: 'Reserved', patient: 'Reserved: ' + (pickPatient.split(' — ')[1] || pickPatient) }); setSel(null); setPickPatient(''); }}>Reserve</Button>}
                {sel.bed.status !== 'Cleaning' && sel.bed.status !== 'Available' && <Button variant="ghost" icon={Sparkles} onClick={() => { setBedStatus(sel.wardId, sel.bed.id, { status: 'Cleaning', patient: null }); setSel(null); }}>Mark for Cleaning</Button>}
                {sel.bed.status !== 'Maintenance' && <Button variant="danger" icon={Ticket} onClick={() => raiseTicket(sel.wardId, sel.bed, sel.ward)}>Report Fault → Ticket</Button>}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
