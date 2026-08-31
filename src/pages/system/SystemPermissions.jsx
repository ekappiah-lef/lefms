import React, { useState } from 'react';
import { Check, X, Save } from 'lucide-react';
import { PageHeader, SectionCard, Select, Table, Td, Tr, Badge, Button, ActionBtn } from '../../components/ui';
import { ROLES, MODULES, canAccess, NAV_GROUP_ORDER } from '../../config/platform';

const ADMIN_ROLES = ['Hospital Administrator', 'System Administrator'];
const APPROVER = ['Maintenance Manager', 'HR Officer', 'Ward Manager', 'Medical Director', 'Finance Officer'];

function actionsFor(role, m) {
  const a = ['View'];
  if (!['hospital-reports', 'maintenance-reports', 'hr-reports', 'sys-roles', 'sys-permissions'].includes(m.id)) a.push('Create');
  if (ADMIN_ROLES.includes(role) || APPROVER.includes(role)) a.push('Approve');
  if (ADMIN_ROLES.includes(role)) a.push('Delete');
  return a;
}

export default function SystemPermissions() {
  const [role, setRole] = useState('Maintenance Manager');
  const [overrides, setOverrides] = useState({}); // `${role}:${moduleId}` -> boolean
  const [dirty, setDirty] = useState(false);

  const allowed = (m) => {
    const key = `${role}:${m.id}`;
    return key in overrides ? overrides[key] : canAccess(role, m.id);
  };
  const toggle = (m) => { setOverrides((o) => ({ ...o, [`${role}:${m.id}`]: !allowed(m) })); setDirty(true); };

  return (
    <div className="space-y-5">
      <PageHeader title="Permissions" subtitle="Role → module → action matrix (edit access per role)"
        actions={<Button icon={Save} onClick={() => setDirty(false)} disabled={!dirty}>{dirty ? 'Save Changes' : 'Saved'}</Button>} />

      <SectionCard title="Role permission profile" action={
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-slate-500">Editing:</span>
          <Select value={role} onChange={(v) => setRole(v)} options={ROLES} />
        </div>
      }>
        <div className="space-y-5">
          {NAV_GROUP_ORDER.filter((g) => g !== 'Overview').map((group) => {
            const mods = MODULES.filter((m) => m.group === group);
            return (
              <div key={group}>
                <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">{group}</div>
                <Table headers={['Module', 'Access', 'Permitted Actions', 'Toggle']}>
                  {mods.map((m) => {
                    const on = allowed(m);
                    const acts = on ? actionsFor(role, m) : [];
                    return (
                      <Tr key={m.id}>
                        <Td className="font-medium">{m.label}</Td>
                        <Td>{on
                          ? <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-[12px]"><Check className="h-4 w-4" />Allowed</span>
                          : <span className="inline-flex items-center gap-1 text-slate-400 font-semibold text-[12px]"><X className="h-4 w-4" />Denied</span>}</Td>
                        <Td>{acts.length ? <div className="flex flex-wrap gap-1">{acts.map((a) => <Badge key={a} tone={a === 'Delete' ? 'red' : a === 'Approve' ? 'amber' : 'blue'}>{a}</Badge>)}</div> : '—'}</Td>
                        <Td onClick={(e) => e.stopPropagation()}><ActionBtn tone={on ? 'outline' : 'success'} onClick={() => toggle(m)}>{on ? 'Revoke' : 'Grant'}</ActionBtn></Td>
                      </Tr>
                    );
                  })}
                </Table>
              </div>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}
