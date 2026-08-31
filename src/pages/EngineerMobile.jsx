import React, { useState } from 'react';
import {
  Smartphone, MapPin, Clock, AlertTriangle, Play, Pause, CheckCircle2, Camera,
  Package, StickyNote, ShieldCheck, Phone, ChevronLeft, Wrench, CalendarCheck,
} from 'lucide-react';
import { Badge } from '../components/ui';

const NEXT = { Assigned: 'In Progress', 'In Progress': 'Completed', 'On Hold': 'In Progress', Completed: 'Verified' };

export default function EngineerMobile({ store }) {
  const { workOrders, setWorkOrders, preventiveTasks, currentUser } = store;
  const me = currentUser.name;
  const [filter, setFilter] = useState('All');
  const [open, setOpen] = useState(null);

  // engineers see their own jobs; managers/admin see all
  const isField = ['Engineer', 'Biomedical Engineer'].includes(currentUser.role);
  const mine = workOrders.filter((w) => !isField || w.engineer === me);

  const buckets = {
    All: mine,
    New: mine.filter((w) => w.status === 'Assigned'),
    'In Progress': mine.filter((w) => w.status === 'In Progress'),
    Emergency: mine.filter((w) => w.priority === 'Emergency'),
    Completed: mine.filter((w) => ['Completed', 'Verified', 'Closed'].includes(w.status)),
  };
  const list = buckets[filter];

  const update = (id, patch) => {
    setWorkOrders((prev) => prev.map((w) => w.id === id ? { ...w, ...patch } : w));
    if (open?.id === id) setOpen((o) => ({ ...o, ...patch }));
  };

  const myPM = preventiveTasks.filter((p) => !isField || p.engineer === me);

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-3xl border-4 border-slate-900 bg-slate-100 overflow-hidden shadow-2xl">
        {/* phone status bar */}
        <div className="bg-slate-900 text-white px-4 py-2 flex items-center justify-between text-[11px]">
          <span className="font-semibold">Field Engineer</span>
          <span className="flex items-center gap-1"><Smartphone className="h-3.5 w-3.5" /> Mobile Workspace</span>
        </div>

        {!open ? (
          <div className="p-3 space-y-3">
            <div className="px-1">
              <div className="text-lg font-black text-slate-900">Hi, {me.split(' ')[0]}</div>
              <div className="text-[12px] text-slate-500">{list.length} jobs in view · {buckets.Emergency.length} emergency</div>
            </div>

            {/* filter chips */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {Object.keys(buckets).map((k) => (
                <button key={k} onClick={() => setFilter(k)} className={`px-3 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap ${filter === k ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}>
                  {k} {k !== 'All' && `· ${buckets[k].length}`}
                </button>
              ))}
            </div>

            {/* job cards */}
            <div className="space-y-2.5">
              {list.map((w) => (
                <button key={w.id} onClick={() => setOpen(w)} className="w-full text-left bg-white rounded-2xl p-3.5 shadow-sm ring-1 ring-slate-100 active:scale-[0.99] transition-transform">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[11px] font-bold text-slate-400">{w.id}</div>
                      <div className="text-[15px] font-bold text-slate-900 leading-tight">{w.title}</div>
                    </div>
                    <Badge value={w.priority} />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-slate-500">
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{w.location}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />Due {w.due}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[12px] text-slate-600">{w.equipment}</span>
                    <Badge value={w.status} />
                  </div>
                </button>
              ))}
              {list.length === 0 && <div className="text-center py-8 text-[13px] text-slate-400">No jobs in this view.</div>}
            </div>

            {/* PM tasks */}
            {myPM.length > 0 && (
              <div className="pt-1">
                <div className="text-[12px] font-bold text-slate-500 px-1 mb-1.5 flex items-center gap-1"><CalendarCheck className="h-4 w-4" />Preventive Tasks</div>
                <div className="space-y-2">
                  {myPM.map((p) => (
                    <div key={p.id} className="bg-white rounded-2xl p-3 shadow-sm ring-1 ring-slate-100 flex items-center justify-between">
                      <div><div className="text-[13px] font-bold text-slate-800">{p.asset}</div><div className="text-[11px] text-slate-500">{p.frequency} · due {p.nextDue}</div></div>
                      <Badge value={p.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <JobDetail wo={open} onBack={() => setOpen(null)} update={update} />
        )}
      </div>
    </div>
  );
}

function JobDetail({ wo, onBack, update }) {
  const toggle = (i) => update(wo.id, { checklist: wo.checklist.map((c, idx) => idx === i ? { ...c, done: !c.done } : c) });
  const bigBtn = (label, Icon, onClick, tone = 'bg-blue-600') => (
    <button onClick={onClick} className={`flex flex-col items-center justify-center gap-1 rounded-2xl ${tone} text-white py-3 text-[12px] font-bold active:scale-95 transition-transform`}>
      <Icon className="h-5 w-5" />{label}
    </button>
  );
  return (
    <div className="p-3 space-y-3">
      <button onClick={onBack} className="flex items-center gap-1 text-[13px] font-semibold text-blue-600"><ChevronLeft className="h-4 w-4" />Back to jobs</button>

      <div className="bg-white rounded-2xl p-3.5 shadow-sm ring-1 ring-slate-100">
        <div className="flex items-start justify-between">
          <div><div className="text-[11px] font-bold text-slate-400">{wo.id}</div><div className="text-[16px] font-black text-slate-900 leading-tight">{wo.title}</div></div>
          <Badge value={wo.priority} />
        </div>
        <div className="mt-2 space-y-1 text-[13px] text-slate-600">
          <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-400" />{wo.dept} · {wo.location}</div>
          <div className="flex items-center gap-2"><Wrench className="h-4 w-4 text-slate-400" />{wo.equipment}</div>
          <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-slate-400" />Due {wo.due}</div>
          <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-slate-400" />Contact: Ward Desk · ext. 204</div>
          <div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-slate-400" />Status: <Badge value={wo.status} /></div>
        </div>
      </div>

      {/* checklist */}
      <div className="bg-white rounded-2xl p-3.5 shadow-sm ring-1 ring-slate-100">
        <div className="text-[13px] font-bold text-slate-700 mb-2">Checklist</div>
        <div className="space-y-1.5">
          {wo.checklist.map((c, i) => (
            <label key={i} className="flex items-center gap-3 py-1 cursor-pointer">
              <input type="checkbox" checked={c.done} onChange={() => toggle(i)} className="h-5 w-5 accent-blue-600" />
              <span className={`text-[13px] ${c.done ? 'line-through text-slate-400' : 'text-slate-700'}`}>{c.t}</span>
            </label>
          ))}
        </div>
      </div>

      {/* actions grid */}
      <div className="grid grid-cols-3 gap-2">
        {wo.status === 'Assigned' && bigBtn('Accept', CheckCircle2, () => update(wo.id, { status: 'In Progress' }), 'bg-emerald-600')}
        {wo.status !== 'In Progress' ? bigBtn('Start', Play, () => update(wo.id, { status: 'In Progress' })) : bigBtn('On Hold', Pause, () => update(wo.id, { status: 'On Hold' }), 'bg-amber-500')}
        {bigBtn('Before', Camera, () => {}, 'bg-slate-600')}
        {bigBtn('After', Camera, () => {}, 'bg-slate-600')}
        {bigBtn('Parts', Package, () => {}, 'bg-slate-600')}
        {bigBtn('Notes', StickyNote, () => {}, 'bg-slate-600')}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {bigBtn('Mark Completed', CheckCircle2, () => update(wo.id, { status: 'Completed' }), 'bg-emerald-600')}
        {bigBtn('Request Verify', ShieldCheck, () => update(wo.id, { status: 'Verified' }), 'bg-blue-600')}
      </div>
    </div>
  );
}
