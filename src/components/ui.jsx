// =====================================================================
// SHARED UI PRIMITIVES
// One consistent visual language for the whole platform:
// KPI Cards → Filters → Table → Modal → Actions
// =====================================================================
import React from 'react';
import { X, Search, Trash2 } from 'lucide-react';

// ---------------------------------------------------------------------
// STATUS / PRIORITY COLOUR MAP  (green=success, amber=pending, red=critical)
// ---------------------------------------------------------------------
const TONE = {
  green:  'bg-emerald-50 text-emerald-700 ring-emerald-200',
  amber:  'bg-amber-50 text-amber-700 ring-amber-200',
  red:    'bg-red-50 text-red-700 ring-red-200',
  blue:   'bg-blue-50 text-blue-700 ring-blue-200',
  slate:  'bg-slate-100 text-slate-600 ring-slate-200',
  purple: 'bg-purple-50 text-purple-700 ring-purple-200',
};

const STATUS_TONE = {
  // generic
  Available: 'green', Completed: 'green', Verified: 'green', Closed: 'slate',
  Active: 'green', Approved: 'green', 'On Duty': 'green', 'On Track': 'green', Present: 'green',
  Passed: 'green', Delivered: 'green', 'Checked-in': 'blue', 'On Premises': 'blue',
  Scheduled: 'blue', Reviewed: 'blue', Assigned: 'blue', Open: 'blue', 'Due Today': 'amber',
  Pending: 'amber', Submitted: 'amber', 'On Hold': 'amber', Reserved: 'amber',
  Cleaning: 'amber', 'At Risk': 'amber', Awaiting: 'amber',
  'In Progress': 'amber', Maintenance: 'red', Overdue: 'red', 'Action Required': 'red',
  Occupied: 'blue', Isolation: 'purple', Unavailable: 'slate', 'On Leave': 'amber',
  'No Show': 'red', Cancelled: 'slate', 'Checked-out': 'slate', Absent: 'red',
  // priorities
  Low: 'slate', Medium: 'blue', High: 'amber', Critical: 'red', Emergency: 'red',
  Routine: 'slate', Urgent: 'amber',
};

export function toneFor(value) {
  return STATUS_TONE[value] || 'slate';
}

// ---------------------------------------------------------------------
// BADGE
// ---------------------------------------------------------------------
export function Badge({ children, tone, value }) {
  const t = tone || toneFor(value ?? children);
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${TONE[t]}`}>
      {children ?? value}
    </span>
  );
}

// ---------------------------------------------------------------------
// KPI CARD
// ---------------------------------------------------------------------
export function Kpi({ title, value, icon: Icon, tone = 'blue', hint, trend, trendTone = 'green', onClick }) {
  const trendColor = trendTone === 'red' ? 'text-red-600' : trendTone === 'amber' ? 'text-amber-600' : 'text-emerald-600';
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 leading-tight">{title}</span>
        {Icon && (
          <span className={`h-9 w-9 rounded-full flex items-center justify-center ring-1 ${TONE[tone]}`}>
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-display font-extrabold text-slate-900">{value}</span>
        {trend && <span className={`text-[11px] font-bold ${trendColor}`}>{trend}</span>}
      </div>
      {hint && <div className="text-[11px] text-slate-400 mt-1 font-medium">{hint}</div>}
    </div>
  );
}

export function KpiGrid({ children, cols = 4 }) {
  const map = { 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-2 lg:grid-cols-3', 4: 'sm:grid-cols-2 lg:grid-cols-4', 5: 'sm:grid-cols-3 lg:grid-cols-5', 6: 'sm:grid-cols-3 lg:grid-cols-6' };
  return <div className={`grid grid-cols-2 ${map[cols]} gap-3`}>{children}</div>;
}

// ---------------------------------------------------------------------
// PAGE HEADER
// ---------------------------------------------------------------------
export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
      <div>
        <h1 className="text-xl font-black tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------
// SECTION CARD (chart / list container)
// ---------------------------------------------------------------------
export function SectionCard({ title, action, children, className = '' }) {
  return (
    <div className={`bg-white border border-slate-200 rounded-2xl p-5 shadow-sm ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          {title && <h3 className="text-base font-display font-bold text-slate-800">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------
// BUTTON
// ---------------------------------------------------------------------
export function Button({ children, variant = 'primary', size = 'md', icon: Icon, ...props }) {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm',
    ghost: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700',
    subtle: 'bg-blue-50 text-blue-700 hover:bg-blue-100',
  };
  const sizes = { sm: 'px-2.5 py-1.5 text-xs', md: 'px-3.5 py-2 text-sm', lg: 'px-4 py-2.5 text-sm' };
  return (
    <button {...props} className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold transition-colors ${variants[variant]} ${sizes[size]} ${props.className || ''}`}>
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------
// TABLE ROW ACTIONS — small, consistently-styled buttons for tables
// ---------------------------------------------------------------------
export function ActionBtn({ children, tone = 'navy', icon: Icon, ...props }) {
  const tones = {
    navy: 'bg-[#0b1c30] text-white hover:bg-[#17324e]',
    outline: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50',
    amber: 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700',
    ghost: 'text-blue-700 hover:bg-blue-50',
  };
  return (
    <button {...props} className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${tones[tone]} ${props.className || ''}`}>
      {Icon && <Icon className="h-3.5 w-3.5" />}{children}
    </button>
  );
}

