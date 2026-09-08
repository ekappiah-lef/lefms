import React, { useEffect, useState, useCallback } from 'react';
import { Paperclip } from 'lucide-react';
import { PageHeader, KpiGrid, Kpi, FilterBar, Select, Table, Td, Tr, Badge, Modal, Button, Textarea, FilePicker, AttachmentRow, Pagination, pageSlice } from '../components/ui';
import { api, uploadsUrl } from '../api/client';
import { hasPerm } from '../config/platform';

const EVIDENCE_ACCEPT = 'image/*,.pdf,.doc,.docx';

const STATUS_TONE = { Requested: 'amber', Approved: 'blue', Rejected: 'red', Issued: 'green', 'Partially Issued': 'purple', Closed: 'slate' };

export default function SpareRequests({ user }) {
  const [rows, setRows] = useState([]);
  const [dash, setDash] = useState(null);
  const [status, setStatus] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    api.spareRequests.list({ ...(status ? { status } : {}) }).then(setRows).finally(() => setLoading(false));
  }, [status]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { api.dashboard.spares().then(setDash); }, []);
  useEffect(() => { setPage(1); }, [status]);

  const pageRows = pageSlice(rows, page);
  const closeModal = () => { setSelectedId(null); refresh(); api.dashboard.spares().then(setDash); };

  return (
    <div className="space-y-5">
      <PageHeader title="Spare Requests" subtitle="All spare requests linked to a Work Order" />

      {dash && (
        <KpiGrid cols={4}>
          <Kpi title="Total Requests" value={dash.total} />
          <Kpi title="Awaiting Approval" value={dash.statusCounts.Requested} tone="amber" />
          <Kpi title="Open (Approved/Partial)" value={dash.statusCounts.Approved + dash.statusCounts['Partially Issued']} tone="blue" />
          <Kpi title="Low Stock Items" value={dash.lowStockCount} tone={dash.lowStockCount > 0 ? 'rose' : 'green'} />
        </KpiGrid>
      )}

      <FilterBar>
        <Select className="w-48" value={status} onChange={setStatus} options={Object.keys(STATUS_TONE).map((s) => ({ value: s, label: s }))} label="All statuses" />
      </FilterBar>

      <Table headers={['Request No', 'Work Order', 'Site', 'Region', 'Requested By', 'Status', 'Created']} empty={loading ? 'Loading…' : 'No spare requests found'}>
        {pageRows.map((r) => (
          <Tr key={r.id} onClick={() => setSelectedId(r.id)}>
            <Td className="font-semibold text-slate-800">{r.requestNo}</Td>
            <Td>{r.woNo}</Td>
            <Td>{r.siteCode}   {r.siteName}</Td>
            <Td>{r.regionName}</Td>
            <Td>{r.requestedByName}</Td>
            <Td><Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge></Td>
            <Td>{new Date(r.createdAt).toLocaleDateString('en-GB')}</Td>
          </Tr>
        ))}
      </Table>
      <Pagination page={page} setPage={setPage} total={rows.length} />

      {selectedId && <RequestDetail id={selectedId} user={user} onClose={closeModal} />}
    </div>
  );
}

