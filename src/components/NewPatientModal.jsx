import React, { useState } from 'react';
import { Modal, Button, Select } from './ui';

// Shared sectioned "Create Patient Record" form (used by Patient Records
// and Front Desk). Calls onSave with a fully-formed UI patient object.
function Input({ label, value, onChange, type = 'text', full, readOnly }) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <label className="text-[11px] font-semibold text-slate-600">{label}</label>
      <input type={type} value={value} readOnly={readOnly} onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0b1c30]" />
    </div>
  );
}

function Section({ title, desc, children }) {
  return (
    <div className="grid md:grid-cols-3 gap-4 py-4 border-b border-slate-100 last:border-0">
      <div><h4 className="text-sm font-bold text-slate-800">{title}</h4><p className="text-[12px] text-slate-500 mt-0.5">{desc}</p></div>
      <div className="md:col-span-2 grid grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

export default function NewPatientModal({ open, onClose, onSave }) {
  const [f, setF] = useState({ name: '', dob: '', gender: 'Female', nationalId: '', bloodGroup: 'Unknown', genotype: 'Unknown', phone: '', address: '', nextOfKin: '', emergencyContact: '', insurance: 'NHIS · Active', reason: '', visitType: 'Walk-in' });
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const save = () => {
    const id = 'P-' + Math.floor(100242 + Math.random() * 700);
    onSave({ id, ...f, priority: 'Routine', doctor: 'Unassigned', room: '—', arrivalTime: '—', waitingMins: 0, stage: 'Registration', status: 'Registered', department: 'OPD', registered: '2026-07-19 ' + new Date().toTimeString().slice(0, 5), visits: [{ date: '2026-07-19', type: f.visitType, dept: 'OPD', outcome: 'In progress' }] });
  };
  return (
    <Modal open={open} onClose={onClose} title="Create New Patient Record" subtitle="A hospital ID is auto-generated on save" width="max-w-3xl"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={!f.name}>Save Record</Button></>}>
      <div className="divide-y divide-slate-100">
        <Section title="Basic Information" desc="Primary identifiers required for registration.">
          <Input label="Full Name" value={f.name} onChange={set('name')} full />
          <Input label="Date of Birth" value={f.dob} onChange={set('dob')} type="date" />
          <div><label className="text-[11px] font-semibold text-slate-600">Gender</label><div className="mt-1"><Select value={f.gender} onChange={set('gender')} options={['Female', 'Male', 'Other']} /></div></div>
          <Input label="National ID / Passport" value={f.nationalId} onChange={set('nationalId')} full />
        </Section>
        <Section title="Bio-Data" desc="Clinical basics used across departments.">
          <div><label className="text-[11px] font-semibold text-slate-600">Blood Group</label><div className="mt-1"><Select value={f.bloodGroup} onChange={set('bloodGroup')} options={['Unknown', 'O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']} /></div></div>
          <div><label className="text-[11px] font-semibold text-slate-600">Genotype</label><div className="mt-1"><Select value={f.genotype} onChange={set('genotype')} options={['Unknown', 'AA', 'AS', 'AC', 'SS', 'SC']} /></div></div>
          <div><label className="text-[11px] font-semibold text-slate-600">Insurance</label><div className="mt-1"><Select value={f.insurance} onChange={set('insurance')} options={['NHIS · Active', 'Private · Nationwide', 'Cash']} /></div></div>
        </Section>
        <Section title="Contact Information" desc="Patient contact & next of kin.">
          <Input label="Phone Number" value={f.phone} onChange={set('phone')} />
          <Input label="Next of Kin" value={f.nextOfKin} onChange={set('nextOfKin')} />
          <Input label="Emergency Contact" value={f.emergencyContact} onChange={set('emergencyContact')} />
          <Input label="Address" value={f.address} onChange={set('address')} full />
        </Section>
        <Section title="Initial Visit" desc="Routing & presenting complaint.">
          <div><label className="text-[11px] font-semibold text-slate-600">Visit Type</label><div className="mt-1"><Select value={f.visitType} onChange={set('visitType')} options={['Walk-in', 'Appointment', 'Emergency']} /></div></div>
          <Input label="Reason for Visit" value={f.reason} onChange={set('reason')} full />
        </Section>
      </div>
    </Modal>
  );
}
