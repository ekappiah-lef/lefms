import React, { useState } from 'react';
import { FlaskConical, Clock, CheckCircle2, AlertTriangle, Plus } from 'lucide-react';
import { PageHeader, KpiGrid, Kpi, FilterBar, Select, Table, Td, Tr, Badge, Modal, Button, Field, ActionBtn, RowActions, DeleteBtn } from '../components/ui';
import { LAB_STATUSES, LAB_TEST_TYPES } from '../data/extraData';

const NEXT = { Ordered: 'Sample Collected', 'Sample Collected': 'In Progress', 'In Progress': 'Resulted', Resulted: 'Verified' };

export default function Laboratory({ store }) {
  const { labOrders, setLabOrders, patients } = store;
  const [status, setStatus] = useState('');
  const [sel, setSel] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const rows = labOrders.filter((o) => !status || o.status === status);

  const advance = (o, result) => {
    const n = NEXT[o.status];
    if (!n) return;
    const patch = { status: n };
    if (n === 'Sample Collected') patch.collectedAt = new Date().toTimeString().slice(0, 5);
    if (result) patch.result = result;
    setLabOrders((prev) => prev.map((x) => x.id === o.id ? { ...x, ...patch } : x));
    if (sel?.id === o.id) setSel((s) => ({ ...s, ...patch }));
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Laboratory" subtitle="Test orders, sample tracking & results"
        actions={<Button icon={Plus} onClick={() => setShowNew(true)}>New Order</Button>} />

      <KpiGrid cols={4}>
        <Kpi title="Open Orders" value={labOrders.filter((o) => !['Resulted', 'Verified'].includes(o.status)).length} icon={FlaskConical} tone="blue" />
        <Kpi title="Awaiting Sample" value={labOrders.filter((o) => o.status === 'Ordered').length} icon={Clock} tone="amber" />
        <Kpi title="Urgent" value={labOrders.filter((o) => o.priority === 'Urgent').length} icon={AlertTriangle} tone="red" />
        <Kpi title="Resulted" value={labOrders.filter((o) => ['Resulted', 'Verified'].includes(o.status)).length} icon={CheckCircle2} tone="green" />
      </KpiGrid>

      <FilterBar>
        <Select value={status} onChange={setStatus} options={LAB_STATUSES} label="All statuses" />
      </FilterBar>

      <Table headers={['Order', 'Patient', 'Tests', 'Ordered By', 'Priority', 'Collected', 'Status', '']}>
        {rows.map((o) => (
          <Tr key={o.id} onClick={() => setSel(o)}>
            <Td className="font-semibold text-slate-800">{o.id}</Td>
            <Td className="font-medium">{o.patient}</Td>
            <Td>{o.tests.join(', ')}</Td>
            <Td>{o.orderedBy}</Td>
            <Td><Badge value={o.priority} /></Td>
            <Td>{o.collectedAt || '—'}</Td>
            <Td><Badge value={o.status === 'Verified' || o.status === 'Resulted' ? 'Completed' : o.status === 'In Progress' ? 'In Progress' : o.status === 'Ordered' ? 'Pending' : 'Assigned'}>{o.status}</Badge></Td>
            <Td onClick={(e) => e.stopPropagation()}>
              <RowActions>
                {NEXT[o.status] && <ActionBtn tone={NEXT[o.status] === 'Resulted' ? 'success' : 'navy'} onClick={() => advance(o, NEXT[o.status] === 'Resulted' ? 'Result pending review' : '')}>{NEXT[o.status]}</ActionBtn>}
                <DeleteBtn onDelete={() => setLabOrders((prev) => prev.filter((x) => x.id !== o.id))} />
              </RowActions>
            </Td>
          </Tr>
        ))}
      </Table>

      <Modal open={!!sel} onClose={() => setSel(null)} title={sel?.patient} subtitle={sel ? `${sel.id} · ${sel.tests?.join(', ')}` : ''}
        footer={sel && NEXT[sel.status] && <Button onClick={() => advance(sel, NEXT[sel.status] === 'Resulted' ? 'Result pending review' : '')}>Move to {NEXT[sel.status]}</Button>}>
        {sel && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Patient No" value={sel.patientId} />
            <Field label="Priority" value={<Badge value={sel.priority} />} />
            <Field label="Ordered By" value={sel.orderedBy} />
            <Field label="Status" value={sel.status} />
            <Field label="Tests" value={sel.tests?.join(', ')} full />
            <Field label="Result" value={sel.result || 'Not yet resulted'} full />
          </div>
        )}
      </Modal>

      <NewOrder open={showNew} onClose={() => setShowNew(false)} patients={patients} onSave={(o) => { setLabOrders((prev) => [o, ...prev]); setShowNew(false); }} />
    </div>
  );
}

function NewOrder({ open, onClose, onSave, patients }) {
  const [f, setF] = useState({ patientKey: '', test: LAB_TEST_TYPES[0], orderedBy: 'Dr. Priya Nair', priority: 'Routine' });
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const patient = patients.find((p) => `${p.id} — ${p.name}` === f.patientKey);
  const save = () => {
    if (!patient) return;
    onSave({ id: 'LAB-' + Math.floor(7005 + Math.random() * 900), patientId: patient.id, patient: patient.name, tests: [f.test], orderedBy: f.orderedBy, priority: f.priority, status: 'Ordered', collectedAt: '', result: '' });
  };
  return (
    <Modal open={open} onClose={onClose} title="New Lab Order" subtitle="Select a registered patient record" width="max-w-2xl"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={!patient}>Order Test</Button></>}>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><label className="text-[11px] font-semibold text-slate-600">Patient (from Patient Records)</label><div className="mt-1"><Select value={f.patientKey} onChange={set('patientKey')} options={patients.map((p) => `${p.id} — ${p.name}`)} label="Select a registered patient…" /></div></div>
        <div><label className="text-[11px] font-semibold text-slate-600">Test</label><div className="mt-1"><Select value={f.test} onChange={set('test')} options={LAB_TEST_TYPES} /></div></div>
        <div><label className="text-[11px] font-semibold text-slate-600">Priority</label><div className="mt-1"><Select value={f.priority} onChange={set('priority')} options={['Routine', 'Urgent']} /></div></div>
        <div className="col-span-2"><label className="text-[11px] font-semibold text-slate-600">Ordered By</label><div className="mt-1"><Select value={f.orderedBy} onChange={set('orderedBy')} options={['Dr. Priya Nair', 'Dr. Kojo Amankwah', 'Dr. Naomi Asante']} /></div></div>
      </div>
    </Modal>
  );
}
