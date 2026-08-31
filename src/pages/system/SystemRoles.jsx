import React from 'react';
import { KeyRound } from 'lucide-react';
import { PageHeader, KpiGrid, Kpi, Table, Td, Tr, Badge } from '../../components/ui';
import { ROLES, MODULES, ROLE_DASHBOARD } from '../../config/platform';

export default function SystemRoles({ store }) {
  const moduleCount = (role) => MODULES.filter((m) => m.roles === '*' || m.roles.includes(role)).length;
  const userCount = (role) => store.allUsers.filter((u) => u.role === role).length;

  return (
    <div className="space-y-5">
      <PageHeader title="Roles" subtitle="Role definitions, module reach & default landing" />

      <KpiGrid cols={3}>
        <Kpi title="Roles Defined" value={ROLES.length} icon={KeyRound} tone="blue" />
        <Kpi title="Modules" value={MODULES.length} icon={KeyRound} tone="slate" />
        <Kpi title="Active Sessions" value={store.allUsers.length} icon={KeyRound} tone="green" />
      </KpiGrid>

      <Table headers={['Role', 'Users', 'Accessible Modules', 'Default Landing']}>
        {ROLES.map((r) => (
          <Tr key={r}>
            <Td className="font-semibold text-slate-800">{r}</Td>
            <Td>{userCount(r)}</Td>
            <Td><Badge tone="blue">{moduleCount(r)} modules</Badge></Td>
            <Td>{r === 'Hospital Administrator' || r === 'System Administrator' || r === 'Medical Director' || r === 'Department Head' ? 'General Dashboard' : (ROLE_DASHBOARD[r] || 'General Dashboard')}</Td>
          </Tr>
        ))}
      </Table>
    </div>
  );
}
