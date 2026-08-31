import React, { useState } from 'react';
import { LogIn, BedDouble, Clock, Plus, LogOut } from 'lucide-react';
import { PageHeader, KpiGrid, Kpi, FilterBar, Select, Table, Td, Tr, Badge, Modal, Button, Field, ActionBtn, RowActions, DeleteBtn } from '../components/ui';
import { ADMISSION_STATUSES } from '../data/extraData';

export default function Admissions({ store }) {
  const { admissions, setAdmissions, patients, wards, setWards, setDischarges, go } = store;
  const [status, setStatus] = useState('');
  const [sel, setSel] = useState(null);
  const [showNew, setShowNew] = useState(false);

  const rows = admissions.filter((a) => !status || a.status === status);

  const markPendingDischarge = (id) => {
    setAdmissions((prev) => prev.map((a) => a.id === id ? { ...a, status: 'Pending Discharge' } : a));
    if (sel?.id === id) setSel((s) => ({ ...s, status: 'Pending Discharge' }));
  };

  const dischargePatient = (a) => {
    setAdmissions((prev) => prev.map((x) => x.id === a.id ? { ...x, status: 'Discharged' } : x));
    setDischarges((prev) => [{ id: 'DIS-' + Math.floor(4003 + Math.random() * 900), patient: a.patient, patientId: a.patientId, admissionId: a.id, ward: a.ward, dischargedAt: '2026-07-19 ' + new Date().toTimeString().slice(0, 5), summary: `Discharged from ${a.ward}. ${a.diagnosis} treated.`, followUp: '2026-07-26', billStatus: 'Pending' }, ...prev]);
    // free the bed
    setWards((prev) => prev.map((w) => ({ ...w, beds: w.beds.map((b) => b.id === a.bed ? { ...b, status: 'Cleaning', patient: null } : b) })));
    setSel(null);
    go('discharges');
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Admissions" subtitle="In-patient register — ward, bed, admitting doctor & length of stay"
        actions={<Button icon={Plus} onClick={() => setShowNew(true)}>Admit Patient</Button>} />

      <KpiGrid cols={4}>
        <Kpi title="Current In-Patients" value={admissions.filter((a) => a.status === 'Admitted').length} icon={BedDouble} tone="blue" />
        <Kpi title="Pending Discharge" value={admissions.filter((a) => a.status === 'Pending Discharge').length} icon={Clock} tone="amber" />
        <Kpi title="Admitted Today" value={admissions.filter((a) => a.admittedAt?.startsWith('2026-07-19')).length} icon={LogIn} tone="green" />
        <Kpi title="Avg LOS (days)" value={(admissions.reduce((s, a) => s + a.los, 0) / (admissions.length || 1)).toFixed(1)} icon={Clock} tone="slate" />
      </KpiGrid>

      <FilterBar>
        <Select value={status} onChange={setStatus} options={ADMISSION_STATUSES} label="All statuses" />
      </FilterBar>

      <Table headers={['Admission', 'Patient', 'Ward', 'Bed', 'Doctor', 'Admitted', 'Diagnosis', 'LOS', 'Status', '']}>
        {rows.map((a) => (
          <Tr key={a.id} onClick={() => setSel(a)}>
            <Td className="font-semibold text-slate-800">{a.id}</Td>
            <Td className="font-medium">{a.patient}</Td>
            <Td>{a.ward}</Td>
            <Td>{a.bed}</Td>
            <Td>{a.doctor}</Td>
            <Td>{a.admittedAt}</Td>
            <Td>{a.diagnosis}</Td>
            <Td>{a.los}d</Td>
            <Td><Badge value={a.status} /></Td>
            <Td onClick={(e) => e.stopPropagation()}>
              <RowActions>
                {a.status === 'Admitted' && <ActionBtn tone="amber" onClick={() => markPendingDischarge(a.id)}>Ready</ActionBtn>}
                <DeleteBtn onDelete={() => setAdmissions((prev) => prev.filter((x) => x.id !== a.id))} />
              </RowActions>
            </Td>
          </Tr>
        ))}
      </Table>

      <Modal open={!!sel} onClose={() => setSel(null)} title={sel?.patient} subtitle={sel ? `${sel.id} · ${sel.ward} / ${sel.bed}` : ''}
        footer={sel && (
          <>
            <Button variant="ghost" onClick={() => setSel(null)}>Close</Button>
            {sel.status === 'Admitted' && <Button variant="ghost" onClick={() => markPendingDischarge(sel.id)}>Mark Ready for Discharge</Button>}
            <Button variant="success" icon={LogOut} onClick={() => dischargePatient(sel)}>Discharge</Button>
          </>
        )}>
        {sel && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Patient No" value={sel.patientId} />
            <Field label="Status" value={<Badge value={sel.status} />} />
            <Field label="Ward / Bed" value={`${sel.ward} / ${sel.bed}`} />
            <Field label="Admitting Doctor" value={sel.doctor} />
            <Field label="Admitted" value={sel.admittedAt} />
            <Field label="Length of Stay" value={`${sel.los} days`} />
            <Field label="Deposit Paid" value={`GHS ${sel.deposit}`} />
            <Field label="Diagnosis" value={sel.diagnosis} full />
          </div>
        )}
      </Modal>

      <AdmitModal open={showNew} onClose={() => setShowNew(false)} patients={patients} wards={wards}
        onSave={(a) => { setAdmissions((prev) => [a, ...prev]); setShowNew(false); }} />
    </div>
  );
}

