import React, { useState } from 'react';
import { Pill, Clock, CheckCircle2, AlertTriangle, Snowflake } from 'lucide-react';
import { PageHeader, KpiGrid, Kpi, FilterBar, Select, Table, Td, Tr, Badge, Tabs, Modal, Button, Field, ActionBtn, RowActions, DeleteBtn } from '../components/ui';
import { RX_STATUSES } from '../data/extraData';

const NEXT = { Pending: 'Being Prepared', 'Being Prepared': 'Dispensed' };

export default function Pharmacy({ store }) {
  const { prescriptions, setPrescriptions, pharmacyStock, setPharmacyStock } = store;
  const [tab, setTab] = useState('Prescriptions');
  const [status, setStatus] = useState('');
  const [sel, setSel] = useState(null);

  const rxRows = prescriptions.filter((r) => !status || r.status === status);
  const advance = (r) => {
    const n = NEXT[r.status];
    if (!n) return;
    setPrescriptions((prev) => prev.map((x) => x.id === r.id ? { ...x, status: n } : x));
    if (sel?.id === r.id) setSel((s) => ({ ...s, status: n }));
  };
  const reorder = (id) => setPharmacyStock((prev) => prev.map((s) => s.id === id ? { ...s, qty: s.qty + s.reorder, status: 'OK' } : s));

  return (
    <div className="space-y-5">
      <PageHeader title="Pharmacy" subtitle="Prescription dispensing, stock levels & cold chain" />

      <KpiGrid cols={4}>
        <Kpi title="Pending Rx" value={prescriptions.filter((r) => r.status === 'Pending').length} icon={Clock} tone="amber" />
        <Kpi title="Dispensed Today" value={prescriptions.filter((r) => r.status === 'Dispensed').length} icon={CheckCircle2} tone="green" />
        <Kpi title="Low Stock Items" value={pharmacyStock.filter((s) => s.status === 'Low').length} icon={AlertTriangle} tone="red" />
        <Kpi title="Cold-Chain Items" value={pharmacyStock.filter((s) => s.coldChain).length} icon={Snowflake} tone="blue" />
      </KpiGrid>

      <Tabs tabs={['Prescriptions', 'Stock']} active={tab} onChange={setTab} />

      {tab === 'Prescriptions' && (
        <>
          <FilterBar>
            <Select value={status} onChange={setStatus} options={RX_STATUSES} label="All statuses" />
          </FilterBar>
          <Table headers={['Rx', 'Patient', 'Prescriber', 'Items', 'Time', 'Status', '']}>
            {rxRows.map((r) => (
              <Tr key={r.id} onClick={() => setSel(r)}>
                <Td className="font-semibold text-slate-800">{r.id}</Td>
                <Td className="font-medium">{r.patient}</Td>
                <Td>{r.prescriber}</Td>
                <Td>{r.items.length} item(s)</Td>
                <Td>{r.time}</Td>
                <Td><Badge value={r.status === 'Dispensed' ? 'Completed' : r.status === 'Pending' ? 'Pending' : 'In Progress'}>{r.status}</Badge></Td>
                <Td onClick={(e) => e.stopPropagation()}>
                  <RowActions>
                    {NEXT[r.status] && <ActionBtn tone={NEXT[r.status] === 'Dispensed' ? 'success' : 'navy'} onClick={() => advance(r)}>{NEXT[r.status]}</ActionBtn>}
                    <DeleteBtn onDelete={() => setPrescriptions((prev) => prev.filter((x) => x.id !== r.id))} />
                  </RowActions>
                </Td>
              </Tr>
            ))}
          </Table>
        </>
      )}

      {tab === 'Stock' && (
        <Table headers={['Code', 'Drug', 'Category', 'Qty', 'Reorder', 'Expiry', 'Cold Chain', 'Status', '']}>
          {pharmacyStock.map((s) => (
            <Tr key={s.id}>
              <Td className="font-semibold text-slate-800">{s.id}</Td>
              <Td className="font-medium">{s.drug}</Td>
              <Td>{s.category}</Td>
              <Td className={s.status === 'Low' ? 'text-red-600 font-bold' : ''}>{s.qty}</Td>
              <Td>{s.reorder}</Td>
              <Td>{s.expiry}</Td>
              <Td>{s.coldChain ? <Badge tone="blue">Yes</Badge> : '—'}</Td>
              <Td><Badge value={s.status === 'OK' ? 'Active' : 'Low'}>{s.status}</Badge></Td>
              <Td>
                <RowActions>
                  {s.status === 'Low' && <ActionBtn tone="amber" onClick={() => reorder(s.id)}>Reorder</ActionBtn>}
                  <DeleteBtn onDelete={() => setPharmacyStock((prev) => prev.filter((x) => x.id !== s.id))} />
                </RowActions>
              </Td>
            </Tr>
          ))}
        </Table>
      )}

      <Modal open={!!sel} onClose={() => setSel(null)} title={sel?.patient} subtitle={sel ? `${sel.id} · ${sel.prescriber}` : ''}
        footer={sel && NEXT[sel.status] && <Button onClick={() => advance(sel)}>{NEXT[sel.status]}</Button>}>
        {sel && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Status" value={<Badge value={sel.status === 'Dispensed' ? 'Completed' : 'Pending'}>{sel.status}</Badge>} />
              <Field label="Prescribed" value={sel.time} />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Medication</div>
              <Table headers={['Drug', 'Dose', 'Qty']}>
                {sel.items.map((it, i) => (<Tr key={i}><Td className="font-medium">{it.drug}</Td><Td>{it.dose}</Td><Td>{it.qty}</Td></Tr>))}
              </Table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
