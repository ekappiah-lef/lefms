import React from 'react';
import { BedDouble, DoorOpen, CalendarClock, Wrench, Sparkles, Users, ArrowRight } from 'lucide-react';
import { Kpi, KpiGrid, SectionCard, PageHeader, Badge, Button } from '../../components/ui';

export default function WardDashboard({ store }) {
  const { wards, requests, go } = store;
  const beds = wards.flatMap((w) => w.beds);
  const count = (s) => beds.filter((b) => b.status === s).length;
  const staffOnDuty = wards.reduce((s, w) => s + w.staffOnDuty, 0);
  const wardRequests = requests.filter((r) => ['Wards', 'ICU'].includes(r.dept));

  return (
    <div className="space-y-5">
      <PageHeader title="Ward Dashboard" subtitle="Ward operations — bed status, admissions & ward requests"
        actions={<Button icon={ArrowRight} onClick={() => go('bed-mgmt')}>Bed Management</Button>} />

      <KpiGrid cols={6}>
        <Kpi title="Total Beds" value={beds.length} icon={BedDouble} tone="slate" />
        <Kpi title="Available" value={count('Available')} icon={DoorOpen} tone="green" />
        <Kpi title="Occupied" value={count('Occupied')} icon={BedDouble} tone="blue" />
        <Kpi title="Reserved" value={count('Reserved')} icon={CalendarClock} tone="amber" />
        <Kpi title="Cleaning" value={count('Cleaning')} icon={Sparkles} tone="amber" />
        <Kpi title="Under Maintenance" value={count('Maintenance')} icon={Wrench} tone="red" onClick={() => go('requests')} />
      </KpiGrid>

      <div className="grid lg:grid-cols-2 gap-4">
        <SectionCard title="Ward Staff on Duty" action={<span className="text-[11px] text-slate-500">{staffOnDuty} total</span>}>
          <div className="space-y-2.5">
            {wards.map((w) => (
              <div key={w.id} className="flex items-center justify-between border-b border-slate-50 pb-2 last:border-0">
                <div className="flex items-center gap-2"><Users className="h-4 w-4 text-slate-400" /><span className="text-[13px] font-medium text-slate-700">{w.name}</span></div>
                <Badge tone="green">{w.staffOnDuty} on duty</Badge>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Ward & Equipment Requests" action={<Button size="sm" variant="subtle" onClick={() => go('requests')}>Raise</Button>}>
          <div className="space-y-2.5">
            {wardRequests.map((r) => (
              <div key={r.id} className="flex items-center justify-between border-b border-slate-50 pb-2 last:border-0">
                <div>
                  <div className="text-[13px] font-semibold text-slate-800">{r.equipment}</div>
                  <div className="text-[11px] text-slate-500">{r.location} · {r.id}</div>
                </div>
                <div className="flex items-center gap-2"><Badge value={r.priority} /><Badge value={r.status} /></div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Compact bed map per ward */}
      <SectionCard title="Bed Overview">
        <div className="space-y-4">
          {wards.map((w) => (
            <div key={w.id}>
              <div className="text-[12px] font-bold text-slate-600 mb-2">{w.name} <span className="text-slate-400 font-normal">· {w.building} · {w.floor}</span></div>
              <div className="flex flex-wrap gap-2">
                {w.beds.map((b) => (
                  <span key={b.id} className={`px-2 py-1 rounded-md text-[11px] font-semibold ring-1 ${bedTone(b.status)}`} title={b.patient || b.status}>{b.id}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function bedTone(s) {
  return {
    Available: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    Occupied: 'bg-blue-50 text-blue-700 ring-blue-200',
    Reserved: 'bg-amber-50 text-amber-700 ring-amber-200',
    Cleaning: 'bg-amber-50 text-amber-600 ring-amber-200',
    Maintenance: 'bg-red-50 text-red-700 ring-red-200',
    Isolation: 'bg-purple-50 text-purple-700 ring-purple-200',
    Unavailable: 'bg-slate-100 text-slate-500 ring-slate-200',
  }[s] || 'bg-slate-100 text-slate-500 ring-slate-200';
}
