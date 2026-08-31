import React, { useState } from 'react';
import { UserCheck, UserX, PlaneTakeoff } from 'lucide-react';
import { PageHeader, KpiGrid, Kpi, FilterBar, Select, Table, Td, Tr, Badge, Button } from '../components/ui';

export default function StaffAttendance({ store }) {
  const { employees, setEmployees } = store;
  const [dept, setDept] = useState('');
  const depts = [...new Set(employees.map((e) => e.dept))];
  const rows = employees.filter((e) => !dept || e.dept === dept);

  const toggle = (id) => setEmployees((prev) => prev.map((e) => e.id === id ? { ...e, present: !e.present } : e));

  return (
    <div className="space-y-5">
      <PageHeader title="Staff Attendance" subtitle="Daily clock-in status · 2026-07-19" />
      <KpiGrid cols={3}>
        <Kpi title="Present" value={employees.filter((e) => e.present).length} icon={UserCheck} tone="green" />
        <Kpi title="Absent" value={employees.filter((e) => !e.present && e.status === 'Active').length} icon={UserX} tone="red" />
        <Kpi title="On Leave" value={employees.filter((e) => e.status === 'On Leave').length} icon={PlaneTakeoff} tone="amber" />
      </KpiGrid>
      <FilterBar>
        <Select value={dept} onChange={setDept} options={depts} label="All departments" />
      </FilterBar>
      <Table headers={['Staff ID', 'Name', 'Role', 'Department', 'Shift', 'Attendance', 'Mark']}>
        {rows.map((e) => (
          <Tr key={e.id}>
            <Td className="font-semibold text-slate-800">{e.staffId}</Td>
            <Td className="font-medium">{e.name}</Td>
            <Td>{e.role}</Td>
            <Td>{e.dept}</Td>
            <Td>{e.shift}</Td>
            <Td>{e.status === 'On Leave' ? <Badge value="On Leave" /> : <Badge value={e.present ? 'Present' : 'Absent'}>{e.present ? 'Present' : 'Absent'}</Badge>}</Td>
            <Td>{e.status !== 'On Leave' && <Button size="sm" variant={e.present ? 'ghost' : 'success'} onClick={() => toggle(e.id)}>{e.present ? 'Mark Absent' : 'Mark Present'}</Button>}</Td>
          </Tr>
        ))}
      </Table>
    </div>
  );
}
