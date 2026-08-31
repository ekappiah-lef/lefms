import React, { useState } from 'react';
import { FileText, Droplet, Dna, Wallet, Activity, Pill, FlaskConical, BedDouble, CalendarClock, UserPlus } from 'lucide-react';
import { PageHeader, KpiGrid, Kpi, FilterBar, Table, Td, Tr, Badge, Modal, Tabs, Field, IconBtn, Button, RowActions, DeleteBtn } from '../components/ui';
import NewPatientModal from '../components/NewPatientModal';
import { PATIENT_BIO } from '../data/extraData';

// Build the cross-department 360 view for a patient from the live store.
function build360(store, p) {
  // Prefer the bio lookup; fall back to fields captured at registration.
  const bio = PATIENT_BIO[p.id] || { bloodGroup: p.bloodGroup, genotype: p.genotype, nationalId: p.nationalId };
  const appts = store.appointments.filter((a) => a.patientId === p.id || a.patient === p.name);
  const labs = store.labOrders.filter((l) => l.patientId === p.id || l.patient === p.name);
  const rx = store.prescriptions.filter((r) => r.patientId === p.id || r.patient === p.name);
  const adms = store.admissions.filter((a) => a.patientId === p.id || a.patient === p.name);
  const invoices = store.invoices.filter((i) => i.patientId === p.id || i.patient === p.name);
  const outstanding = invoices.filter((i) => i.status !== 'Paid').reduce((s, i) => s + i.total, 0);
  return { bio, appts, labs, rx, adms, invoices, outstanding };
}

export default function PatientRecords({ store }) {
  const { patients, addPatient, setPatients, go } = store;
  const [search, setSearch] = useState('');
  const [sel, setSel] = useState(null);
  const [showNew, setShowNew] = useState(false);

  const rows = patients.filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase()) || p.phone.includes(search));
  const withOutstanding = patients.filter((p) => build360(store, p).outstanding > 0).length;

  return (
    <div className="space-y-5">
      <PageHeader title="Patient Records" subtitle="Master patient index — bio-data & cross-department history"
        actions={<Button icon={UserPlus} onClick={() => setShowNew(true)}>New Patient Record</Button>} />

      <KpiGrid cols={4}>
        <Kpi title="Registered Patients" value={patients.length} icon={FileText} tone="blue" />
        <Kpi title="With Bio-Data" value={patients.filter((p) => PATIENT_BIO[p.id]).length} icon={Droplet} tone="green" />
        <Kpi title="Pending Payment" value={withOutstanding} icon={Wallet} tone="amber" />
        <Kpi title="Active Insurance" value={patients.filter((p) => (p.insurance || '').includes('Active')).length} icon={Activity} tone="blue" />
      </KpiGrid>

      <FilterBar search={search} onSearch={setSearch} placeholder="Search by name, hospital ID or phone…" />

      <Table headers={['Hospital ID', 'Name', 'Age/Sex', 'Blood', 'Genotype', 'Phone', 'Insurance', 'Balance', '']}>
        {rows.map((p) => {
          const bio = PATIENT_BIO[p.id] || { bloodGroup: p.bloodGroup, genotype: p.genotype };
          const { outstanding } = build360(store, p);
          return (
            <Tr key={p.id} onClick={() => setSel(p)}>
              <Td className="font-semibold text-slate-800">{p.id}</Td>
              <Td className="font-medium">{p.name}</Td>
              <Td>{age(p.dob)} / {p.gender?.[0]}</Td>
              <Td>{bio.bloodGroup || '—'}</Td>
              <Td>{bio.genotype || '—'}</Td>
              <Td>{p.phone}</Td>
              <Td>{p.insurance}</Td>
              <Td>{outstanding > 0 ? <Badge tone="amber">GHS {outstanding}</Badge> : <Badge tone="green">Settled</Badge>}</Td>
              <Td onClick={(e) => e.stopPropagation()}><RowActions><IconBtn icon={FileText} title="Open record" onClick={() => setSel(p)} /><DeleteBtn onDelete={() => setPatients((prev) => prev.filter((x) => x.id !== p.id))} /></RowActions></Td>
            </Tr>
          );
        })}
      </Table>

      <RecordModal patient={sel} store={store} onClose={() => setSel(null)} go={go} />
      <NewPatientModal open={showNew} onClose={() => setShowNew(false)} onSave={(p) => { addPatient(p); setShowNew(false); }} />
    </div>
  );
}

