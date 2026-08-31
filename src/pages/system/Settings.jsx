import React, { useState } from 'react';
import { Building2, Hash, Bell, Palette, Plug } from 'lucide-react';
import { PageHeader, SectionCard, Tabs, Field, Button, Badge } from '../../components/ui';
import { HOSPITAL, ORGANIZATION } from '../../data/mockData';

export default function Settings() {
  const [tab, setTab] = useState('Facility');

  return (
    <div className="space-y-5">
      <PageHeader title="Settings" subtitle="Hospital profile, numbering, notifications & integrations" />

      <Tabs tabs={['Facility', 'Numbering', 'Notifications', 'Branding', 'Integrations']} active={tab} onChange={setTab} />

      {tab === 'Facility' && (
        <SectionCard title="Facility Profile">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Organisation" value={ORGANIZATION.name} />
            <Field label="Hospital" value={HOSPITAL.name} />
            <Field label="Code" value={HOSPITAL.code} />
            <Field label="City" value={HOSPITAL.city} />
            <Field label="Facility Type" value="Medium-to-large general hospital" />
            <Field label="Time Zone" value="GMT (Africa/Accra)" />
          </div>
          <div className="mt-4"><Button>Edit Profile</Button></div>
        </SectionCard>
      )}

      {tab === 'Numbering' && (
        <SectionCard title="Numbering Schemes">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Patient No" value="P-1000## (auto-increment)" />
            <Field label="Ticket No" value="MR-YYYY-###" />
            <Field label="Work Order No" value="WO-YYYY-###" />
            <Field label="Admission No" value="ADM-####" />
            <Field label="Invoice No" value="INVC-####" />
            <Field label="Staff ID" value="MGH-####" />
          </div>
        </SectionCard>
      )}

      {tab === 'Notifications' && (
        <SectionCard title="Notification Rules">
          {[
            ['Critical / Emergency maintenance ticket', 'Maintenance Manager + Admin', true],
            ['Bed flagged for maintenance', 'Ward Manager + Maintenance', true],
            ['Leave request submitted', 'HR Officer', true],
            ['Low stock threshold reached', 'Inventory Officer', true],
            ['Lab result verified', 'Ordering doctor', false],
          ].map(([rule, target, on]) => (
            <div key={rule} className="flex items-center justify-between border-b border-slate-50 py-2.5 last:border-0">
              <div><div className="text-[13px] font-medium text-slate-800">{rule}</div><div className="text-[11px] text-slate-500">Notifies: {target}</div></div>
              <Badge value={on ? 'Active' : 'Pending'}>{on ? 'On' : 'Off'}</Badge>
            </div>
          ))}
        </SectionCard>
      )}

      {tab === 'Branding' && (
        <SectionCard title="Branding & Theme">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Primary Colour" value={<span className="inline-flex items-center gap-2"><span className="h-4 w-4 rounded bg-blue-600" />Blue 600</span>} />
            <Field label="Sidebar" value={<span className="inline-flex items-center gap-2"><span className="h-4 w-4 rounded bg-slate-950" />Slate 950</span>} />
            <Field label="Logo" value="Cross mark (default)" />
            <Field label="Login Screen" value="Hospital name + tagline" />
          </div>
        </SectionCard>
      )}

      {tab === 'Integrations' && (
        <SectionCard title="Integrations & API">
          {[
            ['NHIS Claims Gateway', 'Connected', true],
            ['SMS Appointment Reminders', 'Connected', true],
            ['Laboratory Analyzer (HL7)', 'Phase 2', false],
            ['Accounting Export (QuickBooks)', 'Phase 2', false],
          ].map(([name, state, on]) => (
            <div key={name} className="flex items-center justify-between border-b border-slate-50 py-2.5 last:border-0">
              <div className="flex items-center gap-2"><Plug className="h-4 w-4 text-slate-400" /><span className="text-[13px] font-medium text-slate-800">{name}</span></div>
              <Badge value={on ? 'Active' : 'Pending'}>{state}</Badge>
            </div>
          ))}
        </SectionCard>
      )}
    </div>
  );
}
