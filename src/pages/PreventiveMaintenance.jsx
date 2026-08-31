import React, { useState } from 'react';
import { CalendarCheck, AlertTriangle, Clock, LayoutGrid, List, Wrench, Plus } from 'lucide-react';
import {
  PageHeader, KpiGrid, Kpi, FilterBar, Select, Table, Td, Tr, Badge, Modal, Button, Field, RowActions, DeleteBtn, IconBtn,
} from '../components/ui';
import { Eye } from 'lucide-react';
import { PM_FREQUENCIES, INITIAL_EMPLOYEES } from '../data/mockData';

const PM_ENGINEERS = INITIAL_EMPLOYEES.filter((e) => ['Engineer', 'Biomedical Engineer'].includes(e.role)).map((e) => e.name);
const PM_CATEGORIES = ['Generators', 'Air Conditioners', 'Elevators', 'Fire Systems', 'Oxygen Systems', 'Medical Equipment', 'Hospital Beds', 'Water Systems', 'Electrical Systems', 'Plumbing Systems', 'Theatre Equipment', 'Laboratory Equipment', 'Ambulances'];

export default function PreventiveMaintenance({ store }) {
  const { preventiveTasks, setPreventiveTasks, setWorkOrders, go } = store;
  const [freq, setFreq] = useState('');
  const [view, setView] = useState('table');
  const [sel, setSel] = useState(null);
  const [showNew, setShowNew] = useState(false);

  const rows = preventiveTasks.filter((p) => !freq || p.frequency === freq);
  const overdue = preventiveTasks.filter((p) => p.status === 'Overdue').length;
  const dueToday = preventiveTasks.filter((p) => p.status === 'Due Today').length;

  const generateWO = (p) => {
    const woId = 'WO-2026-0' + Math.floor(42 + Math.random() * 50);
    setWorkOrders((prev) => [{
      id: woId, title: `PM — ${p.asset}`, dept: 'Facility', location: p.category, equipment: p.asset, priority: 'Medium',
      engineer: p.engineer, due: p.nextDue, status: 'Assigned', category: 'Mechanical', createdFrom: p.id,
      checklist: p.checklist.map((t) => ({ t, done: false })), materials: [], cost: 0, comments: [], history: [{ at: '12:00', text: `Generated from PM plan ${p.id}` }],
    }, ...prev]);
    setPreventiveTasks((prev) => prev.map((x) => x.id === p.id ? { ...x, status: 'Scheduled' } : x));
    setSel(null);
    go('work-orders');
  };

  // week calendar buckets
  const days = ['2026-07-19', '2026-07-20', '2026-07-21', '2026-07-22', '2026-07-23', '2026-07-24', '2026-07-25'];

  return (
    <div className="space-y-5">
      <PageHeader title="Preventive Maintenance" subtitle="Scheduled plans for critical hospital assets"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-slate-200 overflow-hidden">
              <button onClick={() => setView('table')} className={`px-3 py-2 text-sm font-semibold flex items-center gap-1.5 ${view === 'table' ? 'bg-[#0b1c30] text-white' : 'bg-white text-slate-600'}`}><List className="h-4 w-4" />Table</button>
              <button onClick={() => setView('calendar')} className={`px-3 py-2 text-sm font-semibold flex items-center gap-1.5 ${view === 'calendar' ? 'bg-[#0b1c30] text-white' : 'bg-white text-slate-600'}`}><LayoutGrid className="h-4 w-4" />Calendar</button>
            </div>
            <Button icon={Plus} onClick={() => setShowNew(true)}>New Plan</Button>
          </div>
        } />

      <KpiGrid cols={4}>
        <Kpi title="Active Plans" value={preventiveTasks.length} icon={CalendarCheck} tone="blue" />
        <Kpi title="Due Today" value={dueToday} icon={Clock} tone="amber" />
        <Kpi title="Overdue" value={overdue} icon={AlertTriangle} tone="red" />
        <Kpi title="Scheduled" value={preventiveTasks.filter((p) => p.status === 'Scheduled').length} icon={CalendarCheck} tone="green" />
      </KpiGrid>

      <FilterBar>
        <Select value={freq} onChange={setFreq} options={PM_FREQUENCIES} label="All frequencies" />
      </FilterBar>

      {view === 'table' ? (
        <Table headers={['Plan', 'Asset', 'Category', 'Frequency', 'Engineer', 'Last Done', 'Next Due', 'Status', '']}>
          {rows.map((p) => (
            <Tr key={p.id} onClick={() => setSel(p)}>
              <Td className="font-semibold text-slate-800">{p.id}</Td>
              <Td className="font-medium">{p.asset}</Td>
              <Td>{p.category}</Td>
              <Td>{p.frequency}</Td>
              <Td>{p.engineer}</Td>
              <Td>{p.lastDone}</Td>
              <Td>{p.nextDue}</Td>
              <Td><Badge value={p.status} /></Td>
              <Td onClick={(e) => e.stopPropagation()}>
                <RowActions>
                  <IconBtn icon={Eye} title="Open" onClick={() => setSel(p)} />
                  <DeleteBtn onDelete={() => setPreventiveTasks((prev) => prev.filter((x) => x.id !== p.id))} />
                </RowActions>
              </Td>
            </Tr>
          ))}
        </Table>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {days.map((d) => (
            <div key={d} className="bg-white border border-slate-200 rounded-xl p-2 min-h-[120px]">
              <div className="text-[11px] font-bold text-slate-500 mb-2">{new Date(d).toLocaleDateString('en', { weekday: 'short', day: 'numeric' })}</div>
              <div className="space-y-1">
                {preventiveTasks.filter((p) => p.nextDue === d).map((p) => (
                  <button key={p.id} onClick={() => setSel(p)} className={`w-full text-left px-2 py-1 rounded text-[10px] font-semibold ring-1 ${p.status === 'Overdue' ? 'bg-red-50 text-red-700 ring-red-200' : p.status === 'Due Today' ? 'bg-amber-50 text-amber-700 ring-amber-200' : 'bg-blue-50 text-blue-700 ring-blue-200'}`}>{p.asset}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!sel} onClose={() => setSel(null)} title={sel?.asset} subtitle={sel ? `${sel.id} · ${sel.frequency} plan` : ''}
        footer={sel && <><Button variant="ghost" onClick={() => setSel(null)}>Close</Button><Button icon={Wrench} onClick={() => generateWO(sel)}>Generate Work Order</Button></>}>
        {sel && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Status" value={<Badge value={sel.status} />} />
              <Field label="Frequency" value={sel.frequency} />
              <Field label="Engineer" value={sel.engineer} />
              <Field label="Category" value={sel.category} />
              <Field label="Last Completed" value={sel.lastDone} />
              <Field label="Next Due" value={sel.nextDue} />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Checklist</div>
              <ul className="space-y-1.5">
                {sel.checklist.map((c, i) => (<li key={i} className="flex items-center gap-2 text-[13px] text-slate-700"><span className="h-1.5 w-1.5 rounded-full bg-blue-500" />{c}</li>))}
              </ul>
            </div>
          </div>
        )}
      </Modal>

      <NewPlan open={showNew} onClose={() => setShowNew(false)} onSave={(p) => { setPreventiveTasks((prev) => [p, ...prev]); setShowNew(false); }} />
    </div>
  );
}

function NewPlan({ open, onClose, onSave }) {
  const [f, setF] = useState({ asset: '', category: PM_CATEGORIES[0], frequency: 'Monthly', engineer: PM_ENGINEERS[0], nextDue: '2026-08-01', checklist: '' });
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const save = () => onSave({
    id: 'PM-' + String(Math.floor(7 + Math.random() * 90)).padStart(2, '0'), asset: f.asset, category: f.category, frequency: f.frequency,
    engineer: f.engineer, nextDue: f.nextDue, lastDone: '—', status: 'Scheduled',
    checklist: f.checklist ? f.checklist.split(',').map((s) => s.trim()).filter(Boolean) : ['Inspect', 'Service', 'Test', 'Log'],
  });
  return (
    <Modal open={open} onClose={onClose} title="New Preventive Maintenance Plan"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={!f.asset}>Create Plan</Button></>}>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><label className="text-[11px] font-semibold text-slate-600">Asset / Equipment</label><input value={f.asset} onChange={(e) => set('asset')(e.target.value)} className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
        <div><label className="text-[11px] font-semibold text-slate-600">Category</label><div className="mt-1"><Select value={f.category} onChange={set('category')} options={PM_CATEGORIES} /></div></div>
        <div><label className="text-[11px] font-semibold text-slate-600">Frequency</label><div className="mt-1"><Select value={f.frequency} onChange={set('frequency')} options={PM_FREQUENCIES} /></div></div>
        <div><label className="text-[11px] font-semibold text-slate-600">Assigned Engineer</label><div className="mt-1"><Select value={f.engineer} onChange={set('engineer')} options={PM_ENGINEERS} /></div></div>
        <div><label className="text-[11px] font-semibold text-slate-600">Next Due</label><input value={f.nextDue} onChange={(e) => set('nextDue')(e.target.value)} className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
        <div className="col-span-2"><label className="text-[11px] font-semibold text-slate-600">Checklist (comma-separated)</label><input value={f.checklist} onChange={(e) => set('checklist')(e.target.value)} placeholder="Check oil, Test alarm, Inspect belts" className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
      </div>
    </Modal>
  );
}
