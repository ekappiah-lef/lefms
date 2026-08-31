import React, { useState } from 'react';
import { LayoutDashboard, ChevronDown, ChevronRight, Menu, Plus, Cross } from 'lucide-react';
import { navForRole } from '../config/platform';
import { HOSPITAL } from '../data/mockData';

export default function Sidebar({ role, currentTab, setCurrentTab, collapsed, setCollapsed }) {
  const groups = navForRole(role);
  const [open, setOpen] = useState(() => Object.fromEntries(groups.map((g) => [g.group, true])));
  const toggle = (g) => setOpen((o) => ({ ...o, [g]: !o[g] }));

  const linkClass = (active) =>
    `w-full flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all ${
      active ? 'bg-white text-blue-900 shadow' : 'text-blue-100 hover:bg-blue-900/60 hover:text-white'
    } ${collapsed ? 'justify-center px-0' : ''}`;

  const renderItem = (m) => {
    const Icon = m.icon;
    const active = currentTab === m.id;
    return (
      <button key={m.id} onClick={() => setCurrentTab(m.id)} className={linkClass(active)} title={m.label}>
        <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-blue-700' : 'text-blue-300'}`} />
        {!collapsed && <span className="truncate">{m.label}</span>}
        {!collapsed && m.placeholder && <span className="ml-auto text-[9px] text-blue-300 font-bold">SOON</span>}
      </button>
    );
  };

  return (
    <aside className={`fixed inset-y-0 left-0 z-30 flex flex-col border-r border-slate-800 text-white transition-all duration-200 ${collapsed ? 'w-16' : 'w-64'}`} style={{ background: '#0b1c30' }}>
      {/* Brand */}
      <div className="flex items-center gap-2 h-16 px-4 border-b border-white/10 shrink-0">
        <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
          <Cross className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="text-sm font-display font-black leading-tight truncate">THE BANK HOSPITAL</div>
            <div className="text-[10px] text-blue-300 tracking-wide">Management System</div>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="ml-auto p-1.5 rounded-lg hover:bg-slate-800 text-blue-200">
          <Menu className="h-4 w-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {renderItem({ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard })}

        {groups.map(({ group, items }) => (
          <div key={group}>
            {!collapsed && (
              <button onClick={() => toggle(group)} className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-blue-300/80 hover:text-white">
                <span>{group}</span>
                {open[group] ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              </button>
            )}
            {(collapsed || open[group]) && <div className="mt-1 space-y-0.5">{items.map(renderItem)}</div>}
          </div>
        ))}
      </nav>
    </aside>
  );
}
