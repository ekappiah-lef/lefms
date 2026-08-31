import React, { useState } from 'react';
import { HeartPulse, CheckCircle2, Clock, AlertTriangle, Plus } from 'lucide-react';
import { PageHeader, KpiGrid, Kpi, FilterBar, Select, Table, Td, Tr, Badge, Button, Modal, ActionBtn, RowActions, DeleteBtn } from '../components/ui';

export default function Nursing({ store }) {
  const { nursingTasks, setNursingTasks, wards, admissions } = store;
  const admitted = admissions.filter((a) => a.status !== 'Discharged');
  const [ward, setWard] = useState('');
  const [showNew, setShowNew] = useState(false);
  const wardNames = [...new Set(nursingTasks.map((t) => t.ward))];
  const rows = nursingTasks.filter((t) => !ward || t.ward === ward);

  const complete = (id) => setNursingTasks((prev) => prev.map((t) => t.id === id ? { ...t, status: 'Done' } : t));

  return (
    <div className="space-y-5">
      <PageHeader title="Nursing" subtitle="Care tasks, medication rounds & vitals by ward"
        actions={<Button icon={Plus} onClick={() => setShowNew(true)}>New Task</Button>} />

      <KpiGrid cols={4}>
        <Kpi title="Open Tasks" value={nursingTasks.filter((t) => t.status === 'Pending').length} icon={Clock} tone="amber" />
        <Kpi title="Critical" value={nursingTasks.filter((t) => t.priority === 'Critical' && t.status === 'Pending').length} icon={AlertTriangle} tone="red" />
        <Kpi title="Completed" value={nursingTasks.filter((t) => t.status === 'Done').length} icon={CheckCircle2} tone="green" />
        <Kpi title="Wards Covered" value={wardNames.length} icon={HeartPulse} tone="blue" />
      </KpiGrid>

      <FilterBar>
        <Select value={ward} onChange={setWard} options={wardNames} label="All wards" />
      </FilterBar>

      <Table headers={['Task', 'Patient', 'Ward', 'Bed', 'Nurse', 'Due', 'Priority', 'Status', '']}>
        {rows.map((t) => (
          <Tr key={t.id}>
            <Td className="font-medium">{t.task}</Td>
            <Td>{t.patient}</Td>
            <Td>{t.ward}</Td>
            <Td>{t.bed}</Td>
            <Td>{t.nurse}</Td>
            <Td>{t.due}</Td>
            <Td><Badge value={t.priority} /></Td>
            <Td><Badge value={t.status === 'Done' ? 'Completed' : 'Pending'}>{t.status}</Badge></Td>
            <Td>
              <RowActions>
                {t.status === 'Pending' && <ActionBtn tone="success" onClick={() => complete(t.id)}>Complete</ActionBtn>}
                <DeleteBtn onDelete={() => setNursingTasks((prev) => prev.filter((x) => x.id !== t.id))} />
              </RowActions>
            </Td>
          </Tr>
        ))}
      </Table>

      <NewTask open={showNew} onClose={() => setShowNew(false)} wards={wards} admitted={admitted} onSave={(t) => { setNursingTasks((prev) => [t, ...prev]); setShowNew(false); }} />
    </div>
  );
}

function NewTask({ open, onClose, onSave, wards, admitted }) {
  const [f, setF] = useState({ task: '', patientKey: '', nurse: 'Ama Owusu', due: '13:00', priority: 'Routine' });
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const adm = admitted.find((a) => `${a.patient} — ${a.ward}/${a.bed}` === f.patientKey);
  const save = () => {
    if (!adm) return;
    onSave({ id: 'NT-' + Math.floor(7 + Math.random() * 90), status: 'Pending', task: f.task, patient: adm.patient, ward: adm.ward, bed: adm.bed, nurse: f.nurse, due: f.due, priority: f.priority });
  };
  const input = (label, k, full) => (<div className={full ? 'col-span-2' : ''}><label className="text-[11px] font-semibold text-slate-600">{label}</label><input value={f[k]} onChange={(e) => set(k)(e.target.value)} className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>);
  return (
    <Modal open={open} onClose={onClose} title="New Nursing Task" subtitle="For an admitted (in-patient) record" width="max-w-2xl"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={!f.task || !adm}>Add Task</Button></>}>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><label className="text-[11px] font-semibold text-slate-600">Admitted Patient</label><div className="mt-1"><Select value={f.patientKey} onChange={set('patientKey')} options={admitted.map((a) => `${a.patient} — ${a.ward}/${a.bed}`)} label="Select an admitted patient…" /></div></div>
        {input('Task', 'task', true)}
        <div><label className="text-[11px] font-semibold text-slate-600">Nurse</label><div className="mt-1"><Select value={f.nurse} onChange={set('nurse')} options={['Ama Owusu', 'Patience Owusu']} /></div></div>
        {input('Due', 'due')}
        <div><label className="text-[11px] font-semibold text-slate-600">Priority</label><div className="mt-1"><Select value={f.priority} onChange={set('priority')} options={['Routine', 'High', 'Critical']} /></div></div>
      </div>
    </Modal>
  );
}
