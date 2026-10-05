import React, { useState, useEffect } from 'react';
import {
  ChevronDown, ChevronRight, HardHat, Circle,
  LayoutDashboard, Ticket, ClipboardList, ShieldCheck, Package, ArrowLeftRight, Boxes, Building2, Server,
  BarChart3, FileBarChart, FileCheck2, FileSpreadsheet, MessageSquareText, Users, Settings, UserCog, KeyRound,
  ListChecks, ClipboardCheck,
} from 'lucide-react';
import { navForRole } from '../config/platform';

// Icon per module id. Kept here (not in config/platform.js) so the role /
// permission config stays purely about access; an unmapped id just falls
// back to a small dot.
const ICONS = {
  dashboard: LayoutDashboard,
  'trouble-tickets': Ticket,
  'work-orders': ClipboardList,
  'ehs-work-orders': ShieldCheck,
  'spare-requests': Package,
  'spare-transactions': ArrowLeftRight,
  'spare-inventory': Boxes,
  'site-database': Building2,
  assets: Server,
  reports: BarChart3,
  'tt-reports': FileBarChart,
  'ehs-reports': FileCheck2,
  'spare-reports': FileSpreadsheet,
  'admin-sms-log': MessageSquareText,
  'admin-sms-groups': Users,
  'admin-sms-config': Settings,
  'admin-users': UserCog,
  'admin-roles': KeyRound,
  'admin-wo-checklist': ListChecks,
  'admin-ehs-checklist': ClipboardCheck,
};

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

  const renderItem = (m) => {
    const active = currentTab === m.id;
    const Icon = ICONS[m.id] || Circle;
    return (
      <button
        key={m.id}
        onClick={() => setCurrentTab(m.id)}
        aria-current={active ? 'page' : undefined}
        className={`group relative w-full flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-light/60 ${
          active
            ? 'bg-sidebar-active-light text-sidebar-text-active'
            : 'text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active'
        }`}
      >
        {active && <span aria-hidden className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-primary-light" />}
        <Icon className={`h-4 w-4 shrink-0 transition-colors ${active ? 'text-primary-light' : 'text-slate-500 group-hover:text-slate-300'}`} />
        <span className="truncate">{m.label}</span>
      </button>
    );
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex flex-col w-64 border-r border-sidebar-border bg-sidebar-bg">
      <div className="flex items-center gap-2.5 h-16 px-4 border-b border-sidebar-border shrink-0">
        <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/30">
          <HardHat className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="min-w-0 text-lg font-display font-black leading-tight truncate text-sidebar-text-active">LEF MS</div>
      </div>

      <nav className="flex-1 overflow-y-auto sidebar-scroll px-3 py-4 space-y-4">
        <div>
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-sidebar-text">Main Menu</div>
          {renderItem({ id: 'dashboard', label: 'Dashboard' })}
        </div>

        <div className="space-y-1 pt-4 border-t border-sidebar-border">
          {groups.map(({ group, items }) => (
            <div key={group}>
              <button
                onClick={() => toggle(group)}
                aria-expanded={!!open[group]}
                className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-light/60"
              >
                <span>{group}</span>
                {open[group] ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </button>
              {open[group] && <div className="mt-1 mb-2 ml-4 pl-2 border-l border-sidebar-border space-y-0.5">{items.map(renderItem)}</div>}
            </div>
          ))}
        </div>
      </nav>
    </aside>
  );
}
