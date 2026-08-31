import React, { useState } from 'react';
import { Scissors, Clock, CheckCircle2, Plus } from 'lucide-react';
import { PageHeader, KpiGrid, Kpi, FilterBar, Select, Table, Td, Tr, Badge, Modal, Button, Field, ActionBtn, RowActions, DeleteBtn } from '../components/ui';
import { THEATRE_STATUSES } from '../data/extraData';

const NEXT = { Scheduled: 'Pre-Op', 'Pre-Op': 'In Theatre', 'In Theatre': 'Recovery', Recovery: 'Completed' };

export default function Theatre({ store }) {
  const { theatreCases, setTheatreCases } = store;
  const [status, setStatus] = useState('');
  const [sel, setSel] = useState(null);
  const rows = theatreCases.filter((c) => !status || c.status === status);

  const advance = (c) => {
    const n = NEXT[c.status];
    if (!n) return;
    setTheatreCases((prev) => prev.map((x) => x.id === c.id ? { ...x, status: n } : x));
    if (sel?.id === c.id) setSel((s) => ({ ...s, status: n }));
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Theatre" subtitle="Surgical schedule, WHO checklist & case flow" />

      <KpiGrid cols={4}>
        <Kpi title="Cases Today" value={theatreCases.filter((c) => c.date === '2026-07-19').length} icon={Scissors} tone="blue" />
        <Kpi title="In Theatre" value={theatreCases.filter((c) => c.status === 'In Theatre').length} icon={Clock} tone="amber" />
        <Kpi title="Scheduled" value={theatreCases.filter((c) => c.status === 'Scheduled').length} icon={Clock} tone="blue" />
        <Kpi title="Completed" value={theatreCases.filter((c) => c.status === 'Completed').length} icon={CheckCircle2} tone="green" />
      </KpiGrid>

      <FilterBar>
        <Select value={status} onChange={setStatus} options={THEATRE_STATUSES} label="All statuses" />
      </FilterBar>

      <Table headers={['Case', 'Patient', 'Procedure', 'Surgeon', 'Theatre', 'Date', 'Time', 'Status', '']}>
        {rows.map((c) => (
          <Tr key={c.id} onClick={() => setSel(c)}>
            <Td className="font-semibold text-slate-800">{c.id}</Td>
            <Td className="font-medium">{c.patient}</Td>
            <Td>{c.procedure}</Td>
            <Td>{c.surgeon}</Td>
            <Td>{c.theatre}</Td>
            <Td>{c.date}</Td>
            <Td>{c.time}</Td>
            <Td><Badge value={c.status === 'Completed' ? 'Completed' : c.status === 'In Theatre' ? 'In Progress' : 'Scheduled'}>{c.status}</Badge></Td>
            <Td onClick={(e) => e.stopPropagation()}>
              <RowActions>
                {NEXT[c.status] && <ActionBtn tone={NEXT[c.status] === 'Completed' ? 'success' : 'navy'} onClick={() => advance(c)}>{NEXT[c.status]}</ActionBtn>}
                <DeleteBtn onDelete={() => setTheatreCases((prev) => prev.filter((x) => x.id !== c.id))} />
              </RowActions>
            </Td>
          </Tr>
        ))}
      </Table>

      <Modal open={!!sel} onClose={() => setSel(null)} title={sel?.procedure} subtitle={sel ? `${sel.id} · ${sel.patient}` : ''}
        footer={sel && NEXT[sel.status] && <Button onClick={() => advance(sel)}>Move to {NEXT[sel.status]}</Button>}>
        {sel && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Surgeon" value={sel.surgeon} />
              <Field label="Theatre" value={sel.theatre} />
              <Field label="Date / Time" value={`${sel.date} ${sel.time}`} />
              <Field label="Est. Duration" value={sel.duration} />
              <Field label="Team" value={sel.team} full />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">WHO Surgical Checklist</div>
              <ul className="space-y-1.5">
                {sel.checklist.map((c, i) => <li key={i} className="flex items-center gap-2 text-[13px] text-slate-700"><CheckCircle2 className="h-4 w-4 text-emerald-500" />{c}</li>)}
              </ul>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
