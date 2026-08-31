import React, { useState } from 'react';
import { UserPlus, Ticket, Building2 } from 'lucide-react';
import {
  PageHeader, KpiGrid, Kpi, FilterBar, Table, Td, Tr, Badge, Modal, Button, Field, Tabs, Select, ActionBtn, RowActions, DeleteBtn,
} from '../components/ui';
import { Users, LogIn, Truck } from 'lucide-react';

const SERVICE_TICKETS = ['Broken chair', 'Faulty air conditioner', 'Computer not working', 'Electrical problem', 'Plumbing issue', 'Bed problem', 'Biomedical equipment fault', 'Cleaning request', 'Security request'];

export default function FrontDesk({ store }) {
  const { patients, addPatient, visitors, setVisitors, deliveries, setDeliveries, requests, setRequests, go } = store;
  const [tab, setTab] = useState('Patients');
  const [search, setSearch] = useState('');
  const [showReg, setShowReg] = useState(false);
  const [showVisitor, setShowVisitor] = useState(false);
  const [showTicket, setShowTicket] = useState(false);
  const [selected, setSelected] = useState(null);

  const filtered = patients.filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase()) || p.phone.includes(search));

  return (
    <div className="space-y-5">
      <PageHeader title="Front Desk" subtitle="Patient registration, check-in, visitors & service tickets"
        actions={
          <>
            <Button variant="ghost" icon={Building2} onClick={() => setShowVisitor(true)}>Register Visitor</Button>
            <Button variant="ghost" icon={Ticket} onClick={() => setShowTicket(true)}>Service Ticket</Button>
            <Button icon={UserPlus} onClick={() => setShowReg(true)}>New Patient</Button>
          </>
        } />

      <KpiGrid cols={4}>
        <Kpi title="Registered Today" value={patients.filter((p) => p.registered?.startsWith('2026-07-19')).length} icon={UserPlus} tone="blue" />
        <Kpi title="Walk-Ins" value={patients.filter((p) => p.visitType === 'Walk-in').length} icon={Users} tone="blue" />
        <Kpi title="Checked-In" value={patients.filter((p) => p.status !== 'Registered').length} icon={LogIn} tone="green" />
        <Kpi title="Visitors On-Site" value={visitors.filter((v) => v.status === 'On Premises').length} icon={Building2} tone="amber" />
      </KpiGrid>

      <Tabs tabs={['Patients', 'Visitors', 'Deliveries']} active={tab} onChange={setTab} />

      {tab === 'Patients' && (
        <>
          <FilterBar search={search} onSearch={setSearch} placeholder="Search by name, patient no or phone…" />
          <Table headers={['Patient No', 'Name', 'Gender', 'Phone', 'Insurance', 'Visit', 'Status', '']}>
            {filtered.map((p) => (
              <Tr key={p.id} onClick={() => setSelected(p)}>
                <Td className="font-semibold text-slate-800">{p.id}</Td>
                <Td className="font-medium">{p.name}</Td>
                <Td>{p.gender}</Td>
                <Td>{p.phone}</Td>
                <Td>{p.insurance}</Td>
                <Td>{p.visitType}</Td>
                <Td><Badge value={p.status} /></Td>
                <Td onClick={(e) => e.stopPropagation()}><ActionBtn tone="navy" icon={LogIn} onClick={() => go('patient-queue')}>Check-in</ActionBtn></Td>
              </Tr>
            ))}
          </Table>
        </>
      )}

      {tab === 'Visitors' && (
        <Table headers={['Badge', 'Visitor', 'Visiting', 'Purpose', 'In', 'Out', 'Status', '']}>
          {visitors.map((v) => (
            <Tr key={v.id}>
              <Td className="font-semibold text-slate-800">{v.badge}</Td>
              <Td className="font-medium">{v.name}</Td>
              <Td>{v.visiting}</Td>
              <Td>{v.purpose}</Td>
              <Td>{v.checkIn}</Td>
              <Td>{v.checkOut || '—'}</Td>
              <Td><Badge value={v.status} /></Td>
              <Td>
                <RowActions>
                  {v.status === 'On Premises' && <ActionBtn tone="outline" onClick={() => setVisitors((prev) => prev.map((x) => x.id === v.id ? { ...x, status: 'Checked-out', checkOut: '12:30' } : x))}>Check-out</ActionBtn>}
                  <DeleteBtn onDelete={() => setVisitors((prev) => prev.filter((x) => x.id !== v.id))} />
                </RowActions>
              </Td>
            </Tr>
          ))}
        </Table>
      )}

      {tab === 'Deliveries' && (
        <Table headers={['Ref', 'Item', 'From', 'Recipient', 'Received', 'Status', 'Actions']}>
          {deliveries.map((d) => (
            <Tr key={d.id}>
              <Td className="font-semibold text-slate-800">{d.id}</Td>
              <Td className="font-medium">{d.item}</Td>
              <Td>{d.from}</Td>
              <Td>{d.recipient}</Td>
              <Td>{d.received || '—'}</Td>
              <Td><Badge value={d.status} /></Td>
              <Td><DeleteBtn onDelete={() => setDeliveries((prev) => prev.filter((x) => x.id !== d.id))} /></Td>
            </Tr>
          ))}
        </Table>
      )}

      {/* Patient profile */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.name} subtitle={`${selected?.id} · Patient Profile`}
        footer={<Button onClick={() => { setSelected(null); go('patient-queue'); }}>Assign to OPD Queue</Button>}>
        {selected && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Date of Birth" value={selected.dob} />
            <Field label="Gender" value={selected.gender} />
            <Field label="Phone" value={selected.phone} />
            <Field label="Insurance" value={selected.insurance} />
            <Field label="Address" value={selected.address} full />
            <Field label="Next of Kin" value={selected.nextOfKin} />
            <Field label="Emergency Contact" value={selected.emergencyContact} />
            <Field label="Visit Reason" value={selected.reason} full />
          </div>
        )}
      </Modal>

      <RegisterModal open={showReg} onClose={() => setShowReg(false)} onSave={addPatient} />
      <VisitorModal open={showVisitor} onClose={() => setShowVisitor(false)} onSave={(v) => setVisitors((prev) => [v, ...prev])} />
      <TicketModal open={showTicket} onClose={() => setShowTicket(false)} reporter={store.currentUser.name} onSave={(t) => { setRequests((prev) => [t, ...prev]); setShowTicket(false); go('requests'); }} />
    </div>
  );
}

