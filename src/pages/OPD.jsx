import React, { useState } from 'react';
import { ArrowRight, FlaskConical, Pill, BedDouble, LogOut } from 'lucide-react';
import {
  PageHeader, KpiGrid, Kpi, FilterBar, Select, Table, Td, Tr, Badge, Modal, Tabs, Field, Button, StatusStep, IconBtn,
} from '../components/ui';
import { Eye } from 'lucide-react';
import { PATIENT_STATUSES } from '../data/mockData';
import { Clock, Stethoscope, CheckCircle2, AlertTriangle } from 'lucide-react';

const NEXT_STAGE = {
  'Registered': 'Waiting',
  'Waiting': 'In Triage',
  'In Triage': 'Waiting for Doctor',
  'Waiting for Doctor': 'In Consultation',
  'In Consultation': 'Pharmacy',
  'Laboratory': 'In Consultation',
  'Imaging': 'In Consultation',
  'Pharmacy': 'Discharged',
};

export default function OPD({ store }) {
  const { patients, setPatients, go } = store;
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState(null);

  const rows = patients.filter((p) =>
    (p.department === 'OPD' || p.department === 'Emergency' || p.status === 'Admitted') &&
    (!search || p.name.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase())) &&
    (!status || p.status === status)
  );

  const update = (id, patch) => setPatients((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const advance = (p) => {
    const next = NEXT_STAGE[p.status];
    if (next) update(p.id, { status: next, stage: next });
  };

  const transfer = (p, to) => {
    const map = { lab: 'Laboratory', pharmacy: 'Pharmacy', admit: 'Admitted', discharge: 'Discharged' };
    update(p.id, { status: map[to], stage: map[to] });
    if (selected?.id === p.id) setSelected({ ...p, status: map[to], stage: map[to] });
  };

  const waiting = rows.filter((p) => ['Waiting', 'Waiting for Doctor', 'In Triage'].includes(p.status)).length;
  const inConsult = rows.filter((p) => p.status === 'In Consultation').length;

  return (
    <div className="space-y-5">
      <PageHeader title="OPD / Patient Flow" subtitle="Registration → Triage → Consultation → Lab / Pharmacy → Admit / Discharge" />

      <KpiGrid cols={4}>
        <Kpi title="In Queue" value={rows.filter((p) => p.status !== 'Discharged').length} icon={Clock} tone="blue" />
        <Kpi title="Waiting" value={waiting} icon={Clock} tone="amber" />
        <Kpi title="In Consultation" value={inConsult} icon={Stethoscope} tone="blue" />
        <Kpi title="Priority" value={rows.filter((p) => ['Urgent', 'Emergency'].includes(p.priority)).length} icon={AlertTriangle} tone="red" />
      </KpiGrid>

      <FilterBar search={search} onSearch={setSearch} placeholder="Search patient name or number…">
        <Select value={status} onChange={setStatus} options={PATIENT_STATUSES} label="All statuses" />
      </FilterBar>

      <Table headers={['Patient No', 'Name', 'Arrival', 'Visit', 'Priority', 'Doctor', 'Room', 'Wait', 'Stage', 'Status', '']}>
        {rows.map((p) => (
          <Tr key={p.id} onClick={() => setSelected(p)}>
            <Td className="font-semibold text-slate-800">{p.id}</Td>
            <Td className="font-medium">{p.name}</Td>
            <Td>{p.arrivalTime}</Td>
            <Td>{p.visitType}</Td>
            <Td><Badge value={p.priority} /></Td>
            <Td>{p.doctor}</Td>
            <Td>{p.room}</Td>
            <Td>{p.waitingMins}m</Td>
            <Td className="text-slate-500">{p.stage}</Td>
            <Td onClick={(e) => e.stopPropagation()}>
              <StatusStep value={p.status} next={NEXT_STAGE[p.status]} onAdvance={() => advance(p)} />
            </Td>
            <Td onClick={(e) => e.stopPropagation()}>
              <IconBtn icon={Eye} title="Open patient" onClick={() => setSelected(p)} />
            </Td>
          </Tr>
        ))}
      </Table>

      <PatientModal patient={selected} onClose={() => setSelected(null)} onTransfer={transfer} go={go} />
    </div>
  );
}

function PatientModal({ patient, onClose, onTransfer, go }) {
  const [tab, setTab] = useState('Overview');
  if (!patient) return null;
  const tabs = ['Overview', 'Visit History', 'Current Visit', 'Notes', 'Transfers', 'Appointments', 'Documents'];

  return (
    <Modal
      open={!!patient} onClose={onClose} width="max-w-4xl"
      title={patient.name} subtitle={`${patient.id} · ${patient.gender} · DOB ${patient.dob}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <Button variant="success" icon={LogOut} onClick={() => onTransfer(patient, 'discharge')}>Discharge Patient</Button>
        </>
      }
    >
      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {tab === 'Overview' && (
        <div className="grid grid-cols-2 gap-4">
          <Field label="Status" value={<Badge value={patient.status} />} />
          <Field label="Priority" value={<Badge value={patient.priority} />} />
          <Field label="Assigned Doctor" value={patient.doctor} />
          <Field label="Consultation Room" value={patient.room} />
          <Field label="Phone" value={patient.phone} />
          <Field label="Insurance" value={patient.insurance} />
          <Field label="Address" value={patient.address} full />
          <Field label="Next of Kin" value={patient.nextOfKin} />
          <Field label="Emergency Contact" value={patient.emergencyContact} />
        </div>
      )}

      {tab === 'Visit History' && (
        <div className="space-y-2">
          {patient.visits.map((v, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
              <div><div className="text-[13px] font-semibold text-slate-800">{v.type} · {v.dept}</div><div className="text-[11px] text-slate-500">{v.date}</div></div>
              <Badge value={v.outcome === 'Admitted' ? 'Occupied' : v.outcome === 'Discharged' ? 'Completed' : 'In Progress'}>{v.outcome}</Badge>
            </div>
          ))}
        </div>
      )}

      {tab === 'Current Visit' && (
        <div className="grid grid-cols-2 gap-4">
          <Field label="Visit Type" value={patient.visitType} />
          <Field label="Arrival Time" value={patient.arrivalTime} />
          <Field label="Waiting Time" value={`${patient.waitingMins} minutes`} />
          <Field label="Current Stage" value={patient.stage} />
          <Field label="Reason for Visit" value={patient.reason} full />
          <Field label="Department" value={patient.department} />
          <Field label="Registered" value={patient.registered} />
        </div>
      )}

      {tab === 'Notes' && <p className="text-sm text-slate-500">No operational notes recorded for this visit. Clinical notes are managed in the EMR (Phase 2).</p>}

      {tab === 'Transfers' && (
        <div>
          <p className="text-sm text-slate-600 mb-3">Move this patient to the next point of care:</p>
          <div className="grid grid-cols-2 gap-3">
            <TransferCard icon={FlaskConical} label="Transfer to Laboratory" hint="Send for lab tests / imaging" onClick={() => onTransfer(patient, 'lab')} />
            <TransferCard icon={Pill} label="Transfer to Pharmacy" hint="Send for dispensing" onClick={() => onTransfer(patient, 'pharmacy')} />
            <TransferCard icon={BedDouble} label="Admit to Ward" hint="Create an in-patient admission" onClick={() => onTransfer(patient, 'admit')} />
            <TransferCard icon={LogOut} label="Discharge from OPD" hint="Close this visit" tone="success" onClick={() => onTransfer(patient, 'discharge')} />
          </div>
        </div>
      )}

      {tab === 'Appointments' && (
        <div className="space-y-2">
          <button onClick={() => go('appointments')} className="text-[13px] font-semibold text-blue-600">Open appointment scheduler →</button>
          <p className="text-sm text-slate-500">Follow-up appointments for this patient appear here.</p>
        </div>
      )}

      {tab === 'Documents' && <p className="text-sm text-slate-500">Consent forms, referrals and scanned documents will attach here (Phase 2).</p>}
    </Modal>
  );
}

function TransferCard({ icon: Icon, label, hint, tone, onClick }) {
  return (
    <button onClick={onClick} className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-colors ${tone === 'success' ? 'border-emerald-200 hover:bg-emerald-50' : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50/50'}`}>
      <span className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${tone === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}><Icon className="h-4 w-4" /></span>
      <span><span className="block text-[13px] font-bold text-slate-800">{label}</span><span className="block text-[11px] text-slate-500">{hint}</span></span>
    </button>
  );
}
