import React, { useState } from 'react';
import { CalendarPlus, CalendarClock, CheckCircle2, XCircle, LogIn } from 'lucide-react';
import { CalendarPlus as _CP, Wallet } from 'lucide-react';
import { PageHeader, KpiGrid, Kpi, FilterBar, Select, Table, Td, Tr, Badge, Modal, Button, ActionBtn, RowActions, DeleteBtn } from '../components/ui';
import { APPOINTMENT_STATUSES } from '../data/mockData';

export default function Appointments({ store }) {
  const { appointments, setAppointments, patients, addAppointment, go } = store;
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [show, setShow] = useState(false);

  // Creating an appointment also raises a PENDING invoice (finance sync)
  // and persists to MySQL (with its invoice) when the API is live.
  const createAppointment = (appt, invoice, patient) => {
    addAppointment(appt, invoice, patient);
    setShow(false);
  };

  const rows = appointments
    .filter((a) => !status || a.status === status)
    .filter((a) => !search || a.patient.toLowerCase().includes(search.toLowerCase()) || a.doctor.toLowerCase().includes(search.toLowerCase()));

  const setStatusFor = (id, s, extra = {}) => setAppointments((prev) => prev.map((a) => a.id === id ? { ...a, status: s, ...extra } : a));

  return (
    <div className="space-y-5">
      <PageHeader title="Appointments" subtitle="Scheduling, check-in, follow-ups & cancellations"
        actions={<Button icon={CalendarPlus} onClick={() => setShow(true)}>New Appointment</Button>} />

      <div className="rounded-lg bg-blue-50 ring-1 ring-blue-100 px-4 py-2.5 text-[12px] text-blue-800 flex items-center gap-2">
        <Wallet className="h-4 w-4" /> New appointments automatically raise a <b>pending consultation invoice</b> in Finance and on the patient record.
      </div>

      <KpiGrid cols={4}>
        <Kpi title="Today" value={appointments.filter((a) => a.date === '2026-07-19').length} icon={CalendarClock} tone="blue" />
        <Kpi title="Scheduled" value={appointments.filter((a) => a.status === 'Scheduled').length} icon={CalendarClock} tone="amber" />
        <Kpi title="Completed" value={appointments.filter((a) => a.status === 'Completed').length} icon={CheckCircle2} tone="green" />
        <Kpi title="No Shows" value={appointments.filter((a) => a.status === 'No Show').length} icon={XCircle} tone="red" />
      </KpiGrid>

      <FilterBar search={search} onSearch={setSearch} placeholder="Search patient or doctor…">
        <Select value={status} onChange={setStatus} options={APPOINTMENT_STATUSES} label="All statuses" />
      </FilterBar>

      <Table headers={['Ref', 'Patient', 'Doctor', 'Department', 'Date', 'Time', 'Type', 'Status', 'Actions']}>
        {rows.map((a) => (
          <Tr key={a.id}>
            <Td className="font-semibold text-slate-800">{a.id}</Td>
            <Td className="font-medium">{a.patient}</Td>
            <Td>{a.doctor}</Td>
            <Td>{a.dept}</Td>
            <Td>{a.date}</Td>
            <Td>{a.time}</Td>
            <Td>{a.type}</Td>
            <Td><Badge value={a.status} /></Td>
            <Td>
              <RowActions>
                {a.status === 'Scheduled' && <ActionBtn tone="navy" icon={LogIn} onClick={() => setStatusFor(a.id, 'Checked-in')}>Check-in</ActionBtn>}
                {a.status === 'Checked-in' && <ActionBtn tone="success" onClick={() => setStatusFor(a.id, 'Completed')}>Complete</ActionBtn>}
                {['Scheduled', 'Checked-in'].includes(a.status) && <ActionBtn tone="outline" onClick={() => setStatusFor(a.id, 'Cancelled')}>Cancel</ActionBtn>}
                <DeleteBtn onDelete={() => setAppointments((prev) => prev.filter((x) => x.id !== a.id))} />
              </RowActions>
            </Td>
          </Tr>
        ))}
      </Table>

      <NewAppointment open={show} onClose={() => setShow(false)} patients={patients} onCreate={createAppointment} />
    </div>
  );
}

const FEE = 120; // OPD consultation fee

function NewAppointment({ open, onClose, onCreate, patients }) {
  const [f, setF] = useState({ patientId: '', doctor: 'Dr. Priya Nair', dept: 'OPD', date: '2026-07-20', time: '09:00', type: 'New' });
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const patient = patients.find((p) => p.id === f.patientId);

  const save = () => {
    if (!patient) return;
    const apId = 'AP-' + Math.floor(5009 + Math.random() * 900);
    const invId = 'INVC-' + Math.floor(8006 + Math.random() * 900);
    const payer = (patient.insurance || '').includes('NHIS') ? 'NHIS' : (patient.insurance || '').includes('Private') ? 'Private' : 'Cash';
    const invoice = { id: invId, patient: patient.name, patientId: patient.id, payer, date: f.date, status: payer === 'NHIS' ? 'NHIS Claim' : 'Pending', total: FEE, services: [{ desc: 'OPD consultation', amount: FEE }], source: apId };
    const appt = { id: apId, patient: patient.name, patientId: patient.id, doctor: f.doctor, dept: f.dept, date: f.date, time: f.time, type: f.type, status: 'Scheduled' };
    onCreate(appt, invoice, patient);
  };

  const field = (label, k) => (
    <div><label className="text-[11px] font-semibold text-slate-600">{label}</label><input value={f[k]} onChange={(e) => set(k)(e.target.value)} className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
  );

  return (
    <Modal open={open} onClose={onClose} title="New Appointment" subtitle="Patient must exist in Patient Records" width="max-w-lg"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={!patient}>Schedule &amp; Invoice</Button></>}>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-[11px] font-semibold text-slate-600">Patient</label>
          <div className="mt-1"><Select value={f.patientId} onChange={set('patientId')} options={patients.map((p) => p.id)} label="Select existing patient…" /></div>
          {patient && <div className="text-[11px] text-slate-500 mt-1">{patient.name} · {patient.gender} · {patient.insurance}</div>}
        </div>
        <div><label className="text-[11px] font-semibold text-slate-600">Doctor</label><div className="mt-1"><Select value={f.doctor} onChange={set('doctor')} options={['Dr. Priya Nair', 'Dr. Kojo Amankwah', 'Dr. Naomi Asante']} /></div></div>
        <div><label className="text-[11px] font-semibold text-slate-600">Department</label><div className="mt-1"><Select value={f.dept} onChange={set('dept')} options={['OPD', 'Cardiology', 'Paediatrics', 'Surgery']} /></div></div>
        {field('Date', 'date')}
        {field('Time', 'time')}
        <div className="col-span-2"><label className="text-[11px] font-semibold text-slate-600">Type</label><div className="mt-1"><Select value={f.type} onChange={set('type')} options={['New', 'Follow-up', 'Review']} /></div></div>
        <div className="col-span-2 rounded-lg bg-amber-50 ring-1 ring-amber-100 px-3 py-2 text-[12px] text-amber-800">A pending consultation invoice of <b>GHS {FEE}</b> will be created for this patient.</div>
      </div>
    </Modal>
  );
}
