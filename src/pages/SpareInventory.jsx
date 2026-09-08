import React, { useEffect, useState, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader, FilterBar, Select, Table, Td, Tr, Badge, Modal, Button, Field, FilePicker, Pagination, pageSlice } from '../components/ui';
import { api } from '../api/client';
import { hasPerm } from '../config/platform';

const CATEGORIES = ['Power', 'Electrical', 'Cooling', 'Other'];

export default function SpareInventory({ user }) {
  const [rows, setRows] = useState([]);
  const [category, setCategory] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const canManage = hasPerm(user, 'spare_inventory', 'manage');

  const refresh = useCallback(() => {
    setLoading(true);
    api.spareItems.list({ ...(category ? { category } : {}), ...(lowStockOnly ? { lowStock: 'true' } : {}), ...(search ? { q: search } : {}) })
      .then(setRows).finally(() => setLoading(false));
  }, [category, lowStockOnly, search]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { setPage(1); }, [category, lowStockOnly, search]);

  const pageRows = pageSlice(rows, page);

  return (
    <div className="space-y-5">
      <PageHeader title="Spare Parts Inventory" subtitle="Catalog, stock on hand and reorder alerts"
        actions={canManage && <>
          <Button variant="ghost" onClick={() => setShowImport(true)}>Bulk Import</Button>
          <Button icon={Plus} onClick={() => setShowNew(true)}>New Item</Button>
        </>} />

      <FilterBar search={search} onSearch={setSearch} placeholder="Search SKU or name…">
        <Select className="w-40" value={category} onChange={setCategory} options={CATEGORIES} label="All categories" />
        <button onClick={() => setLowStockOnly((v) => !v)}
          className={`px-3 py-2 rounded-lg text-sm font-semibold border ${lowStockOnly ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-white border-slate-200 text-slate-600'}`}>
          Low stock only
        </button>
      </FilterBar>

      <Table headers={['SKU', 'Name', 'Category', 'Unit', 'On Hand', 'Reorder Level', 'Store']} empty={loading ? 'Loading…' : 'No spare items found'}>
        {pageRows.map((s) => (
          <Tr key={s.id} onClick={() => setSelected(s)}>
            <Td className="font-semibold text-slate-800">{s.sku}</Td>
            <Td className="font-medium">{s.name}</Td>
            <Td>{s.category || ' '}</Td>
            <Td>{s.unit}</Td>
            <Td><Badge tone={s.lowStock ? 'red' : 'green'}>{s.quantityOnHand}</Badge></Td>
            <Td>{s.reorderLevel}</Td>
            <Td>{s.storeLocation || ' '}</Td>
          </Tr>
        ))}
      </Table>
      <Pagination page={page} setPage={setPage} total={rows.length} />

      {selected && <ItemDetail item={selected} canManage={canManage} onClose={() => setSelected(null)} onChanged={refresh} />}
      {showNew && <NewItem onClose={() => setShowNew(false)} onCreated={() => { setShowNew(false); refresh(); }} />}
      {showImport && <ImportItems onClose={() => setShowImport(false)} onDone={() => { setShowImport(false); refresh(); }} />}
    </div>
  );
}

