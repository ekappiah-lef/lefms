import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, HardHat } from 'lucide-react';
import { navForRole } from '../config/platform';

// Always-visible fixed sidebar   this is a web app, not a mobile-first
// one, so there is no hamburger toggle and no off-canvas/collapse mode
// to fight with; it just permanently occupies its own column.
export default function Sidebar({ user, currentTab, setCurrentTab }) {
  const groups = navForRole(user);
  // Every group starts closed (a clean, uncluttered first launch); a
  // group auto-opens the moment its own item becomes the active tab, so
  // the current selection is never hidden inside a collapsed group   but
  // nothing else force-closes, so a group the user opened by hand stays
  // open as they keep navigating.
  const [open, setOpen] = useState({});
  useEffect(() => {
    const activeGroup = groups.find((g) => g.items.some((i) => i.id === currentTab))?.group;
    if (activeGroup) setOpen((o) => (o[activeGroup] ? o : { ...o, [activeGroup]: true }));
  }, [currentTab]); // eslint-disable-line react-hooks/exhaustive-deps
  const toggle = (g) => setOpen((o) => ({ ...o, [g]: !o[g] }));

  const linkClass = (active) =>
    `w-full flex items-center gap-3 px-3 py-2 text-[13px] font-medium border-b border-slate-100 transition-all duration-150 ${
      active ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

  const renderItem = (m) => {
    const active = currentTab === m.id;
    return (
      <button key={m.id} onClick={() => setCurrentTab(m.id)} className={linkClass(active)}>
        <span className="truncate">{m.label}</span>
      </button>
    );
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex flex-col w-64 border-r border-slate-200 bg-white">
      <div className="flex items-center gap-2.5 h-16 px-4 border-b border-slate-100 shrink-0">
        <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <HardHat className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="min-w-0 text-lg font-display font-black leading-tight truncate text-slate-900">LEF MS</div>
      </div>

      <nav className="flex-1 overflow-y-auto py-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
        {renderItem({ id: 'dashboard', label: 'Dashboard' })}

        {groups.map(({ group, items }) => (
          <div key={group} className="border-b border-slate-100">
            <button onClick={() => toggle(group)} className="w-full flex items-center justify-between px-3.5 py-2 text-[9px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 bg-slate-50/60">
              <span>{group}</span>
              {open[group] ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>
            {open[group] && <div>{items.map(renderItem)}</div>}
          </div>
        ))}
      </nav>
    </aside>
  );
}