function RecordModal({ patient, store, onClose, go }) {
  const [tab, setTab] = useState('Bio-Data');
  if (!patient) return null;
  const { bio, appts, labs, rx, adms, invoices, outstanding } = build360(store, patient);
  const tabs = ['Bio-Data', 'Visits & Admissions', 'Laboratory', 'Pharmacy', 'Billing'];

  return (
    <Modal open={!!patient} onClose={onClose} width="max-w-4xl"
      title={patient.name} subtitle={`${patient.id} · ${patient.gender} · ${age(patient.dob)} yrs`}>
      {/* identity banner */}
      <div className="flex flex-wrap gap-2 mb-4">
        {bio.bloodGroup && <span className="inline-flex items-center gap-1 rounded-full bg-red-50 text-red-700 ring-1 ring-red-200 px-2.5 py-1 text-[11px] font-semibold"><Droplet className="h-3.5 w-3.5" />Blood {bio.bloodGroup}</span>}
        {bio.genotype && <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 text-purple-700 ring-1 ring-purple-200 px-2.5 py-1 text-[11px] font-semibold"><Dna className="h-3.5 w-3.5" />Genotype {bio.genotype}</span>}
        {outstanding > 0
          ? <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-200 px-2.5 py-1 text-[11px] font-semibold"><Wallet className="h-3.5 w-3.5" />Pending GHS {outstanding}</span>
          : <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 px-2.5 py-1 text-[11px] font-semibold"><Wallet className="h-3.5 w-3.5" />Account settled</span>}
      </div>

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {tab === 'Bio-Data' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Field label="Hospital ID" value={patient.id} />
          <Field label="Date of Birth" value={patient.dob} />
          <Field label="Gender" value={patient.gender} />
          <Field label="Blood Group" value={bio.bloodGroup} />
          <Field label="Genotype" value={bio.genotype} />
          <Field label="National ID" value={bio.nationalId} />
          <Field label="Phone" value={patient.phone} />
          <Field label="Marital Status" value={bio.maritalStatus} />
          <Field label="Occupation" value={bio.occupation} />
          <Field label="Address" value={patient.address} full />
          <Field label="Next of Kin" value={patient.nextOfKin} />
          <Field label="Emergency Contact" value={patient.emergencyContact} />
          <Field label="Insurance" value={patient.insurance} />
        </div>
      )}

      {tab === 'Visits & Admissions' && (
        <div className="space-y-4">
          <RecordList icon={CalendarClock} title="Appointments" empty="No appointments." rows={appts.map((a) => ({ k: a.id, a: `${a.date} ${a.time}`, b: `${a.doctor} · ${a.dept}`, c: a.status }))} />
          <RecordList icon={BedDouble} title="Admissions" empty="No admissions." rows={adms.map((a) => ({ k: a.id, a: a.admittedAt, b: `${a.ward} / ${a.bed} · ${a.diagnosis}`, c: a.status }))} />
        </div>
      )}

      {tab === 'Laboratory' && (
        <RecordList icon={FlaskConical} title="Lab Orders" empty="No lab orders." rows={labs.map((l) => ({ k: l.id, a: (l.tests || []).join(', '), b: `Ordered by ${l.orderedBy}`, c: l.status, extra: l.result }))} />
      )}

      {tab === 'Pharmacy' && (
        <RecordList icon={Pill} title="Prescriptions" empty="No prescriptions." rows={rx.map((r) => ({ k: r.id, a: (r.items || []).map((i) => i.drug).join(', '), b: `${r.prescriber} · ${r.time}`, c: r.status }))} />
      )}

      {tab === 'Billing' && (
        <div className="space-y-3">
          <Table headers={['Invoice', 'Payer', 'Date', 'Total', 'Status']}>
            {invoices.map((i) => (
              <Tr key={i.id}><Td className="font-semibold">{i.id}</Td><Td>{i.payer}</Td><Td>{i.date}</Td><Td>GHS {i.total}</Td><Td><Badge value={i.status === 'Paid' ? 'Paid' : 'Pending'}>{i.status}</Badge></Td></Tr>
            ))}
          </Table>
          <div className="flex justify-between items-center px-1">
            <button onClick={() => { onClose(); go('finance'); }} className="text-[12px] font-semibold text-blue-600">Open in Finance →</button>
            <div className="text-sm font-bold text-slate-800">Outstanding: GHS {outstanding.toLocaleString()}</div>
          </div>
        </div>
      )}
    </Modal>
  );
}

function RecordList({ icon: Icon, title, rows, empty }) {
  return (
    <div>
      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5"><Icon className="h-3.5 w-3.5" />{title}</div>
      {rows.length === 0 ? <p className="text-[13px] text-slate-400">{empty}</p> : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.k} className="rounded-lg border border-slate-100 px-3 py-2">
              <div className="flex items-center justify-between">
                <div className="text-[13px] font-semibold text-slate-800">{r.a}</div>
                <Badge value={['Paid','Completed','Dispensed','Verified','Resulted','Discharged'].includes(r.c) ? 'Completed' : 'Pending'}>{r.c}</Badge>
              </div>
              <div className="text-[11px] text-slate-500">{r.b}</div>
              {r.extra && <div className="text-[11px] text-slate-600 mt-1">{r.extra}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function age(dob) { if (!dob) return '—'; return Math.max(0, Math.floor((Date.now() - new Date(dob)) / 3.15576e10)); }
