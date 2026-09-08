import React, { useEffect, useState, useCallback } from 'react';
import { Paperclip, Trash2 } from 'lucide-react';
import { BackLink, Badge, Field, Button, Select, Textarea, FilePicker, AttachmentRow, SectionCard, Modal, IconBtn, RadioGroup } from '../components/ui';
import { api, uploadsUrl } from '../api/client';
import { STATUS_LABELS, STATUS_TONE, HISTORY_STYLE, availableActions } from '../lib/workflow';
import { hasPerm } from '../config/platform';

const RADIO_TONE = { success: 'success', danger: 'danger', navy: 'navy', amber: 'amber', ghost: 'navy' };
const ATTACHABLE_ACTIONS = ['update', 'complete'];
const NO_NOTE_ACTIONS = ['accept'];
const EHS_TONE = { PENDING: 'amber', SUBMITTED: 'blue', REVIEWED: 'green' };
const EHS_LABEL = { PENDING: 'Pending', SUBMITTED: 'Submitted', REVIEWED: 'Reviewed' };
const SPARE_STATUS_TONE = { Requested: 'amber', Approved: 'blue', Rejected: 'red', Issued: 'green', 'Partially Issued': 'purple', Closed: 'slate' };

function fmt(dt) {
  return new Date(dt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
// dd/mm/yy hh:mm:ss   short form for the history accordion, per feedback.
function fmtShort(dt) {
  const d = new Date(dt);
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${String(d.getFullYear()).slice(-2)} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

export default function TicketDetailPage({ id, user, onBack, onChanged, onOpenEhs }) {
  const [ticket, setTicket] = useState(null);
  const [engineers, setEngineers] = useState([]);
  const [error, setError] = useState('');

  // Every workflow action (Accept/Reject/Complete/Cancel/Close/Reopen/
  // Reassign/Update) drives this single inline form, rendered below the
  // details card   never a right-side drawer/popup.
  const [activeAction, setActiveAction] = useState(null);
  const [note, setNote] = useState('');
  const [newEngineer, setNewEngineer] = useState('');
  const [checklistDraft, setChecklistDraft] = useState({});
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [showSpareModal, setShowSpareModal] = useState(false);

  const load = useCallback(() => { api.workOrders.get(id).then(setTicket).catch((e) => setError(e.message)); }, [id]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.users.engineers().then(setEngineers); }, []);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!ticket) return <p className="text-sm text-slate-400">Loading…</p>;

  const openAction = (a) => {
    setActiveAction(a);
    setNote(''); setNewEngineer(''); setFile(null); setActionError('');
    if (a.action === 'complete' && ticket.woType === 'PM') {
      setChecklistDraft(Object.fromEntries((ticket.checklist || []).map((c) => [c.id, c.response || 'N/A'])));
    }
  };

  const submit = async () => {
    setBusy(true); setActionError('');
    try {
      const extra = {};
      if (activeAction.needsEngineer && newEngineer) extra.newEngineerId = Number(newEngineer);
      if (ticket.woType === 'PM' && activeAction.action === 'complete') {
        extra.checklistResponses = Object.entries(checklistDraft).map(([itemId, response]) => ({ id: Number(itemId), response }));
      }
      const resp = await api.workOrders.action(id, activeAction.action, { note, ...extra });
      if (file && resp?.historyId) {
        await api.attachments.upload('work_order', id, activeAction.action === 'complete' ? 'completion' : 'other', file, resp.historyId);
      }
      setActiveAction(null);
      load(); onChanged?.();
    } catch (e) {
      setActionError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const actions = availableActions(ticket, user);
  const engineerOptions = engineers.filter((e) => activeAction?.action !== 'reassign' || e.id !== ticket.engineerId).map((e) => ({ value: String(e.id), label: e.fullName }));
  const canSubmit = (NO_NOTE_ACTIONS.includes(activeAction?.action) || note.trim()) && (!activeAction?.engineerRequired || newEngineer);
  const radioOptions = actions.map((a) => ({ value: a.action, label: a.label, tone: RADIO_TONE[a.tone] }));

  return (
    <div className="max-w-6xl">
      <BackLink onClick={onBack}>Back to Work Orders</BackLink>

      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <div>
          <div className="text-[13px] text-slate-400 font-bold flex items-center gap-2">{ticket.woNo} <Badge tone="slate">{ticket.woType}</Badge></div>
          <h1 className="text-2xl font-display font-black text-slate-900 mt-0.5">{ticket.title}</h1>
          <div className="text-[13px] text-slate-400 mt-1">Created {fmt(ticket.createdAt)}</div>
        </div>
        <Badge tone={STATUS_TONE[ticket.status]}>{STATUS_LABELS[ticket.status]} ({ticket.status})</Badge>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-5">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-7 lg:col-span-2">
          <p className="text-[11px] uppercase tracking-widest text-slate-400 font-bold mb-5">Work Order Details</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-5">
            <Field label="Site" value={`${ticket.siteCode}   ${ticket.siteName}`} />
            <Field label="Region" value={ticket.regionName} />
            {ticket.assetName && <Field label="Asset" value={`${ticket.assetTag}   ${ticket.assetName}`} />}
            <Field label="Priority" value={<Badge value={ticket.priority} />} />
            <Field label="Assigned Engineer" value={ticket.engineerName} />
            <Field label="Created By" value={ticket.createdByName} />
            {ticket.woType === 'PM' && <Field label="Frequency" value={ticket.frequency} />}
            {ticket.woType === 'PM' && <Field label="Next Due" value={ticket.nextDue?.slice ? ticket.nextDue.slice(0, 10) : ticket.nextDue} />}
            {ticket.woType === 'PLM' && <Field label="Planned Date" value={ticket.plannedDate?.slice ? ticket.plannedDate.slice(0, 10) : ticket.plannedDate} />}
          </div>

          <div className="mt-6">
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5">Description</div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 min-h-[110px] text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {ticket.description}
            </div>
          </div>

          {actions.length > 0 ? (
            <div className="mt-6 pt-6 border-t border-slate-100">
              <RadioGroup options={radioOptions} value={activeAction?.action || ''} onChange={(v) => openAction(actions.find((a) => a.action === v))} />

              {activeAction && (
                <div className="mt-5 pt-5 border-t border-slate-100">
                  {actionError && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">{actionError}</div>}

                  {activeAction.needsEngineer && (
                    <div className="mb-4 max-w-sm mx-auto">
                      <label className="text-[11px] font-semibold text-slate-600">{activeAction.engineerRequired ? 'Reassign to' : 'Reassign to (optional)'}</label>
                      <div className="mt-1"><Select value={newEngineer} onChange={setNewEngineer} options={engineerOptions} label={activeAction.engineerRequired ? 'Select engineer' : 'Keep current engineer'} /></div>
                    </div>
                  )}

                  {ticket.woType === 'PM' && activeAction.action === 'complete' && (
                    <div className="mb-4 space-y-3 max-w-lg mx-auto">
                      <label className="text-[11px] font-semibold text-slate-600">PM Checklist (not EHS   answers the routine maintenance task list)</label>
                      {(ticket.checklist || []).length === 0 && <p className="text-[13px] text-slate-400">No checklist has been set up yet.</p>}
                      {(ticket.checklist || []).map((c) => (
                        <div key={c.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2">
                          <span className="text-[13px] text-slate-700">{c.task}</span>
                          <Select className="w-28" value={checklistDraft[c.id] || 'N/A'} onChange={(v) => setChecklistDraft((s) => ({ ...s, [c.id]: v }))} options={['Yes', 'No', 'N/A']} />
                        </div>
                      ))}
                    </div>
                  )}

                  {!NO_NOTE_ACTIONS.includes(activeAction.action) && (
                    <div className="max-w-lg mx-auto">
                      <label className="text-[11px] font-semibold text-slate-600">Update {activeAction.action !== 'update' ? '/ reason' : ''} <span className="text-red-500">*</span></label>
                      <div className="mt-1"><Textarea value={note} onChange={setNote} autoFocus rows={activeAction.action === 'update' ? 3 : 4} placeholder="Description" /></div>

                      {ATTACHABLE_ACTIONS.includes(activeAction.action) && (
                        <>
                          <label className="text-[11px] font-semibold text-slate-600 mt-4 block">Attachment (optional)</label>
                          <div className="mt-1">
                            {file ? (
                              <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
                                <span className="truncate flex items-center gap-1.5"><Paperclip className="h-3.5 w-3.5 text-slate-400" />{file.name}</span>
                                <button onClick={() => setFile(null)} className="text-red-600 text-xs font-semibold">Remove</button>
                              </div>
                            ) : <FilePicker onFile={setFile} accept="image/*,.pdf" />}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  <div className="flex justify-center gap-2 mt-5">
                    <Button onClick={submit} disabled={!canSubmit || busy}>{busy ? 'Working…' : activeAction.label}</Button>
                    <Button variant="ghost" onClick={() => setActiveAction(null)}>Back</Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-6 pt-6 border-t border-slate-100 text-sm text-slate-500 font-medium text-center">
              This work order is closed.
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

          <SectionCard title="EHS">
            <div className="space-y-3">
              <Field label="EHS Reference" value={ticket.ehsNo} />
              <Field label="Status" value={<Badge tone={EHS_TONE[ticket.ehsStatus]}>{EHS_LABEL[ticket.ehsStatus] || ticket.ehsStatus}</Badge>} />
              {ticket.ehsOutcome && <Field label="Outcome" value={<Badge tone={ticket.ehsOutcome === 'Approved' ? 'green' : 'red'}>{ticket.ehsOutcome}</Badge>} />}
              {ticket.ehsStatus === 'PENDING' && ticket.ehsOutcome === 'Flagged' && (
                <p className="text-[12px] text-red-600 font-medium">This EHS was flagged and must be resubmitted by the assigned engineer before this work order can be completed.</p>
              )}
              {ticket.ehsStatus === 'PENDING' && ticket.ehsOutcome !== 'Flagged' && (
                <p className="text-[12px] text-slate-400">Complete and submit EHS before this work order can be completed.</p>
              )}
              {ticket.ehsId && onOpenEhs && (
                <Button size="sm" variant="ghost" onClick={() => onOpenEhs(ticket.ehsId)}>Open EHS Record</Button>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Spare Parts">
            {(ticket.spareRequests || []).length === 0 ? (
              <p className="text-[12px] text-slate-400 mb-3">No spare requests on this work order yet.</p>
            ) : (
              <div className="space-y-2 mb-3">
                {ticket.spareRequests.map((r) => (
                  <div key={r.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-[13px]">
                    <span className="font-medium text-slate-700">{r.requestNo}</span>
                    <Badge tone={SPARE_STATUS_TONE[r.status]}>{r.status}</Badge>
                  </div>
                ))}
              </div>
            )}
            {hasPerm(user, 'work_orders', 'manage') && ['CR', 'PR'].includes(ticket.status) && (
              <Button size="sm" variant="ghost" onClick={() => setShowSpareModal(true)}>Request Spare</Button>
            )}
          </SectionCard>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-display font-bold text-slate-800">Activity &amp; Process History</h2>
        <span className="text-[12px] text-slate-400">{ticket.history.length} {ticket.history.length === 1 ? 'activity' : 'activities'}</span>
      </div>
      <div className="space-y-2 pb-8">
        {ticket.history.map((h) => <HistoryItem key={h.id} h={h} woType={ticket.woType} />)}
      </div>

      {showSpareModal && (
        <RequestSpareModal
          workOrderId={id}
          onClose={() => setShowSpareModal(false)}
          onCreated={() => { setShowSpareModal(false); load(); }}
        />
      )}
    </div>
  );
}

function RequestSpareModal({ workOrderId, onClose, onCreated }) {
  const [items, setItems] = useState([]);
  const [lines, setLines] = useState([{ spareItemId: '', qty: 1 }]);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { api.spareItems.list().then(setItems); }, []);

  const setLine = (i, patch) => setLines((s) => s.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const addLine = () => setLines((s) => [...s, { spareItemId: '', qty: 1 }]);
  const removeLine = (i) => setLines((s) => s.filter((_, idx) => idx !== i));

  const validLines = lines.filter((l) => l.spareItemId && Number(l.qty) > 0);
  const canSave = note.trim() && validLines.length > 0;

  const save = async () => {
    setBusy(true); setError('');
    try {
      await api.spareRequests.create({
        workOrderId, note,
        items: validLines.map((l) => ({ spareItemId: Number(l.spareItemId), qtyRequested: Number(l.qty) })),
      });
      onCreated();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Request Spare" subtitle="Automatically linked to this Work Order"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={!canSave || busy}>{busy ? 'Requesting…' : 'Submit Request'}</Button></>}>
      {error && <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
      <div className="space-y-2">
        {lines.map((l, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="flex-1">
              <Select value={l.spareItemId} onChange={(v) => setLine(i, { spareItemId: v })}
                options={items.map((it) => ({ value: String(it.id), label: `${it.sku}   ${it.name} (${it.quantityOnHand} in stock)` }))} label="Select item" />
            </div>
            <input type="number" min="1" value={l.qty} onChange={(e) => setLine(i, { qty: e.target.value })}
              className="w-20 px-2 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary" />
            {lines.length > 1 && <IconBtn icon={Trash2} tone="danger" title="Remove" onClick={() => removeLine(i)} />}
          </div>
        ))}
        <Button size="sm" variant="ghost" onClick={addLine}>Add Item</Button>
      </div>
      <div className="mt-4">
        <label className="text-[11px] font-semibold text-slate-600">Note <span className="text-red-500">*</span></label>
        <div className="mt-1"><Textarea value={note} onChange={setNote} rows={3} placeholder="What's needed and why…" /></div>
      </div>
    </Modal>
  );
}

function HistoryItem({ h, woType }) {
  const [open, setOpen] = useState(false);
  const style = HISTORY_STYLE[h.action] || HISTORY_STYLE.update;
  const showChecklist = woType === 'PM' && h.action === 'complete' && h.checklistSnapshot?.length > 0;
  return (
    <details className="bg-white border border-slate-200 rounded-xl overflow-hidden" open={open} onToggle={(e) => setOpen(e.target.open)}>
      <summary className="list-none flex items-center gap-3 px-5 py-3.5 cursor-pointer select-none">
        <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${style.dot}`} />
        <span className={`text-[11px] font-black tracking-wide shrink-0 w-[110px] ${style.text}`}>{style.label}</span>
        <span className="text-[13px] text-slate-600 flex-1 truncate"></span>
        <span className="text-[12px] text-slate-400 whitespace-nowrap shrink-0">{h.actor} · {fmtShort(h.created_at)}</span>
      </summary>
      <div className="px-5 pb-5 pt-3 border-t border-slate-50 space-y-4">
        <div>
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5">Details</div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-[13px] text-slate-700 leading-relaxed whitespace-pre-wrap">
            {h.note}
          </div>
        </div>

        {showChecklist && (
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5">Checklist at Completion</div>
            <div className="space-y-1.5">
              {h.checklistSnapshot.map((c, i) => (
                <div key={i} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2">
                  <span className="text-[13px] text-slate-700">{c.task}</span>
                  <Badge tone={c.response === 'Yes' ? 'green' : c.response === 'No' ? 'red' : 'slate'}>{c.response || 'N/A'}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {h.attachments?.length > 0 && (
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5">Attachments</div>
            <div className="space-y-1.5">
              {h.attachments.map((a) => (
                <AttachmentRow key={a.id} name={a.fileName} onClick={() => window.open(uploadsUrl(a.filePath), '_blank')} />
              ))}
            </div>
          </div>
        )}

      </div>
    </details>
  );
}
