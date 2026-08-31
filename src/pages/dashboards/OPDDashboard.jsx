import React from 'react';
import { Clock, Stethoscope, CheckCircle2, UserRound, Timer, AlertTriangle, ArrowRight } from 'lucide-react';
import { Kpi, KpiGrid, SectionCard, PageHeader, Badge, Button } from '../../components/ui';

export default function OPDDashboard({ store }) {
  const { patients, employees, go } = store;
  const opd = patients.filter((p) => p.department === 'OPD' || p.department === 'Emergency');
  const waiting = opd.filter((p) => ['Waiting', 'Waiting for Doctor', 'In Triage'].includes(p.status));
  const inConsult = opd.filter((p) => p.status === 'In Consultation');
  const completed = 18;
  const doctorsAvail = employees.filter((e) => e.role === 'Doctor' && e.present).length;
  const avgWait = Math.round(opd.reduce((s, p) => s + (p.waitingMins || 0), 0) / (opd.length || 1));
  const priority = opd.filter((p) => ['Urgent', 'Emergency'].includes(p.priority));

  return (
    <div className="space-y-5">
      <PageHeader title="OPD Dashboard" subtitle="Outpatient department — live consultation queue & patient flow"
        actions={<Button icon={ArrowRight} onClick={() => go('opd')}>Open Patient Flow</Button>} />

      <KpiGrid cols={6}>
        <Kpi title="Patients Waiting" value={waiting.length} icon={Clock} tone="amber" />
        <Kpi title="Being Attended" value={inConsult.length} icon={Stethoscope} tone="blue" />
        <Kpi title="Completed" value={completed} icon={CheckCircle2} tone="green" />
        <Kpi title="Doctors Available" value={doctorsAvail} icon={UserRound} tone="blue" />
        <Kpi title="Avg Wait (min)" value={avgWait} icon={Timer} tone={avgWait > 30 ? 'red' : 'green'} />
        <Kpi title="Priority Patients" value={priority.length} icon={AlertTriangle} tone="red" />
      </KpiGrid>

      <SectionCard title="Consultation Queue" action={<button onClick={() => go('opd')} className="text-[11px] font-semibold text-blue-600">Manage flow</button>}>
        <div className="space-y-2">
          {opd.filter((p) => p.status !== 'Discharged').map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2 hover:bg-slate-50">
              <div className="flex items-center gap-3 min-w-[180px]">
                <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[11px] font-bold">
                  {p.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-slate-800">{p.name}</div>
                  <div className="text-[11px] text-slate-500">{p.id} · arrived {p.arrivalTime}</div>
                </div>
              </div>
              <div className="text-[12px] text-slate-600 min-w-[120px]">{p.doctor}<div className="text-[11px] text-slate-400">Room {p.room}</div></div>
              <div className="text-[12px] text-slate-600 min-w-[70px]">{p.waitingMins}m wait</div>
              <div className="flex items-center gap-2">
                <Badge value={p.priority} />
                <Badge value={p.status} />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
