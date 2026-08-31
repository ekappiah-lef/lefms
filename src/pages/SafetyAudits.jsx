import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle2, Plus } from 'lucide-react';
import { PageHeader, KpiGrid, Kpi, Table, Td, Tr, Badge, Modal, Button, Field, IconBtn, Select, RowActions, DeleteBtn } from '../components/ui';
import { INITIAL_EMPLOYEES } from '../data/mockData';
import { Eye } from 'lucide-react';

const AUDIT_TYPES = ['Infection Control', 'Fire Safety', 'Electrical Safety', 'Food Safety', 'Radiation Safety', 'Waste Management'];
const INSPECTORS = INITIAL_EMPLOYEES.filter((e) => ['Engineer', 'Biomedical Engineer', 'Ward Manager'].includes(e.role)).map((e) => e.name);

export default function SafetyAudits({ store }) {
  const { inspections, setInspections } = store;
  const [sel, setSel] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const passed = inspections.filter((i) => i.status === 'Passed').length;
  const action = inspections.filter((i) => i.status === 'Action Required').length;
  const avg = Math.round(inspections.reduce((s, i) => s + i.score, 0) / (inspections.length || 1));

  return (
    <div className="space-y-5">
      <PageHeader title="Safety Audits" subtitle="Infection control, fire, electrical & food-safety inspections"
        actions={<Button icon={Plus} onClick={() => setShowNew(true)}>New Audit</Button>} />
      <KpiGrid cols={4}>
        <Kpi title="Audits (30d)" value={inspections.length} icon={ShieldCheck} tone="blue" />
        <Kpi title="Passed" value={passed} icon={CheckCircle2} tone="green" />
        <Kpi title="Action Required" value={action} icon={AlertTriangle} tone="red" />
        <Kpi title="Avg Score" value={`${avg}%`} icon={ShieldCheck} tone={avg >= 85 ? 'green' : 'amber'} />
      </KpiGrid>
      <Table headers={['Ref', 'Area', 'Type', 'Inspector', 'Date', 'Score', 'Status', '']}>
        {inspections.map((i) => (
          <Tr key={i.id} onClick={() => setSel(i)}>
            <Td className="font-semibold text-slate-800">{i.id}</Td>
            <Td className="font-medium">{i.area}</Td>
            <Td>{i.type}</Td>
            <Td>{i.inspector}</Td>
            <Td>{i.date}</Td>
            <Td className="font-bold">{i.score}%</Td>
            <Td><Badge value={i.status} /></Td>
            <Td onClick={(e) => e.stopPropagation()}><RowActions><IconBtn icon={Eye} title="View" onClick={() => setSel(i)} /><DeleteBtn onDelete={() => setInspections((prev) => prev.filter((x) => x.id !== i.id))} /></RowActions></Td>
          </Tr>
        ))}
      </Table>
      <Modal open={!!sel} onClose={() => setSel(null)} title={sel?.area} subtitle={sel ? `${sel.id} · ${sel.type}` : ''} width="max-w-2xl">
        {sel && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Inspector" value={sel.inspector} />
            <Field label="Date" value={sel.date} />
            <Field label="Score" value={`${sel.score}%`} />
            <Field label="Status" value={<Badge value={sel.status} />} />
            <Field label="Findings" value={sel.findings} full />
          </div>
        )}
      </Modal>
      <NewAudit open={showNew} onClose={() => setShowNew(false)} onSave={(a) => { setInspections((prev) => [a, ...prev]); setShowNew(false); }} />
    </div>
  );
}

function NewAudit({ open, onClose, onSave }) {
  const [f, setF] = useState({ area: '', type: AUDIT_TYPES[0], inspector: INSPECTORS[0], date: '2026-07-19', score: 90, findings: '' });
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const save = () => onSave({ id: 'SA-' + String(Math.floor(5 + Math.random() * 90)).padStart(2, '0'), ...f, score: Number(f.score), status: f.score >= 80 ? 'Passed' : 'Action Required' });
  return (
    <Modal open={open} onClose={onClose} title="New Safety Audit"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={!f.area}>Record Audit</Button></>}>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><label className="text-[11px] font-semibold text-slate-600">Area Inspected</label><input value={f.area} onChange={(e) => set('area')(e.target.value)} className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
        <div><label className="text-[11px] font-semibold text-slate-600">Audit Type</label><div className="mt-1"><Select value={f.type} onChange={set('type')} options={AUDIT_TYPES} /></div></div>
        <div><label className="text-[11px] font-semibold text-slate-600">Inspector</label><div className="mt-1"><Select value={f.inspector} onChange={set('inspector')} options={INSPECTORS} /></div></div>
        <div><label className="text-[11px] font-semibold text-slate-600">Date</label><input value={f.date} onChange={(e) => set('date')(e.target.value)} className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
        <div><label className="text-[11px] font-semibold text-slate-600">Score (%)</label><input type="number" value={f.score} onChange={(e) => set('score')(e.target.value)} className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
        <div className="col-span-2"><label className="text-[11px] font-semibold text-slate-600">Findings</label><textarea value={f.findings} onChange={(e) => set('findings')(e.target.value)} rows={2} className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
      </div>
    </Modal>
  );
}
