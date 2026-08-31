import React, { useState } from 'react';
import { Building2, BedDouble, Users, ArrowRight } from 'lucide-react';
import { PageHeader, KpiGrid, Kpi, SectionCard, Table, Td, Tr, Badge, Button } from '../components/ui';

export default function Wards({ store }) {
  const { wards, go } = store;
  const beds = wards.flatMap((w) => w.beds);

  return (
    <div className="space-y-5">
      <PageHeader title="Wards" subtitle="Ward directory, capacity & staffing"
        actions={<Button icon={ArrowRight} onClick={() => go('bed-mgmt')}>Open Bed Management</Button>} />

      <KpiGrid cols={3}>
        <Kpi title="Total Wards" value={wards.length} icon={Building2} tone="blue" />
        <Kpi title="Total Beds" value={beds.length} icon={BedDouble} tone="slate" />
        <Kpi title="Staff on Duty" value={wards.reduce((s, w) => s + w.staffOnDuty, 0)} icon={Users} tone="green" />
      </KpiGrid>

      <Table headers={['Ward', 'Building', 'Floor', 'Capacity', 'Occupied', 'Available', 'Staff', 'Occupancy', '']}>
        {wards.map((w) => {
          const occ = w.beds.filter((b) => b.status === 'Occupied').length;
          const avail = w.beds.filter((b) => b.status === 'Available').length;
          const pct = Math.round((occ / w.beds.length) * 100);
          return (
            <Tr key={w.id} onClick={() => go('bed-mgmt')}>
              <Td className="font-semibold text-slate-800">{w.name}</Td>
              <Td>{w.building}</Td>
              <Td>{w.floor}</Td>
              <Td>{w.beds.length}</Td>
              <Td>{occ}</Td>
              <Td className="text-emerald-600 font-semibold">{avail}</Td>
              <Td>{w.staffOnDuty}</Td>
              <Td>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-16 rounded-full bg-slate-100 overflow-hidden"><div className={`h-full ${pct > 85 ? 'bg-red-500' : pct > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} /></div>
                  <span className="text-[11px] font-semibold text-slate-600">{pct}%</span>
                </div>
              </Td>
              <Td><span className="text-[11px] font-semibold text-blue-600">Beds</span></Td>
            </Tr>
          );
        })}
      </Table>
    </div>
  );
}