export function RowActions({ children }) {
  return <div className="flex items-center gap-1.5">{children}</div>;
}

// Delete button with a native confirm (works everywhere; wired resources
// auto-DELETE from MySQL via the store's synced setters).
export function DeleteBtn({ onDelete, label = 'Delete this record? This cannot be undone.' }) {
  return (
    <IconBtn icon={Trash2} tone="danger" title="Delete"
      onClick={(e) => { e.stopPropagation(); if (window.confirm(label)) onDelete(); }} />
  );
}

export function IconBtn({ icon: Icon, title, tone = 'outline', ...props }) {
  const tones = {
    outline: 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900',
    navy: 'bg-[#0b1c30] text-white hover:bg-[#17324e]',
    danger: 'bg-white text-red-600 border border-red-200 hover:bg-red-50',
    success: 'bg-white text-emerald-600 border border-emerald-200 hover:bg-emerald-50',
  };
  return (
    <button {...props} title={title} className={`inline-flex items-center justify-center h-7 w-7 rounded-md transition-colors ${tones[tone]} ${props.className || ''}`}>
      <Icon className="h-4 w-4" />
    </button>
  );
}

// A status chip that advances on click (used for OPD-style status flows)
export function StatusStep({ value, next, onAdvance }) {
  return (
    <button onClick={onAdvance} disabled={!next}
      className={`inline-flex items-center gap-1.5 rounded-full pl-2.5 pr-2 py-1 text-[11px] font-semibold ring-1 ${TONE[toneFor(value)]} ${next ? 'hover:brightness-95 cursor-pointer' : 'cursor-default'}`}>
      {value}
      {next && <span className="ml-0.5 inline-flex items-center rounded-full bg-white/60 px-1 text-[9px] font-bold">→ {next}</span>}
    </button>
  );
}

// ---------------------------------------------------------------------
// SEARCH + FILTER BAR
// ---------------------------------------------------------------------
export function FilterBar({ search, onSearch, placeholder = 'Search…', children }) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {onSearch && (
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}
      {children}
    </div>
  );
}

export function Select({ value, onChange, options, label }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="py-2 pl-3 pr-8 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {label && <option value="">{label}</option>}
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

// ---------------------------------------------------------------------
// TABLE
// ---------------------------------------------------------------------
export function Table({ headers, children, empty = 'No records found' }) {
  const rows = React.Children.count(children);
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            <tr>{headers.map((h, i) => <th key={i} className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-[13px] text-slate-700">{children}</tbody>
        </table>
      </div>
      {rows === 0 && <div className="text-center py-10 bg-slate-50 text-xs font-semibold text-slate-400">{empty}</div>}
    </div>
  );
}

export function Td({ children, className = '' }) {
  return <td className={`px-4 py-3 align-middle ${className}`}>{children}</td>;
}

export function Tr({ children, onClick }) {
  return (
    <tr onClick={onClick} className={onClick ? 'hover:bg-blue-50/50 cursor-pointer transition-colors' : ''}>
      {children}
    </tr>
  );
}

// ---------------------------------------------------------------------
// MODAL
// ---------------------------------------------------------------------
export function Modal({ open, onClose, title, subtitle, children, footer, width = 'max-w-3xl' }) {
  if (!open) return null;
  return (
    <div onClick={onClose} className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 backdrop-blur-sm p-4 sm:p-6">
      <div className={`w-full ${width} bg-white rounded-2xl shadow-2xl my-4 sm:my-8`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-slate-100 px-7 py-5">
          <div>
            <h2 className="text-lg font-display font-extrabold text-slate-900">{title}</h2>
            {subtitle && <p className="text-[13px] text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-7 py-6">{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 px-7 py-4 bg-slate-50 rounded-b-2xl">{footer}</div>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// TABS
// ---------------------------------------------------------------------
export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 border-b border-slate-200 mb-4 overflow-x-auto">
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`px-3.5 py-2 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors ${
            active === t ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------
// FIELD (label + value) for detail views
// ---------------------------------------------------------------------
export function Field({ label, value, full }) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">{label}</div>
      <div className="text-sm text-slate-800 font-medium mt-0.5">{value || '—'}</div>
    </div>
  );
}

// ---------------------------------------------------------------------
// PLACEHOLDER (Phase 2 modules)
// ---------------------------------------------------------------------
export function Placeholder({ title, icon: Icon, phase = 'Phase 2', bullets = [] }) {
  return (
    <div className="space-y-6">
      <div className="bg-slate-900 text-white rounded-2xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500 rounded-full blur-3xl opacity-10" />
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block text-[10px] tracking-widest text-blue-300 uppercase bg-blue-950/70 px-2.5 py-1 rounded-full ring-1 ring-blue-900 font-semibold">
            {phase} Expansion Scope
          </span>
          <div className="flex items-center gap-3 mt-4">
            {Icon && <Icon className="h-8 w-8 text-blue-300" />}
            <h1 className="text-3xl font-black tracking-tight">{title}</h1>
          </div>
          <p className="text-slate-400 text-sm mt-2 leading-relaxed">
            This module is architected into the platform and reserved for {phase.toLowerCase()} delivery.
            Navigation, permissions and data model are already in place; the workspace below lists the
            planned capabilities.
          </p>
        </div>
      </div>
      {bullets.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {bullets.map((b) => (
            <div key={b} className="bg-white border border-slate-200 rounded-xl p-4 text-sm font-medium text-slate-700 shadow-sm">
              {b}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
