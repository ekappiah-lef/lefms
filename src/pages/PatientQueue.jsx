import React, { useState } from 'react';
import { Clock, Stethoscope, AlertTriangle } from 'lucide-react';
import { PageHeader, KpiGrid, Kpi, FilterBar, Select, Table, Td, Tr, Badge, StatusStep } from '../components/ui';
import { PATIENT_STATUSES } from '../data/mockData';

const NEXT = {
  'Registered': 'Waiting', 'Waiting': 'In Triage', 'In Triage': 'Waiting for Doctor',
  'Waiting for Doctor': 'In Consultation', 'In Consultation': 'Pharmacy', 'Pharmacy': 'Discharged',
  'Laboratory': 'In Consultation', 'Imaging': 'In Consultation',
};

export default function PatientQueue({ store }) {
  const { patients, setPatients } = store;
  const [status, setStatus] = useState('');
  const rows = patients
    .filter((p) => p.status !== 'Discharged' && p.status !== 'Admitted')
    .filter((p) => !status || p.status === status)
    .sort((a, b) => b.waitingMins - a.waitingMins);

  const advance = (p) => setPatients((prev) => prev.map((x) => x.id === p.id && NEXT[p.status] ? { ...x, status: NEXT[p.status], stage: NEXT[p.status] } : x));

  return (
    <div className="space-y-5">
      <PageHeader title="Patient Queue" subtitle="Live check-in queue ordered by waiting time" />
      <KpiGrid cols={3}>
        <Kpi title="In Queue" value={rows.length} icon={Clock} tone="blue" />
        <Kpi title="In Consultation" value={rows.filter((p) => p.status === 'In Consultation').length} icon={Stethoscope} tone="blue" />
        <Kpi title="Longest Wait" value={`${Math.max(0, ...rows.map((p) => p.waitingMins))}m`} icon={AlertTriangle} tone="amber" />
      </KpiGrid>
      <FilterBar>
        <Select value={status} onChange={setStatus} options={PATIENT_STATUSES} label="All statuses" />
      </FilterBar>
      <Table headers={['#', 'Patient', 'Arrival', 'Priority', 'Doctor', 'Room', 'Wait', 'Status (click to advance)']}>
        {rows.map((p, i) => (
          <Tr key={p.id}>
            <Td className="font-bold text-slate-400">{i + 1}</Td>
            <Td><div className="font-semibold text-slate-800">{p.name}</div><div className="text-[11px] text-slate-500">{p.id}</div></Td>
            <Td>{p.arrivalTime}</Td>
            <Td><Badge value={p.priority} /></Td>
            <Td>{p.doctor}</Td>
            <Td>{p.room}</Td>
            <Td className={p.waitingMins > 30 ? 'text-red-600 font-semibold' : ''}>{p.waitingMins}m</Td>
            <Td><StatusStep value={p.status} next={NEXT[p.status]} onAdvance={() => advance(p)} /></Td>
          </Tr>
        ))}
      </Table>
    </div>
  );
}
