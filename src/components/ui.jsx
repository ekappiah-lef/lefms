// =====================================================================
// SHARED UI PRIMITIVES
// One consistent visual language for the whole platform:
// KPI Cards → Filters → Table → Modal → Actions
// =====================================================================
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Trash2, Upload, Paperclip, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

// ---------------------------------------------------------------------
// STATUS / PRIORITY COLOUR MAP  (green=success, amber=pending, red=critical)
// ---------------------------------------------------------------------
const TONE = {
  green:   'bg-emerald-50 text-emerald-700 ring-emerald-200',
  amber:   'bg-amber-50 text-amber-700 ring-amber-200',
  red:     'bg-red-50 text-red-700 ring-red-200',
  blue:    'bg-sky-50 text-sky-700 ring-sky-200',
  slate:   'bg-slate-100 text-slate-600 ring-slate-200',
  purple:  'bg-violet-50 text-violet-700 ring-violet-200',
  indigo:  'bg-indigo-50 text-indigo-700 ring-indigo-200',
  rose:    'bg-rose-50 text-rose-700 ring-rose-200',
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
// KPI CARD   no icon badge (deliberately plain: title + number), compact.
// `tone` still tints the value text so cards don't read as monochrome.
// ---------------------------------------------------------------------
const KPI_ROTATION = ['indigo', 'blue', 'green', 'rose', 'amber'];
const KPI_VALUE_TONE = {
  indigo: 'text-indigo-700', blue: 'text-sky-700', green: 'text-emerald-700', rose: 'text-rose-700', amber: 'text-amber-700', slate: 'text-slate-900',
};

// `size="lg"` is the Main Dashboard's own scale; every other page (list
// pages' at-a-glance counts) uses the default compact "sm" scale so a
// stat row doesn't compete with the table below it for attention.
const KPI_SIZE = {
  sm: { pad: 'p-2.5', title: 'text-[9px]', value: 'text-lg', gap: 'mt-1 gap-1.5', hint: 'text-[10px] mt-0.5' },
  lg: { pad: 'p-3.5', title: 'text-[10px]', value: 'text-2xl', gap: 'mt-1.5 gap-2', hint: 'text-[11px] mt-1' },
};

export function Kpi({ title, value, tone, hint, trend, trendTone = 'green', onClick, index = 0, size = 'sm' }) {
  const resolvedTone = tone || KPI_ROTATION[index % KPI_ROTATION.length];
  const trendColor = trendTone === 'red' ? 'text-red-600' : trendTone === 'amber' ? 'text-amber-600' : 'text-emerald-600';
  const s = KPI_SIZE[size] || KPI_SIZE.sm;
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-slate-200 rounded-xl ${s.pad} shadow-sm hover:shadow-md transition-all duration-200 ${onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''}`}
    >
      <span className={`${s.title} font-bold uppercase tracking-wider text-slate-500 leading-tight`}>{title}</span>
      <div className={`${s.gap} flex items-baseline`}>
        <span className={`${s.value} font-display font-extrabold ${KPI_VALUE_TONE[resolvedTone] || 'text-slate-900'}`}>{value}</span>
        {trend && <span className={`text-[11px] font-bold ${trendColor}`}>{trend}</span>}
      </div>
      {hint && <div className={`${s.hint} text-slate-400 font-medium`}>{hint}</div>}
    </div>
  );
}

// Auto-assigns a rotating tone to any child Kpi that doesn't specify one,
// so a plain `<KpiGrid><Kpi .../><Kpi .../></KpiGrid>` reads as colorful.
// `size` (default "sm") is forwarded to every child Kpi that didn't set
// its own   pass size="lg" only for the Main Dashboard.
export function KpiGrid({ children, cols = 4, size = 'sm' }) {
  const map = { 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-2 lg:grid-cols-3', 4: 'sm:grid-cols-2 lg:grid-cols-4', 5: 'sm:grid-cols-3 lg:grid-cols-5', 6: 'sm:grid-cols-3 lg:grid-cols-6' };
  const items = React.Children.toArray(children);
  return (
    <div className={`grid grid-cols-2 ${map[cols]} gap-2.5`}>
      {items.map((child, i) => (React.isValidElement(child) && child.type === Kpi ? React.cloneElement(child, { index: i, size: child.props.size || size }) : child))}
    </div>
  );
}

// ---------------------------------------------------------------------
// PAGE HEADER
// ---------------------------------------------------------------------
export function PageHeader({ title, subtitle, actions, back }) {
  return (
    <div className="mb-5">
      {back}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function BackLink({ onClick, children = 'Back' }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1 text-[13px] font-bold text-slate-500 hover:text-primary mb-3 transition-colors">
      <ChevronLeft className="h-3.5 w-3.5" /> {children}
    </button>
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
// BUTTON   "alive": lifts + shadows on hover, presses on click
// ---------------------------------------------------------------------
export function Button({ children, variant = 'primary', size = 'md', icon: Icon, ...props }) {
  const variants = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-lg hover:shadow-primary/20',
    ghost: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm hover:shadow-lg hover:shadow-red-500/20',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm hover:shadow-lg hover:shadow-emerald-500/20',
    subtle: 'bg-accent text-accent-foreground hover:bg-accent/80',
  };
  const sizes = { sm: 'px-2.5 py-1.5 text-xs', md: 'px-3.5 py-2 text-sm', lg: 'px-4 py-2.5 text-sm' };
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold
        transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]
        disabled:opacity-50 disabled:pointer-events-none disabled:translate-y-0
        outline-none focus-visible:ring-2 focus-visible:ring-primary/40
        ${variants[variant]} ${sizes[size]} ${props.className || ''}`}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------
// TABLE ROW ACTIONS   small, consistently-styled buttons for tables
// ---------------------------------------------------------------------
export function ActionBtn({ children, tone = 'navy', icon: Icon, ...props }) {
  const tones = {
    navy: 'bg-primary text-primary-foreground hover:bg-primary/90',
    outline: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50',
    amber: 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700',
    ghost: 'text-primary hover:bg-accent',
  };
  return (
    <button {...props} className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${tones[tone]} ${props.className || ''}`}>
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
    navy: 'bg-primary text-primary-foreground hover:bg-primary/90',
    danger: 'bg-white text-red-600 border border-red-200 hover:bg-red-50',
    success: 'bg-white text-emerald-600 border border-emerald-200 hover:bg-emerald-50',
  };
  return (
    <button {...props} title={title} className={`inline-flex items-center justify-center h-7 w-7 rounded-md transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${tones[tone]} ${props.className || ''}`}>
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
// SEARCH + FILTER BAR   search box is capped so it stops dominating the row
// ---------------------------------------------------------------------
export function FilterBar({ search, onSearch, placeholder = 'Search…', children }) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {onSearch && (
        <div className="relative w-full max-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      )}
      {children}
    </div>
  );
}

// options: array of plain strings, OR array of {value, label} objects.
// Custom-rendered (not a native <select>)   a native select's dropdown
// popup is drawn by the OS, and at non-100% Windows display scaling it
// can visually misplace/overlap page content; this one is plain DOM we
// fully control, so that class of bug can't happen.
export function Select({ value, onChange, options, label, disabled, className = 'w-full' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const norm = options.map((o) => (o && typeof o === 'object' ? o : { value: o, label: o }));
  const current = norm.find((o) => String(o.value) === String(value));

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onEsc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onEsc); };
  }, [open]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 py-2 pl-3 pr-2.5 text-sm rounded-lg border border-slate-200 bg-white text-slate-700
          outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className={`truncate ${!current ? 'text-slate-400' : ''}`}>{current ? current.label : label || ''}</span>
        <ChevronDown className={`h-4 w-4 text-slate-400 shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-30 left-0 right-0 mt-1 max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg py-1">
          {label && (
            <button type="button" onClick={() => { onChange(''); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm text-slate-400 hover:bg-slate-50">{label}</button>
          )}
          {norm.map((o) => (
            <button
              type="button" key={o.value}
              onClick={() => { onChange(o.value); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-sm truncate ${String(o.value) === String(value) ? 'bg-accent text-primary font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function DateInput({ value, onChange, placeholder }) {
  return (
    <input
      type="date"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="py-2 px-3 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary"
    />
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
    <tr onClick={onClick} className={onClick ? 'hover:bg-accent/60 cursor-pointer transition-colors' : ''}>
      {children}
    </tr>
  );
}

// ---------------------------------------------------------------------
// PAGINATION   "Showing X–Y of Z" + prev/next + page numbers, 10/page.
// Purely client-side: pass it the full filtered array's length and the
// page state; slice the array yourself with `pageSlice`.
// ---------------------------------------------------------------------
export function pageSlice(rows, page, pageSize = 10) {
  const start = (page - 1) * pageSize;
  return rows.slice(start, start + pageSize);
}

export function Pagination({ page, setPage, total, pageSize = 10 }) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const clamped = Math.min(Math.max(1, page), pageCount);
  if (clamped !== page) setPage(clamped);
  const from = total === 0 ? 0 : (clamped - 1) * pageSize + 1;
  const to = Math.min(clamped * pageSize, total);

  const pages = [];
  const span = 2;
  for (let p = 1; p <= pageCount; p++) {
    if (p === 1 || p === pageCount || (p >= clamped - span && p <= clamped + span)) pages.push(p);
    else if (pages[pages.length - 1] !== '…') pages.push('…');
  }

  if (total === 0) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-1 pt-3">
      <span className="text-[12px] text-slate-500 font-medium">Showing <span className="font-bold text-slate-700">{from}–{to}</span> of <span className="font-bold text-slate-700">{total}</span></span>
      <div className="flex items-center gap-1">
        <IconBtn icon={ChevronLeft} title="Previous page" onClick={() => setPage(clamped - 1)} className={clamped <= 1 ? 'opacity-40 pointer-events-none' : ''} />
        {pages.map((p, i) => p === '…' ? (
          <span key={`e${i}`} className="px-1.5 text-slate-400 text-xs">…</span>
        ) : (
          <button key={p} onClick={() => setPage(p)}
            className={`h-7 min-w-7 px-1.5 rounded-md text-[12px] font-bold transition-colors ${p === clamped ? 'bg-primary text-primary-foreground' : 'text-slate-600 hover:bg-slate-100'}`}>
            {p}
          </button>
        ))}
        <IconBtn icon={ChevronRight} title="Next page" onClick={() => setPage(clamped + 1)} className={clamped >= pageCount ? 'opacity-40 pointer-events-none' : ''} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// MODAL
// ---------------------------------------------------------------------
export function Modal({ open, onClose, title, subtitle, children, footer, width = 'max-w-3xl' }) {
  if (!open) return null;
  // Portaled to <body>   a framer-motion page wrapper applies a CSS transform
  // for its page-transition animation, and a transform turns that ancestor
  // into a containing block for position:fixed children, which would pin
  // this modal to the animated page div instead of the viewport.
  return createPortal(
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
        {footer && <div className="flex flex-wrap items-center justify-center gap-2 border-t border-slate-100 px-7 py-4 bg-slate-50 rounded-b-2xl">{footer}</div>}
      </div>
    </div>,
    document.body
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
            active === t ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------
// RADIO GROUP   the "pick an action, then its fields appear inline"
// selector used on ticket detail pages instead of a wall of buttons.
// options: [{ value, label, tone }]. tone tints the selected pill.
// ---------------------------------------------------------------------
export function RadioGroup({ options, value, onChange, name }) {
  const groupName = name || 'radio-group';
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {options.map((o) => {
        const checked = o.value === value;
        const t = o.tone || 'navy';
        const activeClass = {
          navy: 'border-primary bg-accent text-primary',
          success: 'border-emerald-500 bg-emerald-50 text-emerald-700',
          danger: 'border-red-500 bg-red-50 text-red-700',
          amber: 'border-amber-500 bg-amber-50 text-amber-700',
        }[t] || 'border-primary bg-accent text-primary';
        return (
          <label
            key={o.value}
            className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[13px] font-semibold cursor-pointer transition-colors ${
              checked ? activeClass : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <input
              type="radio" name={groupName} value={o.value} checked={checked}
              onChange={() => onChange(o.value)} className="sr-only"
            />
            <span className={`h-3.5 w-3.5 rounded-full border-2 shrink-0 ${checked ? 'border-current' : 'border-slate-300'} flex items-center justify-center`}>
              {checked && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
            </span>
            {o.label}
          </label>
        );
      })}
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
      <div className="text-sm text-slate-800 font-medium mt-0.5">{value || ' '}</div>
    </div>
  );
}

// ---------------------------------------------------------------------
// TEXTAREA
// ---------------------------------------------------------------------
export function Textarea({ value, onChange, placeholder, rows = 3, autoFocus }) {
  return (
    <textarea
      value={value}
      autoFocus={autoFocus}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
    />
  );
}

// ---------------------------------------------------------------------
// FILE PICKER (drag/drop or click)   returns the raw File to the caller
// ---------------------------------------------------------------------
export function FilePicker({ onFile, accept, hint = 'Click or drag a file here' }) {
  const [drag, setDrag] = useState(false);
  const inputRef = React.useRef(null);
  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) onFile(f); }}
      className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${drag ? 'border-primary bg-accent' : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'}`}
    >
      <Upload className="h-6 w-6 text-slate-400 mx-auto mb-1.5" />
      <p className="text-[13px] font-semibold text-slate-600">{hint}</p>
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
    </div>
  );
}

export function AttachmentRow({ name, meta, onClick }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-2.5 rounded-lg border border-slate-100 px-3 py-2 text-left hover:bg-slate-50">
      <Paperclip className="h-4 w-4 text-slate-400 shrink-0" />
      <div className="min-w-0">
        <div className="text-[13px] font-medium text-slate-800 truncate">{name}</div>
        {meta && <div className="text-[11px] text-slate-400">{meta}</div>}
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------
// CONFIRM MODAL   for the View/Close/Cancel/Delete icon actions and every
// workflow transition. Requiring a note keeps "every description logged".
// ---------------------------------------------------------------------
export function ConfirmModal({ open, onClose, title, description, tone = 'primary', requireNote = true, confirmLabel = 'Confirm', busy, onConfirm, extra }) {
  const [note, setNote] = useState('');
  if (!open) return null;
  const canConfirm = !requireNote || note.trim().length > 0;
  return (
    <Modal open={open} onClose={onClose} title={title} subtitle={description} width="max-w-md"
      footer={<>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant={tone} disabled={!canConfirm || busy} onClick={() => onConfirm(note)}>{busy ? 'Working…' : confirmLabel}</Button>
      </>}>
      <div className="space-y-3">
        {extra}
        {requireNote && (
          <div>
            <label className="text-[11px] font-semibold text-slate-600">Note / reason <span className="text-red-500">*</span></label>
            <div className="mt-1"><Textarea value={note} onChange={setNote} autoFocus placeholder="Description …" /></div>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------
// PLACEHOLDER (Phase 2 modules)
// ---------------------------------------------------------------------
export function Placeholder({ title, icon: Icon, phase = 'Phase 2', bullets = [] }) {
  return (
    <div className="space-y-6">
      <div className="bg-slate-900 text-white rounded-2xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-primary rounded-full blur-3xl opacity-10" />
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block text-[10px] tracking-widest text-indigo-300 uppercase bg-indigo-950/70 px-2.5 py-1 rounded-full ring-1 ring-indigo-900 font-semibold">
            {phase} Expansion Scope
          </span>
          <div className="flex items-center gap-3 mt-4">
            {Icon && <Icon className="h-8 w-8 text-indigo-300" />}
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