function RequestDetail({ id, user, onClose }) {
  const [req, setReq] = useState(null);
  const [action, setAction] = useState(null); // 'approve' | 'reject' | 'issue' | 'return' | 'close'
  const [note, setNote] = useState('');
  const [lineQty, setLineQty] = useState({});
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const canManage = hasPerm(user, 'spare_fulfillment', 'manage');

  const load = () => api.spareRequests.get(id).then(setReq);
  useEffect(() => { load(); }, [id]);

  if (!req) return <Modal open onClose={onClose} title="Loading…"><p className="text-sm text-slate-400">Loading…</p></Modal>;

  const openAction = (a) => { setAction(a); setNote(''); setError(''); setLineQty({}); setFiles([]); };
  const removeFile = (i) => setFiles((s) => s.filter((_, idx) => idx !== i));

  const submit = async () => {
    setBusy(true); setError('');
    try {
      let historyId;
      if (action === 'approve' || action === 'reject') {
        ({ historyId } = await api.spareRequests.action(id, action, { note }));
      } else if (action === 'issue' || action === 'return') {
        const items = req.items
          .map((it) => ({ requestItemId: it.id, qty: Number(lineQty[it.id] || 0) }))
          .filter((l) => l.qty > 0);
        if (!items.length) { setError('Enter a quantity for at least one item'); setBusy(false); return; }
        ({ historyId } = await api.spareRequests.action(id, action, { note, items }));
      } else if (action === 'close') {
        ({ historyId } = await api.spareRequests.action(id, 'close', { note }));
      }
      if (historyId && files.length) {
        for (const f of files) await api.attachments.upload('spare_request', id, 'other', f, historyId);
      }
      setAction(null);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const remainingToIssue = (it) => it.qtyRequested - it.qtyIssued;
  const remainingToReturn = (it) => it.qtyIssued - it.qtyReturned;

  return (
    <Modal open onClose={onClose} title={req.requestNo} subtitle={`${req.woNo} · ${req.siteCode}   ${req.siteName}`} width="max-w-2xl"
      footer={<Button variant="ghost" onClick={onClose}>Close</Button>}>
      <div className="flex items-center justify-between mb-4">
        <Badge tone={{ Requested: 'amber', Approved: 'blue', Rejected: 'red', Issued: 'green', 'Partially Issued': 'purple', Closed: 'slate' }[req.status]}>{req.status}</Badge>
        <span className="text-[12px] text-slate-400">Requested by {req.requestedByName}</span>
      </div>

      {req.note && (
        <div className="mb-4">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Note</div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[13px] text-slate-700">{req.note}</div>
        </div>
      )}

      <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5">Items</div>
      <div className="border border-slate-200 rounded-xl overflow-hidden mb-4">
        <table className="w-full text-[13px]">
          <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500">
            <tr><th className="px-3 py-2 text-left">Item</th><th className="px-3 py-2 text-right">Requested</th><th className="px-3 py-2 text-right">Issued</th><th className="px-3 py-2 text-right">Returned</th>{(action === 'issue' || action === 'return') && <th className="px-3 py-2 text-right">Qty</th>}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {req.items.map((it) => (
              <tr key={it.id}>
                <td className="px-3 py-2">{it.sku}   {it.name}</td>
                <td className="px-3 py-2 text-right">{it.qtyRequested} {it.unit}</td>
                <td className="px-3 py-2 text-right">{it.qtyIssued}</td>
                <td className="px-3 py-2 text-right">{it.qtyReturned}</td>
                {action === 'issue' && (
                  <td className="px-3 py-2 text-right">
                    <input type="number" min="0" max={remainingToIssue(it)} value={lineQty[it.id] || ''} onChange={(e) => setLineQty((s) => ({ ...s, [it.id]: e.target.value }))}
                      placeholder={String(remainingToIssue(it))} className="w-20 px-2 py-1 text-right text-sm rounded border border-slate-200" />
                  </td>
                )}
                {action === 'return' && (
                  <td className="px-3 py-2 text-right">
                    <input type="number" min="0" max={remainingToReturn(it)} value={lineQty[it.id] || ''} onChange={(e) => setLineQty((s) => ({ ...s, [it.id]: e.target.value }))}
                      placeholder={String(remainingToReturn(it))} className="w-20 px-2 py-1 text-right text-sm rounded border border-slate-200" />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {canManage && !action && (
        <div className="flex flex-wrap gap-2">
          {req.status === 'Requested' && <>
            <Button variant="success" onClick={() => openAction('approve')}>Approve</Button>
            <Button variant="danger" onClick={() => openAction('reject')}>Reject</Button>
          </>}
          {['Approved', 'Partially Issued'].includes(req.status) && <Button onClick={() => openAction('issue')}>Issue</Button>}
          {['Issued', 'Partially Issued'].includes(req.status) && <Button variant="ghost" onClick={() => openAction('return')}>Return</Button>}
          {['Issued', 'Partially Issued', 'Rejected'].includes(req.status) && <Button variant="ghost" onClick={() => openAction('close')}>Close</Button>}
        </div>
      )}

      {action && (
        <div className="mt-2 pt-4 border-t border-slate-100">
          {error && <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
          <label className="text-[11px] font-semibold text-slate-600">Update <span className="text-red-500">*</span></label>
          <div className="mt-1"><Textarea value={note} onChange={setNote} rows={3} autoFocus placeholder="Description" /></div>

          {(action === 'issue' || action === 'return') && (
            <div className="mt-3">
              <label className="text-[11px] font-semibold text-slate-600">Evidence (photos, PDF or Word   optional, multiple allowed)</label>
              <div className="mt-1 space-y-1.5">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
                    <span className="truncate flex items-center gap-1.5"><Paperclip className="h-3.5 w-3.5 text-slate-400" />{f.name}</span>
                    <button onClick={() => removeFile(i)} className="text-red-600 text-xs font-semibold">Remove</button>
                  </div>
                ))}
                <FilePicker onFile={(f) => setFiles((s) => [...s, f])} accept={EVIDENCE_ACCEPT} hint="Click or drag a photo or document here" />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-3">
            <Button variant="ghost" onClick={() => setAction(null)}>Cancel</Button>
            <Button onClick={submit} disabled={!note.trim() || busy}>{busy ? 'Working…' : action[0].toUpperCase() + action.slice(1)}</Button>
          </div>
        </div>
      )}

      {req.history?.length > 0 && (
        <div className="mt-5 pt-5 border-t border-slate-100">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2">History</div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {req.history.map((h) => (
              <div key={h.id} className="rounded-lg border border-slate-100 px-3 py-2">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="font-semibold text-slate-700">{h.action}</span>
                  <span className="text-slate-500 truncate flex-1 mx-2">{h.note}</span>
                  <span className="text-slate-400 whitespace-nowrap">{h.actor} · {new Date(h.created_at).toLocaleDateString('en-GB')}</span>
                </div>
                {h.attachments?.length > 0 && (
                  <div className="mt-1.5 space-y-1">
                    {h.attachments.map((a) => (
                      <AttachmentRow key={a.id} name={a.fileName} onClick={() => window.open(uploadsUrl(a.filePath), '_blank')} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}