function ItemDetail({ item, canManage, onClose, onChanged }) {
  const [full, setFull] = useState(null);
  const [restockQty, setRestockQty] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { api.spareItems.get(item.id).then(setFull); }, [item.id]);

  const restock = async () => {
    const qty = Number(restockQty);
    if (!qty || qty <= 0) return;
    setBusy(true);
    try {
      await api.spareItems.restock(item.id, { qty, note: 'Manual restock' });
      setRestockQty('');
      api.spareItems.get(item.id).then(setFull);
      onChanged();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={item.name} subtitle={item.sku} width="max-w-2xl"
      footer={<Button variant="ghost" onClick={onClose}>Close</Button>}>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Category" value={item.category} />
        <Field label="Unit" value={item.unit} />
        <Field label="Store Location" value={item.storeLocation} />
        <Field label="On Hand" value={<Badge tone={item.lowStock ? 'red' : 'green'}>{item.quantityOnHand}</Badge>} />
        <Field label="Reorder Level" value={item.reorderLevel} />
      </div>

      {canManage && (
        <div className="mt-5 pt-5 border-t border-slate-100 flex items-end gap-2">
          <div className="flex-1 max-w-[160px]">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Restock Qty</label>
            <input type="number" min="1" value={restockQty} onChange={(e) => setRestockQty(e.target.value)}
              className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <Button onClick={restock} disabled={!restockQty || busy}>{busy ? 'Saving…' : 'Restock'}</Button>
        </div>
      )}

      <div className="mt-5 pt-5 border-t border-slate-100">
        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 block">Recent Transactions</label>
        <div className="space-y-1.5 max-h-56 overflow-y-auto">
          {(full?.transactions || []).length === 0 && <p className="text-[13px] text-slate-400">No transactions yet.</p>}
          {(full?.transactions || []).map((t) => (
            <div key={t.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-[12px]">
              <span className="font-semibold">{t.type} {t.qty}</span>
              <span className="text-slate-500">{t.woNo || t.siteName || ' '}</span>
              <span className="text-slate-400">{new Date(t.createdAt).toLocaleDateString('en-GB')}</span>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

function NewItem({ onClose, onCreated }) {
  const [f, setF] = useState({ sku: '', name: '', category: CATEGORIES[0], unit: 'pcs', unitCost: '', reorderLevel: '', quantityOnHand: '', storeLocation: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const canSave = f.sku && f.name;

  const save = async () => {
    setBusy(true); setError('');
    try {
      await api.spareItems.create({ ...f, unitCost: Number(f.unitCost) || 0, reorderLevel: Number(f.reorderLevel) || 0, quantityOnHand: Number(f.quantityOnHand) || 0 });
      onCreated();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="New Spare Item" subtitle="Add a spare part to the catalog"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={!canSave || busy}>{busy ? 'Creating…' : 'Create Item'}</Button></>}>
      {error && <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-[11px] font-semibold text-slate-600">SKU</label><input value={f.sku} onChange={(e) => set('sku')(e.target.value)} className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary" /></div>
        <div><label className="text-[11px] font-semibold text-slate-600">Name</label><input value={f.name} onChange={(e) => set('name')(e.target.value)} className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary" /></div>
        <div><label className="text-[11px] font-semibold text-slate-600">Category</label><div className="mt-1"><Select value={f.category} onChange={set('category')} options={CATEGORIES} /></div></div>
        <div><label className="text-[11px] font-semibold text-slate-600">Unit</label><input value={f.unit} onChange={(e) => set('unit')(e.target.value)} className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary" /></div>
        <div><label className="text-[11px] font-semibold text-slate-600">Unit Cost</label><input type="number" value={f.unitCost} onChange={(e) => set('unitCost')(e.target.value)} className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary" /></div>
        <div><label className="text-[11px] font-semibold text-slate-600">Reorder Level</label><input type="number" value={f.reorderLevel} onChange={(e) => set('reorderLevel')(e.target.value)} className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary" /></div>
        <div><label className="text-[11px] font-semibold text-slate-600">Opening Quantity</label><input type="number" value={f.quantityOnHand} onChange={(e) => set('quantityOnHand')(e.target.value)} className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary" /></div>
        <div><label className="text-[11px] font-semibold text-slate-600">Store Location</label><input value={f.storeLocation} onChange={(e) => set('storeLocation')(e.target.value)} className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary" /></div>
      </div>
    </Modal>
  );
}

function ImportItems({ onClose, onDone }) {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState(null);

  const run = async () => {
    if (!file) return;
    setBusy(true); setError('');
    try {
      const result = await api.spareItems.bulkImport(file);
      setReport(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Bulk Import Spares" subtitle="Excel (.xlsx) with columns: SKU, Name, Category, Unit, Unit Cost, Reorder Level, Quantity On Hand, Store Location"
      footer={<>
        <Button variant="ghost" onClick={onClose}>{report ? 'Close' : 'Cancel'}</Button>
        {!report && <Button onClick={run} disabled={!file || busy}>{busy ? 'Importing…' : 'Import'}</Button>}
        {report && <Button onClick={onDone}>Done</Button>}
      </>}>
      {error && <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
      {!report && (file ? (
        <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
          <span className="truncate">{file.name}</span>
          <button onClick={() => setFile(null)} className="text-red-600 text-xs font-semibold">Remove</button>
        </div>
      ) : <FilePicker onFile={setFile} accept=".xlsx" hint="Click or drag an .xlsx file here" />)}
      {report && (
        <div className="space-y-3">
          <div className="flex gap-4 text-sm">
            <span className="font-semibold text-emerald-600">{report.inserted} imported</span>
            <span className="font-semibold text-red-600">{report.failed} failed</span>
            <span className="text-slate-400">{report.total} rows read</span>
          </div>
          {report.failed > 0 && (
            <div className="max-h-64 overflow-y-auto space-y-1.5">
              {report.results.filter((r) => r.status === 'failed').map((r) => (
                <div key={r.row} className="text-[12px] rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-red-700">
                  Row {r.row} ({r.sku || 'no SKU'}): {r.errors.join('; ')}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