function Input({ label, value, onChange, type = 'text', full }) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <label className="text-[11px] font-semibold text-slate-600">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  );
}

function Section({ title, desc, children }) {
  return (
    <div className="grid md:grid-cols-3 gap-4 py-4 border-b border-slate-100 last:border-0">
      <div className="md:col-span-1">
        <h4 className="text-sm font-bold text-slate-800">{title}</h4>
        <p className="text-[12px] text-slate-500 mt-0.5">{desc}</p>
      </div>
      <div className="md:col-span-2 grid grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

function RegisterModal({ open, onClose, onSave }) {
  const [f, setF] = useState({ name: '', dob: '', gender: 'Female', nationalId: '', bloodGroup: 'Unknown', genotype: 'Unknown', phone: '', address: '', nextOfKin: '', emergencyContact: '', insurance: 'NHIS · Active', reason: '', visitType: 'Walk-in' });
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const save = () => {
    const id = 'P-' + Math.floor(100242 + Math.random() * 700);
    onSave({ id, ...f, priority: 'Routine', doctor: 'Unassigned', room: '—', arrivalTime: '—', waitingMins: 0, stage: 'Registration', status: 'Registered', department: 'OPD', registered: '2026-07-19 ' + new Date().toTimeString().slice(0, 5), visits: [{ date: '2026-07-19', type: f.visitType, dept: 'OPD', outcome: 'In progress' }] });
    onClose();
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

function VisitorModal({ open, onClose, onSave }) {
  const [f, setF] = useState({ name: '', visiting: '', purpose: '' });
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const save = () => {
    onSave({ id: 'V-' + Math.floor(2204 + Math.random() * 90), badge: 'VIS-' + Math.floor(43 + Math.random() * 50), checkIn: new Date().toTimeString().slice(0, 5), checkOut: '', status: 'On Premises', ...f });
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title="Register Visitor" width="max-w-lg"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={!f.name}>Issue Badge</Button></>}>
      <div className="grid grid-cols-1 gap-3">
        <Input label="Visitor Name" value={f.name} onChange={set('name')} />
        <Input label="Visiting (patient / department)" value={f.visiting} onChange={set('visiting')} />
        <Input label="Purpose" value={f.purpose} onChange={set('purpose')} />
      </div>
    </Modal>
  );
}

const TICKET_CATEGORY = {
  'Broken chair': 'Furniture', 'Faulty air conditioner': 'HVAC', 'Computer not working': 'IT',
  'Electrical problem': 'Electrical', 'Plumbing issue': 'Plumbing', 'Bed problem': 'Furniture',
  'Biomedical equipment fault': 'Biomedical', 'Cleaning request': 'Cleaning', 'Security request': 'Safety',
};

function TicketModal({ open, onClose, onSave, reporter }) {
  const [f, setF] = useState({ type: SERVICE_TICKETS[0], dept: 'Front Desk', location: 'Reception', room: '', priority: 'Medium', description: '' });
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const save = () => onSave({
    id: 'MR-2026-0' + Math.floor(15 + Math.random() * 80), dept: f.dept, location: f.location, room: f.room || f.location, bed: '',
    equipment: f.type, category: TICKET_CATEGORY[f.type] || 'Other', priority: f.priority, reporter,
    date: '2026-07-19 ' + new Date().toTimeString().slice(0, 5), status: 'Submitted', description: f.description || f.type, assignedTo: '',
  });
  return (
    <Modal open={open} onClose={onClose} title="Raise Service Ticket" subtitle="Routed to the Maintenance help desk" width="max-w-2xl"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={save}>Submit Ticket</Button></>}>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><label className="text-[11px] font-semibold text-slate-600">Issue</label><div className="mt-1"><Select value={f.type} onChange={set('type')} options={SERVICE_TICKETS} /></div><div className="text-[11px] text-slate-400 mt-1">Category: <b>{TICKET_CATEGORY[f.type] || 'Other'}</b></div></div>
        <div><label className="text-[11px] font-semibold text-slate-600">Requesting Department</label><div className="mt-1"><Select value={f.dept} onChange={set('dept')} options={['Front Desk', 'OPD', 'Wards', 'ICU', 'Theatre', 'Laboratory', 'Pharmacy', 'Maternity', 'Administration', 'HR', 'Finance']} /></div></div>
        <Input label="Requested By" value={reporter} onChange={() => {}} />
        <Input label="Location" value={f.location} onChange={set('location')} />
        <Input label="Room / Area" value={f.room} onChange={set('room')} />
        <div><label className="text-[11px] font-semibold text-slate-600">Priority</label><div className="mt-1"><Select value={f.priority} onChange={set('priority')} options={['Low', 'Medium', 'High', 'Critical', 'Emergency']} /></div></div>
        <div className="col-span-2"><label className="text-[11px] font-semibold text-slate-600">Description</label><textarea value={f.description} onChange={(e) => set('description')(e.target.value)} rows={2} className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
      </div>
    </Modal>
  );
}
