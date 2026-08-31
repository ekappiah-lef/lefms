import React, { useState } from 'react';
import { CalendarRange, Stethoscope, HeartPulse, HardHat, Plus } from 'lucide-react';
import { PageHeader, KpiGrid, Kpi, FilterBar, Select, Table, Td, Tr, Badge, SectionCard, Modal, Button, DeleteBtn } from '../components/ui';
import { SHIFT_TYPES } from '../data/mockData';

export default function ShiftManagement({ store }) {
  const { shifts, setShifts, employees } = store;
  const [shift, setShift] = useState('');
  const [show, setShow] = useState(false);
  const rows = shifts.filter((s) => !shift || s.shift === shift);

  const docsOnDuty = shifts.filter((s) => s.role === 'Doctor' && s.status === 'On Duty').length;
  const nursesOnDuty = shifts.filter((s) => s.role === 'Nurse' && s.status === 'On Duty').length;
  const engOnDuty = shifts.filter((s) => s.role === 'Engineer' && s.status === 'On Duty').length;

  return (
    <div className="space-y-5">
      <PageHeader title="Shift Management" subtitle="Rosters, on-duty coverage & staffing levels"
        actions={<Button icon={Plus} onClick={() => setShow(true)}>Assign Shift</Button>} />

      <KpiGrid cols={4}>
        <Kpi title="Shifts Today" value={shifts.length} icon={CalendarRange} tone="blue" />
        <Kpi title="Doctors on Duty" value={docsOnDuty} icon={Stethoscope} tone="green" />
        <Kpi title="Nurses on Duty" value={nursesOnDuty} icon={HeartPulse} tone="green" />
        <Kpi title="Engineers on Duty" value={engOnDuty} icon={HardHat} tone="green" />
      </KpiGrid>

      <FilterBar>
        <Select value={shift} onChange={setShift} options={SHIFT_TYPES} label="All shifts" />
      </FilterBar>

      <Table headers={['Staff', 'Role', 'Ward / Area', 'Shift', 'Start', 'End', 'Date', 'Status', 'Actions']}>
        {rows.map((s) => (
          <Tr key={s.id}>
            <Td className="font-semibold text-slate-800">{s.staff}</Td>
            <Td>{s.role}</Td>
            <Td>{s.ward}</Td>
            <Td>{s.shift}</Td>
            <Td>{s.start}</Td>
            <Td>{s.end}</Td>
            <Td>{s.date}</Td>
            <Td><Badge value={s.status} /></Td>
            <Td><DeleteBtn onDelete={() => setShifts((prev) => prev.filter((x) => x.id !== s.id))} /></Td>
          </Tr>
        ))}
      </Table>

      <SectionCard title="Coverage by Shift">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {SHIFT_TYPES.map((t) => (
            <div key={t} className="rounded-xl border border-slate-200 p-3 text-center">
              <div className="text-2xl font-black text-slate-900">{shifts.filter((s) => s.shift === t).length}</div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{t}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      <AssignShift open={show} onClose={() => setShow(false)} staff={employees.map((e) => e.name)} onSave={(s) => { setShifts((prev) => [s, ...prev]); setShow(false); }} />
    </div>
  );
}

function AssignShift({ open, onClose, onSave, staff }) {
  const [f, setF] = useState({ staff: staff[0] || '', role: 'Nurse', ward: 'Ward A', shift: 'Morning', start: '07:00', end: '15:00', date: '2026-07-20' });
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const save = () => onSave({ id: 'SH-' + Math.floor(7 + Math.random() * 90), status: 'Scheduled', ...f });
  return (
    <Modal open={open} onClose={onClose} title="Assign Shift" width="max-w-lg"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={save}>Assign</Button></>}>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><label className="text-[11px] font-semibold text-slate-600">Staff</label><div className="mt-1"><Select value={f.staff} onChange={set('staff')} options={staff} /></div></div>
        <div><label className="text-[11px] font-semibold text-slate-600">Shift</label><div className="mt-1"><Select value={f.shift} onChange={set('shift')} options={SHIFT_TYPES} /></div></div>
        <div><label className="text-[11px] font-semibold text-slate-600">Ward / Area</label><input value={f.ward} onChange={(e) => set('ward')(e.target.value)} className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
        <div><label className="text-[11px] font-semibold text-slate-600">Start</label><input value={f.start} onChange={(e) => set('start')(e.target.value)} className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
        <div><label className="text-[11px] font-semibold text-slate-600">End</label><input value={f.end} onChange={(e) => set('end')(e.target.value)} className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
        <div className="col-span-2"><label className="text-[11px] font-semibold text-slate-600">Date</label><input value={f.date} onChange={(e) => set('date')(e.target.value)} className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
      </div>
    </Modal>
  );
}