function AdmitModal({ open, onClose, onSave, patients, wards }) {
  const [f, setF] = useState({ patientKey: '', ward: wards[0]?.name.split('—')[0].trim() || 'Ward A', bed: '', doctor: 'Dr. Kojo Amankwah', diagnosis: '', deposit: 500 });
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const patient = patients.find((p) => `${p.id} — ${p.name}` === f.patientKey);
  const save = () => {
    if (!patient) return;
    const { patientKey, ...rest } = f;
    onSave({ id: 'ADM-' + Math.floor(3006 + Math.random() * 900), patient: patient.name, patientId: patient.id, admittedAt: '2026-07-19 ' + new Date().toTimeString().slice(0, 5), los: 0, status: 'Admitted', ...rest });
  };
  return (
    <Modal open={open} onClose={onClose} title="Admit Patient" subtitle="Select a registered patient record" width="max-w-2xl"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={!patient}>Admit</Button></>}>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><label className="text-[11px] font-semibold text-slate-600">Patient (from Patient Records)</label><div className="mt-1"><Select value={f.patientKey} onChange={set('patientKey')} options={patients.map((p) => `${p.id} — ${p.name}`)} label="Select a registered patient…" /></div></div>
        <div><label className="text-[11px] font-semibold text-slate-600">Ward</label><div className="mt-1"><Select value={f.ward} onChange={set('ward')} options={wards.map((w) => w.name.split('—')[0].trim())} /></div></div>
        <div><label className="text-[11px] font-semibold text-slate-600">Bed</label><input value={f.bed} onChange={(e) => set('bed')(e.target.value)} className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
        <div><label className="text-[11px] font-semibold text-slate-600">Doctor</label><div className="mt-1"><Select value={f.doctor} onChange={set('doctor')} options={['Dr. Kojo Amankwah', 'Dr. Priya Nair', 'Dr. Naomi Asante']} /></div></div>
        <div><label className="text-[11px] font-semibold text-slate-600">Deposit (GHS)</label><input type="number" value={f.deposit} onChange={(e) => set('deposit')(Number(e.target.value))} className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
        <div className="col-span-2"><label className="text-[11px] font-semibold text-slate-600">Diagnosis</label><input value={f.diagnosis} onChange={(e) => set('diagnosis')(e.target.value)} className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
      </div>
    </Modal>
  );
}
