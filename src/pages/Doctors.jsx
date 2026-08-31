import React, { useState } from 'react';
import { UserRound, Stethoscope, Share2, CheckCircle2 } from 'lucide-react';
import { PageHeader, KpiGrid, Kpi, SectionCard, Table, Td, Tr, Badge, Tabs, Button, ActionBtn, RowActions, DeleteBtn } from '../components/ui';

export default function Doctors({ store }) {
  const { employees, patients, referrals, setReferrals, appointments } = store;
  const [tab, setTab] = useState('Doctors');
  const doctors = employees.filter((e) => e.role === 'Doctor');

  const caseload = (name) => patients.filter((p) => p.doctor === name && p.status !== 'Discharged').length;
  const accept = (id) => setReferrals((prev) => prev.map((r) => r.id === id ? { ...r, status: 'Accepted' } : r));

  return (
    <div className="space-y-5">
      <PageHeader title="Doctors" subtitle="Roster, live caseload & referrals" />

      <KpiGrid cols={4}>
        <Kpi title="Doctors" value={doctors.length} icon={UserRound} tone="blue" />
        <Kpi title="On Duty" value={doctors.filter((d) => d.present).length} icon={CheckCircle2} tone="green" />
        <Kpi title="Active Patients" value={patients.filter((p) => p.doctor !== 'Unassigned' && p.status !== 'Discharged').length} icon={Stethoscope} tone="blue" />
        <Kpi title="Open Referrals" value={referrals.filter((r) => r.status === 'Pending').length} icon={Share2} tone="amber" />
      </KpiGrid>

      <Tabs tabs={['Doctors', 'Referrals']} active={tab} onChange={setTab} />

      {tab === 'Doctors' && (
        <Table headers={['Staff ID', 'Name', 'Department', 'Shift', 'Qualification', 'On Duty', 'Caseload']}>
          {doctors.map((d) => (
            <Tr key={d.id}>
              <Td className="font-semibold text-slate-800">{d.staffId}</Td>
              <Td className="font-medium">{d.name}</Td>
              <Td>{d.dept}</Td>
              <Td>{d.shift}</Td>
              <Td>{d.qualification}</Td>
              <Td><Badge value={d.present ? 'On Duty' : 'Absent'}>{d.present ? 'On Duty' : 'Off'}</Badge></Td>
              <Td className="font-bold">{caseload(d.name)}</Td>
            </Tr>
          ))}
        </Table>
      )}

      {tab === 'Referrals' && (
        <Table headers={['Ref', 'Patient', 'From', 'To Department', 'Reason', 'Date', 'Status', '']}>
          {referrals.map((r) => (
            <Tr key={r.id}>
              <Td className="font-semibold text-slate-800">{r.id}</Td>
              <Td className="font-medium">{r.patient}</Td>
              <Td>{r.from}</Td>
              <Td>{r.toDept}</Td>
              <Td>{r.reason}</Td>
              <Td>{r.date}</Td>
              <Td><Badge value={r.status === 'Accepted' ? 'Approved' : 'Pending'}>{r.status}</Badge></Td>
              <Td>
                <RowActions>
                  {r.status === 'Pending' && <ActionBtn tone="navy" onClick={() => accept(r.id)}>Accept</ActionBtn>}
                  <DeleteBtn onDelete={() => setReferrals((prev) => prev.filter((x) => x.id !== r.id))} />
                </RowActions>
              </Td>
            </Tr>
          ))}
        </Table>
      )}

      <SectionCard title="Today's Doctor Schedule">
        <div className="space-y-2">
          {appointments.filter((a) => a.date === '2026-07-19').map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
              <div><div className="text-[13px] font-semibold text-slate-800">{a.time} · {a.patient}</div><div className="text-[11px] text-slate-500">{a.doctor} · {a.dept}</div></div>
              <Badge value={a.status} />
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
