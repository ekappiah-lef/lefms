import React, { useEffect, useState, useCallback } from 'react';
import { BackLink, Badge, Field, Button, Select, Textarea, SectionCard, RadioGroup } from '../components/ui';
import { api } from '../api/client';
import { TT_STATUS_LABELS, TT_STATUS_TONE, HISTORY_STYLE, ttAvailableActions } from '../lib/workflow';

const RADIO_TONE = { success: 'success', danger: 'danger', navy: 'navy', ghost: 'navy' };
const WO_TYPE_OPTIONS = [
  { value: 'CM', label: 'Corrective Maintenance' },
  { value: 'PM', label: 'Preventive Maintenance' },
  { value: 'PLM', label: 'Planned Maintenance' },
];

function fmtShort(dt) {
  const d = new Date(dt);
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${String(d.getFullYear()).slice(-2)} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}
function fmtDateTime(dt) {
  if (!dt) return ' ';
  return new Date(dt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
// Local (not UTC) "now", formatted for an <input type="datetime-local">.
function nowLocal() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

// Trouble Ticket detail: same "one card, details + inline action" layout
// as a Work Order, but with no EHS or Spare Parts side cards   those only
// start to apply once "Create Work Order" turns this into a real WO. Not
// every trouble ticket needs one   Update/Complete/Cancel/Close let a TT
// be triaged and resolved entirely on its own.
export default function TroubleTicketDetailPage({ id, user, onBack, onOpenWorkOrder }) {
  const [ticket, setTicket] = useState(null);
  const [engineers, setEngineers] = useState([]);
  const [error, setError] = useState('');

  const [activeAction, setActiveAction] = useState(''); // '' | update | complete | cancel | close | create_wo
  const [note, setNote] = useState('');
  const [woType, setWoType] = useState('CM');
  const [nextDue, setNextDue] = useState('');
  const [plannedDate, setPlannedDate] = useState('');
  const [newEngineer, setNewEngineer] = useState('');
  const [faultResolvedAt, setFaultResolvedAt] = useState(nowLocal());
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  const load = useCallback(() => { api.troubleTickets.get(id).then(setTicket).catch((e) => setError(e.message)); }, [id]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.users.engineers().then(setEngineers); }, []);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!ticket) return <p className="text-sm text-slate-400">Loading…</p>;

  const hasUpdate = (ticket.history || []).some((h) => h.action === 'update');
  const actions = ttAvailableActions(ticket, hasUpdate, user);
  const radioOptions = actions.map((a) => ({ value: a.action, label: a.label, tone: RADIO_TONE[a.tone] }));

  const openAction = (v) => {
    setActiveAction(v);
    setNote(''); setNewEngineer(''); setWoType('CM'); setNextDue(''); setPlannedDate(''); setFaultResolvedAt(nowLocal()); setActionError('');
  };

  const canSubmit = activeAction === 'create_wo'
    ? newEngineer && (woType !== 'PM' || nextDue) && (woType !== 'PLM' || plannedDate)
    : note.trim().length > 0 && (activeAction !== 'complete' || faultResolvedAt);

  const submit = async () => {
    setBusy(true); setActionError('');
    try {
      if (activeAction === 'create_wo') {
        const { id: woId } = await api.troubleTickets.createWorkOrder(id, {
          woType, nextDue: woType === 'PM' ? nextDue : undefined, plannedDate: woType === 'PLM' ? plannedDate : undefined,
          engineerId: Number(newEngineer),
        });
        onOpenWorkOrder(woId);
      } else {
        await api.troubleTickets.action(id, activeAction, { note, ...(activeAction === 'complete' ? { faultResolvedAt } : {}) });
        setActiveAction(''); load();
      }
    } catch (e) {
      setActionError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-6xl">
      <BackLink onClick={onBack}>Back to Trouble Tickets</BackLink>

      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <div>
          <div className="text-[13px] text-slate-400 font-bold flex items-center gap-2">{ticket.ttNo} <Badge tone="slate">TT</Badge></div>
          <h1 className="text-2xl font-display font-black text-slate-900 mt-0.5">{ticket.title}</h1>
        </div>
        <Badge tone={TT_STATUS_TONE[ticket.status]}>{TT_STATUS_LABELS[ticket.status]}</Badge>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-5">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-7 lg:col-span-2">
          <p className="text-[11px] uppercase tracking-widest text-slate-400 font-bold mb-5">Trouble Ticket Details</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-5">
            <Field label="Site" value={`${ticket.siteCode}   ${ticket.siteName}`} />
            <Field label="Region" value={ticket.regionName} />
            {ticket.assetName && <Field label="Asset" value={`${ticket.assetTag}   ${ticket.assetName}`} />}
            <Field label="Priority" value={<Badge value={ticket.priority} />} />
            {ticket.category && <Field label="System / Fault Type" value={ticket.category} />}
            <Field label="Created By" value={ticket.createdByName} />
            <Field label="Fault Occur Time" value={fmtDateTime(ticket.faultOccurredAt)} />
            {ticket.faultResolvedAt && <Field label="Fault Resolution Time" value={fmtDateTime(ticket.faultResolvedAt)} />}
          </div>

          <div className="mt-6">
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5">Description</div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 min-h-[110px] text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {ticket.description}
            </div>
          </div>

          {ticket.workOrderId && (
            <div className="mt-6 flex items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
              <span className="text-[13px] text-indigo-800 font-semibold">Created WO ID: {ticket.woNo}</span>
              <Button size="sm" onClick={() => onOpenWorkOrder(ticket.workOrderId)}>View Work Order</Button>
            </div>
          )}

          {actions.length > 0 ? (
            <div className="mt-6 pt-6 border-t border-slate-100">
              <RadioGroup options={radioOptions} value={activeAction} onChange={openAction} />

              {activeAction && (
                <div className="mt-5 pt-5 border-t border-slate-100">
                  {actionError && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">{actionError}</div>}

                  {activeAction === 'create_wo' && (
                    <div className="max-w-lg mx-auto space-y-4 mb-4">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600">Work Order Type</label>
                        <div className="mt-1"><Select value={woType} onChange={setWoType} options={WO_TYPE_OPTIONS} /></div>
                      </div>
                      {woType === 'PM' && (
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">Next Due</label>
                          <input type="date" value={nextDue} onChange={(e) => setNextDue(e.target.value)}
                            className="mt-1 w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary" />
                        </div>
                      )}
                      {woType === 'PLM' && (
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">Planned Date</label>
                          <input type="date" value={plannedDate} onChange={(e) => setPlannedDate(e.target.value)}
                            className="mt-1 w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary" />
                        </div>
                      )}
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600">Assigned Engineer</label>
                        <div className="mt-1"><Select value={newEngineer} onChange={setNewEngineer} options={engineers.map((e) => ({ value: String(e.id), label: e.fullName }))} label="Select engineer" /></div>
                      </div>
                    </div>
                  )}

                  {activeAction === 'complete' && (
                    <div className="max-w-lg mx-auto mb-4">
                      <label className="text-[11px] font-semibold text-slate-600">Fault Resolution Time <span className="text-red-500">*</span></label>
                      <input type="datetime-local" value={faultResolvedAt} onChange={(e) => setFaultResolvedAt(e.target.value)}
                        className="mt-1 w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                  )}

                  {activeAction !== 'create_wo' && (
                    <div className="max-w-lg mx-auto">
                      <label className="text-[11px] font-semibold text-slate-600">Update {activeAction !== 'update' ? '/ reason' : ''} <span className="text-red-500">*</span></label>
                      <div className="mt-1"><Textarea value={note} onChange={setNote} autoFocus rows={activeAction === 'update' ? 3 : 4} placeholder="Description …" /></div>
                    </div>
                  )}

                  <div className="flex justify-center gap-2 mt-5">
                    <Button onClick={submit} disabled={!canSubmit || busy}>{busy ? 'Working…' : activeAction === 'create_wo' ? 'Create Work Order' : activeAction[0].toUpperCase() + activeAction.slice(1)}</Button>

                    <Button variant="ghost" onClick={() => setActiveAction('')}>Back</Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-6 pt-6 border-t border-slate-100 text-sm text-slate-500 font-medium text-center">
              {ticket.status === 'CLOSED' ? 'This trouble ticket is closed.' : 'No actions are available to you on this trouble ticket right now.'}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <SectionCard title="Site Information">
            <div className="space-y-3">
              <Field label="Site ID" value={ticket.siteCode} />
              <Field label="Site Name" value={ticket.siteName} />
              <Field label="Region" value={ticket.regionName} />
              <Field label="Site Location" value={ticket.siteLocation || ' '} />
              <Field label="Site Priority" value={<Badge value={ticket.sitePriority} />} />
            </div>
          </SectionCard>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-display font-bold text-slate-800">Activity History</h2>
        <span className="text-[12px] text-slate-400">{ticket.history.length} {ticket.history.length === 1 ? 'activity' : 'activities'}</span>
      </div>
      <div className="space-y-2 pb-8">
        {ticket.history.map((h) => <HistoryItem key={h.id} h={h} />)}
      </div>
    </div>
  );
}

function HistoryItem({ h }) {
  const [open, setOpen] = useState(false);
  const style = HISTORY_STYLE[h.action] || HISTORY_STYLE.update;
  return (
    <details className="bg-white border border-slate-200 rounded-xl overflow-hidden" open={open} onToggle={(e) => setOpen(e.target.open)}>
      <summary className="list-none flex items-center gap-3 px-5 py-3.5 cursor-pointer select-none">
        <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${style.dot}`} />
        <span className={`text-[11px] font-black tracking-wide shrink-0 w-[110px] ${style.text}`}>{style.label}</span>
        <span className="text-[13px] text-slate-600 flex-1 truncate"></span>
        <span className="text-[12px] text-slate-400 whitespace-nowrap shrink-0">{h.actor} · {fmtShort(h.created_at)}</span>
      </summary>
      <div className="px-5 pb-5 pt-3 border-t border-slate-50">
        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5">Details</div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-[13px] text-slate-700 leading-relaxed whitespace-pre-wrap">
          {h.note}
        </div>
      </div>
    </details>
  );
}
