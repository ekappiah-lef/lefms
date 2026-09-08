import React, { useEffect, useState, useCallback } from 'react';
import { Paperclip } from 'lucide-react';
import { PageHeader, Select, RadioGroup, Table, Td, Tr, Badge, Modal, Button, Textarea, FilePicker, AttachmentRow, Pagination, pageSlice } from '../components/ui';
import { api, uploadsUrl } from '../api/client';
import { hasPerm } from '../config/platform';

const TYPE_TONE = { 'Direct Issue': 'red', 'Direct Return': 'green', Issue: 'blue', Return: 'purple', Restock: 'green', Adjustment: 'slate', 'Sent for Service': 'amber' };
const EVIDENCE_ACCEPT = 'image/*,.pdf,.doc,.docx';

// Off-process movements: a site engineer swaps a part without ever going
// through a formal Spare Request (e.g. they bypass a faulty switch with a
// spare they already had). This is where the warehouse records that part
// going out (Direct Issue) or the old part coming back in (Direct
// Return), tied to a Site rather than a Work Order/Spare Request   with
// photo/document evidence attached, since there's no request paper trail.
export default function SpareTransactions({ user }) {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState(null); // 'issue' | 'return' | null
  const [evidenceFor, setEvidenceFor] = useState(null);
  const canManage = hasPerm(user, 'spare_transactions', 'manage');

  const refresh = useCallback(() => {
    setLoading(true);
    api.spareTransactions.list().then(setRows).finally(() => setLoading(false));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const pageRows = pageSlice(rows, page);

  const exportExcel = async () => {
    setBusy(true);
    try { await api.reports.sparesExcel(); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Spare Returns" subtitle="Direct spare movements to and from a site."
        actions={<>
          <Button variant="ghost" onClick={exportExcel} disabled={busy}>{busy ? 'Exporting…' : 'Export to Excel'}</Button>
          {canManage && <Button variant="ghost" onClick={() => setModal('return')}>Receive from Site</Button>}
          {canManage && <Button onClick={() => setModal('issue')}>Send to Site</Button>}
        </>} />

      <Table headers={['Type', 'Item', 'Qty', 'Site', 'Work Order', 'Performed By', 'Note', 'Evidence', 'Date']} empty={loading ? 'Loading…' : 'No transactions found'}>
        {pageRows.map((r) => (
          <Tr key={r.id}>
            <Td className="whitespace-nowrap"><Badge tone={TYPE_TONE[r.type]}>{r.type}</Badge></Td>
            <Td className="font-medium whitespace-nowrap">{r.sku ? `${r.sku}   ${r.itemName}` : r.itemName}</Td>
            <Td className="whitespace-nowrap">{r.qty} {r.unit}</Td>
            <Td className="whitespace-nowrap">{r.siteCode ? `${r.siteCode}   ${r.siteName}` : ' '}</Td>
            <Td className="whitespace-nowrap">{r.woNo || ' '}</Td>
            <Td className="whitespace-nowrap">{r.performedBy}</Td>
            <Td className="max-w-[220px] truncate">{r.note || ' '}</Td>
            <Td className="whitespace-nowrap">
              {r.attachmentCount > 0 ? (
                <button onClick={() => setEvidenceFor(r.id)} className="text-primary font-semibold text-[12px] hover:underline">{r.attachmentCount} file{r.attachmentCount === 1 ? '' : 's'}</button>
              ) : ' '}
            </Td>
            <Td className="whitespace-nowrap">{new Date(r.createdAt).toLocaleDateString('en-GB')}</Td>
          </Tr>
        ))}
      </Table>
      <Pagination page={page} setPage={setPage} total={rows.length} />

      {modal && (
        <DirectMoveModal
          kind={modal}
          onClose={() => setModal(null)}
          onDone={() => { setModal(null); refresh(); }}
        />
      )}
      {evidenceFor && <EvidenceModal transactionId={evidenceFor} onClose={() => setEvidenceFor(null)} />}
    </div>
  );
}

function EvidenceModal({ transactionId, onClose }) {
  const [files, setFiles] = useState(null);
  useEffect(() => { api.attachments.list('spare_transaction', transactionId).then(setFiles); }, [transactionId]);
  return (
    <Modal open onClose={onClose} title="Evidence" width="max-w-md" footer={<Button variant="ghost" onClick={onClose}>Close</Button>}>
      {!files ? <p className="text-sm text-slate-400">Loading…</p> : files.length === 0 ? <p className="text-sm text-slate-400">No files.</p> : (
        <div className="space-y-1.5">
          {files.map((a) => <AttachmentRow key={a.id} name={a.file_name} onClick={() => window.open(uploadsUrl(a.file_path), '_blank')} />)}
        </div>
      )}
    </Modal>
  );
}

function DirectMoveModal({ kind, onClose, onDone }) {
  const [items, setItems] = useState([]);
  const [sites, setSites] = useState([]);
  const [source, setSource] = useState('catalog'); // 'catalog' | 'other'
  const [spareItemId, setSpareItemId] = useState('');
  const [itemName, setItemName] = useState('');
  const [siteId, setSiteId] = useState('');
  const [qty, setQty] = useState('');
  const [note, setNote] = useState('');
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { api.spareItems.list().then(setItems); api.sites.list().then(setSites); }, []);

  const isIssue = kind === 'issue';
  const canSave = (source === 'catalog' ? !!spareItemId : itemName.trim().length > 0) && siteId && Number(qty) > 0 && note.trim();
  const addFile = (f) => setFiles((s) => [...s, f]);
  const removeFile = (i) => setFiles((s) => s.filter((_, idx) => idx !== i));

  const save = async () => {
    setBusy(true); setError('');
    try {
      const body = {
        siteId: Number(siteId), qty: Number(qty), note,
        ...(source === 'catalog' ? { spareItemId: Number(spareItemId) } : { itemName: itemName.trim() }),
      };
      const { id } = isIssue ? await api.spareTransactions.directIssue(body) : await api.spareTransactions.directReturn(body);
      for (const f of files) {
        await api.attachments.upload('spare_transaction', id, 'other', f);
      }
      onDone();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={isIssue ? 'Send to Site' : 'Receive from Site'}
      subtitle={isIssue ? 'Issue  directly to a site' : 'Receive back from a site'}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={!canSave || busy}>{busy ? 'Saving…' : isIssue ? 'Send' : 'Receive'}</Button></>}>
      {error && <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
      <div className="space-y-3">
        <div>
       
          <div className="mt-1.5"><RadioGroup name="source" value={source} onChange={(v) => { setSource(v); setSpareItemId(''); setItemName(''); }}
            options={[{ value: 'catalog', label: 'From our inventory' }, { value: 'other', label: 'Other item' }]} /></div>
        </div>
        <div>
          {source === 'catalog' ? (
            <>
              <label className="text-[11px] font-semibold text-slate-600">Spare Item</label>
              <div className="mt-1"><Select value={spareItemId} onChange={setSpareItemId} options={items.map((i) => ({ value: String(i.id), label: `${i.sku}   ${i.name} (${i.quantityOnHand} in stock)` }))} label="Select item" /></div>
            </>
          ) : (
            <>
              <label className="text-[11px] font-semibold text-slate-600">Item Name</label>
              <input value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="e.g. Vendor-supplied contactor relay"
                className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary" />
            </>
          )}
        </div>
        <div>
          <label className="text-[11px] font-semibold text-slate-600">Site</label>
          <div className="mt-1"><Select value={siteId} onChange={setSiteId} options={sites.map((s) => ({ value: String(s.id), label: `${s.siteCode}   ${s.name}` }))} label="Select site" /></div>
        </div>
        <div>
          <label className="text-[11px] font-semibold text-slate-600">Quantity</label>
          <input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)}
            className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-slate-600">Short Info <span className="text-red-500">*</span></label>
          <div className="mt-1"><Textarea value={note} onChange={setNote} rows={3} placeholder="Description of request…" /></div>
        </div>
        <div>
          <label className="text-[11px] font-semibold text-slate-600">Evidence (photos, PDF or Word   optional, multiple allowed)</label>
          <div className="mt-1 space-y-1.5">
            {files.map((f, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <span className="truncate flex items-center gap-1.5"><Paperclip className="h-3.5 w-3.5 text-slate-400" />{f.name}</span>
                <button onClick={() => removeFile(i)} className="text-red-600 text-xs font-semibold">Remove</button>
              </div>
            ))}
            <FilePicker onFile={addFile} accept={EVIDENCE_ACCEPT} hint="Click or drag a photo or document here" />
          </div>
        </div>
      </div>
    </Modal>
  );
}
