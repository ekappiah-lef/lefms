import React, { useState } from 'react';
import { LogOut, CheckCircle2, Wallet } from 'lucide-react';
import { PageHeader, KpiGrid, Kpi, Table, Td, Tr, Badge, Modal, Button, Field, ActionBtn, RowActions, DeleteBtn } from '../components/ui';

export default function Discharges({ store }) {
  const { discharges, setDischarges, go } = store;
  const [sel, setSel] = useState(null);

  const settle = (id) => {
    setDischarges((prev) => prev.map((d) => d.id === id ? { ...d, billStatus: 'Paid' } : d));
    if (sel?.id === id) setSel((s) => ({ ...s, billStatus: 'Paid' }));
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Discharges" subtitle="Discharge register, summaries & billing clearance" />

      <KpiGrid cols={3}>
        <Kpi title="Discharged Today" value={discharges.filter((d) => d.dischargedAt?.startsWith('2026-07-19')).length} icon={LogOut} tone="green" />
        <Kpi title="Bill Cleared" value={discharges.filter((d) => d.billStatus === 'Paid').length} icon={CheckCircle2} tone="green" />
        <Kpi title="Bill Pending" value={discharges.filter((d) => d.billStatus !== 'Paid').length} icon={Wallet} tone="amber" />
      </KpiGrid>

      <Table headers={['Ref', 'Patient', 'Ward', 'Discharged', 'Follow-up', 'Bill', '']}>
        {discharges.map((d) => (
          <Tr key={d.id} onClick={() => setSel(d)}>
            <Td className="font-semibold text-slate-800">{d.id}</Td>
            <Td className="font-medium">{d.patient}</Td>
            <Td>{d.ward}</Td>
            <Td>{d.dischargedAt}</Td>
            <Td>{d.followUp}</Td>
            <Td><Badge value={d.billStatus === 'Paid' ? 'Paid' : d.billStatus === 'NHIS Claim' ? 'NHIS Claim' : 'Pending'}>{d.billStatus}</Badge></Td>
            <Td onClick={(e) => e.stopPropagation()}>
              <RowActions>
                {d.billStatus !== 'Paid' && <ActionBtn tone="success" onClick={() => settle(d.id)}>Settle</ActionBtn>}
                <DeleteBtn onDelete={() => setDischarges((prev) => prev.filter((x) => x.id !== d.id))} />
              </RowActions>
            </Td>
          </Tr>
        ))}
      </Table>

      <Modal open={!!sel} onClose={() => setSel(null)} title={sel?.patient} subtitle={sel ? `${sel.id} · ${sel.ward}` : ''}
        footer={sel && (<><Button variant="ghost" onClick={() => go('finance')}>Open Billing</Button>{sel.billStatus !== 'Paid' && <Button icon={Wallet} onClick={() => settle(sel.id)}>Mark Bill Paid</Button>}</>)}>
        {sel && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Patient No" value={sel.patientId} />
            <Field label="Admission Ref" value={sel.admissionId} />
            <Field label="Discharged" value={sel.dischargedAt} />
            <Field label="Follow-up" value={sel.followUp} />
            <Field label="Bill Status" value={<Badge value={sel.billStatus === 'Paid' ? 'Paid' : 'Pending'}>{sel.billStatus}</Badge>} />
            <Field label="Discharge Summary" value={sel.summary} full />
          </div>
        )}
      </Modal>
    </div>
  );
}
