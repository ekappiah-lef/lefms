import React, { useEffect, useState, useCallback } from 'react';
import { Paperclip } from 'lucide-react';
import { BackLink, Badge, Field, Button, Select, Textarea, FilePicker, AttachmentRow, SectionCard } from '../components/ui';
import { api, uploadsUrl } from '../api/client';

const EHS_LABEL = { PENDING: 'Pending', SUBMITTED: 'Submitted', REVIEWED: 'Reviewed' };
const EHS_TONE = { PENDING: 'amber', SUBMITTED: 'blue', REVIEWED: 'green' };
const HISTORY_STYLE = {
  Create: { label: 'CREATED', dot: 'bg-slate-400', text: 'text-slate-600' },
  submit: { label: 'SUBMITTED', dot: 'bg-blue-500', text: 'text-blue-600' },
  review: { label: 'REVIEWED', dot: 'bg-emerald-500', text: 'text-emerald-600' },
};

function fmt(dt) {
  return new Date(dt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function EhsRecordDetail({ id, user, onBack }) {
  const [ehs, setEhs] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [error, setError] = useState('');
  const [checklistDraft, setChecklistDraft] = useState({});
  const [note, setNote] = useState('');
  const [outcome, setOutcome] = useState('Approved');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [reviewing, setReviewing] = useState(false);

  const load = useCallback(() => {
    api.ehsRecords.get(id).then((r) => {
      setEhs(r);
      setChecklistDraft(Object.fromEntries((r.checklist || []).map((c) => [c.id, c.response || 'N/A'])));
    }).catch((e) => setError(e.message));
    api.attachments.list('ehs_record', id).then(setAttachments);
  }, [id]);
  useEffect(() => { load(); }, [load]);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!ehs) return <p className="text-sm text-slate-400">Loading…</p>;

  const isAssignedEngineer = user.role === 'Engineer' && Number(user.id) === Number(ehs.engineerId);
  const canSubmit = ehs.status === 'PENDING' && (isAssignedEngineer || user.role === 'Administrator');
  const canReview = ehs.status === 'SUBMITTED' && (user.role === 'EHS User' || user.role === 'Administrator');

  const uploadFile = async (file) => {
    setBusy(true);
    try {
      await api.attachments.upload('ehs_record', id, 'creation', file);
      const list = await api.attachments.list('ehs_record', id);
      setAttachments(list);
    } finally {
      setBusy(false);
    }
  };

  const submitEhs = async () => {
    setBusy(true); setActionError('');
    try {
      await api.ehsRecords.submit(id, {
        note,
        checklistResponses: Object.entries(checklistDraft).map(([itemId, response]) => ({ id: Number(itemId), response })),
      });
      setNote('');
      load();
    } catch (e) {
      setActionError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const submitReview = async () => {
    setBusy(true); setActionError('');
    try {
      await api.ehsRecords.review(id, { note, outcome });
      setNote(''); setReviewing(false);
      load();
    } catch (e) {
      setActionError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-5xl">
      <BackLink onClick={onBack}>Back to EHS Work Orders</BackLink>

      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <div>
          <div className="text-[13px] text-slate-400 font-bold">{ehs.ehsNo}</div>
          <h1 className="text-2xl font-display font-black text-slate-900 mt-0.5">{ehs.woTitle}</h1>
          <div className="text-[13px] text-slate-400 mt-1">{ehs.woNo} · {ehs.woType} · Created {fmt(ehs.createdAt)}</div>
        </div>
        <Badge tone={EHS_TONE[ehs.status]}>{EHS_LABEL[ehs.status]}</Badge>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-5">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-7 lg:col-span-2">
          <p className="text-[11px] uppercase tracking-widest text-slate-400 font-bold mb-5">EHS Checklist</p>
          <div className="space-y-2">
            {(ehs.checklist || []).map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2">
                <span className="text-[13px] text-slate-700">{c.question}</span>
                {canSubmit ? (
                  <Select className="w-28" value={checklistDraft[c.id] || 'N/A'} onChange={(v) => setChecklistDraft((s) => ({ ...s, [c.id]: v }))} options={['Yes', 'No', 'N/A']} />
                ) : (
                  <Badge tone={c.response === 'Yes' ? 'green' : c.response === 'No' ? 'red' : 'slate'}>{c.response || 'Not answered'}</Badge>
                )}
              </div>
            ))}
          </div>

          <p className="text-[11px] uppercase tracking-widest text-slate-400 font-bold mt-6 mb-3">Photos</p>
          <div className="space-y-1.5 mb-3">
            {attachments.length === 0 && <p className="text-[13px] text-slate-400">No photographs uploaded yet.</p>}
            {attachments.map((a) => (
              <AttachmentRow key={a.id} name={a.file_name} onClick={() => window.open(uploadsUrl(a.file_path), '_blank')} />
            ))}
          </div>
          {canSubmit && <FilePicker onFile={uploadFile} accept="image/*" hint="Click or drag a photo here" />}

          {canSubmit && (
            <div className="mt-6 pt-6 border-t border-slate-100">
              {actionError && <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">{actionError}</div>}
              <label className="text-[11px] font-semibold text-slate-600">Other Note <span className="text-red-500">*</span></label>
              <div className="mt-1"><Textarea value={note} onChange={setNote} rows={3} placeholder="Short Description" /></div>
              <div className="flex justify-end mt-3">
                <Button onClick={submitEhs} disabled={!note.trim() || busy}>{busy ? 'Submitting…' : 'Submit EHS'}</Button>
              </div>
            </div>
          )}

          {canReview && (
            <div className="mt-6 pt-6 border-t border-slate-100">
              {actionError && <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">{actionError}</div>}
              {!reviewing ? (
                <Button onClick={() => setReviewing(true)}>Review</Button>
              ) : (
                <>
                  <label className="text-[11px] font-semibold text-slate-600">Outcome</label>
                  <div className="mt-1 max-w-[200px]"><Select value={outcome} onChange={setOutcome} options={['Approved', 'Flagged']} /></div>
                  <label className="text-[11px] font-semibold text-slate-600 mt-3 block">Review Note <span className="text-red-500">*</span></label>
                  <div className="mt-1"><Textarea value={note} onChange={setNote} rows={3} placeholder="Review Comment" /></div>
                  <div className="flex justify-end gap-2 mt-3">
                    <Button variant="ghost" onClick={() => setReviewing(false)}>Cancel</Button>
                    <Button variant={outcome === 'Flagged' ? 'danger' : 'success'} onClick={submitReview} disabled={!note.trim() || busy}>{busy ? 'Saving…' : `Mark ${outcome}`}</Button>
                  </div>
                </>
              )}
            </div>
          )}

          {ehs.status === 'REVIEWED' && (
            <div className="mt-6 pt-6 border-t border-slate-100 text-sm text-slate-500">
              Reviewed by {ehs.reviewedByName} on {fmt(ehs.reviewedAt)}
              {ehs.reviewNote && <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-2 text-[13px] text-slate-700 whitespace-pre-wrap">{ehs.reviewNote}</div>}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <SectionCard title="Work Order">
            <div className="space-y-3">
              <Field label="Reference" value={ehs.woNo} />
              <Field label="Type" value={ehs.woType} />
              <Field label="Title" value={ehs.woTitle} full />
            </div>
          </SectionCard>
          <SectionCard title="Site">
            <div className="space-y-3">
              <Field label="Site" value={`${ehs.siteCode}   ${ehs.siteName}`} />
              <Field label="Region" value={ehs.regionName} />
              <Field label="Assigned Engineer" value={ehs.engineerName} />
            </div>
          </SectionCard>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-display font-bold text-slate-800">Activity History</h2>
      </div>
      <div className="space-y-2 pb-8">
        {(ehs.history || []).map((h) => (
          <div key={h.id} className="bg-white border border-slate-200 rounded-xl px-5 py-3.5 flex items-center gap-3">
            <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${(HISTORY_STYLE[h.action] || HISTORY_STYLE.Create).dot}`} />
            <span className={`text-[11px] font-black tracking-wide shrink-0 w-[110px] ${(HISTORY_STYLE[h.action] || HISTORY_STYLE.Create).text}`}>{(HISTORY_STYLE[h.action] || HISTORY_STYLE.Create).label}</span>
            <span className="text-[13px] text-slate-600 flex-1 truncate">{h.note}</span>
            <span className="text-[12px] text-slate-400 whitespace-nowrap shrink-0">{h.actor} · {fmt(h.created_at)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
