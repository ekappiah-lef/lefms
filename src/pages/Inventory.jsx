import React, { useState } from 'react';
import { Package, AlertTriangle, XCircle, ShoppingCart, Plus } from 'lucide-react';
import { PageHeader, KpiGrid, Kpi, FilterBar, Select, Table, Td, Tr, Badge, Button, Modal, ActionBtn, RowActions, DeleteBtn } from '../components/ui';
import { INVENTORY_CATEGORIES } from '../data/extraData';

export default function Inventory({ store }) {
  const { inventory, setInventory, setPurchaseRequests, go } = store;
  const [category, setCategory] = useState('');
  const [showIssue, setShowIssue] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const rows = inventory.filter((i) => !category || i.category === category);

  const statusOf = (qty, reorder) => qty === 0 ? 'Out' : qty <= reorder ? 'Low' : 'OK';

  const issue = (item, qty) => setInventory((prev) => prev.map((i) => {
    if (i.id !== item.id) return i;
    const q = Math.max(0, i.qty - qty);
    return { ...i, qty: q, status: statusOf(q, i.reorder) };
  }));

  const raisePR = (item) => {
    setPurchaseRequests((prev) => [{ id: 'PR-' + Math.floor(5 + Math.random() * 90), item: item.name, qty: item.reorder * 2, dept: 'Central Store', requestedBy: 'Michael Osei', date: '2026-07-19', status: 'Pending', est: item.reorder * 5 }, ...prev]);
    go('procurement');
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Inventory" subtitle="Medical supplies, spare parts, lab & general stores"
        actions={<Button icon={Plus} onClick={() => setShowAdd(true)}>Add Item</Button>} />

      <KpiGrid cols={4}>
        <Kpi title="Line Items" value={inventory.length} icon={Package} tone="blue" />
        <Kpi title="Low Stock" value={inventory.filter((i) => i.status === 'Low').length} icon={AlertTriangle} tone="amber" />
        <Kpi title="Out of Stock" value={inventory.filter((i) => i.status === 'Out').length} icon={XCircle} tone="red" />
        <Kpi title="Categories" value={INVENTORY_CATEGORIES.length} icon={Package} tone="slate" />
      </KpiGrid>

      <FilterBar>
        <Select value={category} onChange={setCategory} options={INVENTORY_CATEGORIES} label="All categories" />
      </FilterBar>

      <Table headers={['SKU', 'Item', 'Category', 'Location', 'Qty', 'UoM', 'Reorder', 'Status', 'Actions']}>
        {rows.map((i) => (
          <Tr key={i.id}>
            <Td className="font-semibold text-slate-800">{i.sku}</Td>
            <Td className="font-medium">{i.name}</Td>
            <Td>{i.category}</Td>
            <Td>{i.location}</Td>
            <Td className={i.status !== 'OK' ? 'text-red-600 font-bold' : ''}>{i.qty}</Td>
            <Td>{i.uom}</Td>
            <Td>{i.reorder}</Td>
            <Td><Badge value={i.status === 'OK' ? 'Active' : i.status === 'Low' ? 'Low' : 'Overdue'}>{i.status}</Badge></Td>
            <Td>
              <RowActions>
                <ActionBtn tone="outline" onClick={() => setShowIssue(i)}>Issue</ActionBtn>
                {i.status !== 'OK' && <ActionBtn tone={i.status === 'Out' ? 'danger' : 'amber'} onClick={() => raisePR(i)}>{i.status === 'Out' ? 'Urgent Reorder' : 'Reorder'}</ActionBtn>}
                <DeleteBtn onDelete={() => setInventory((prev) => prev.filter((x) => x.id !== i.id))} />
              </RowActions>
            </Td>
          </Tr>
        ))}
      </Table>

      <IssueModal item={showIssue} onClose={() => setShowIssue(null)} onIssue={(qty) => { issue(showIssue, qty); setShowIssue(null); }} />
      <AddItem open={showAdd} onClose={() => setShowAdd(false)} onSave={(it) => { setInventory((prev) => [it, ...prev]); setShowAdd(false); }} />
    </div>
  );
}

function AddItem({ open, onClose, onSave }) {
  const [f, setF] = useState({ name: '', sku: '', category: INVENTORY_CATEGORIES[0], location: 'Central Store', qty: 0, uom: 'pcs', reorder: 50 });
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const save = () => {
    const qty = Number(f.qty), reorder = Number(f.reorder);
    onSave({ id: 'INV-' + Math.floor(8 + Math.random() * 900), sku: f.sku || 'GS-' + Math.floor(1000 + Math.random() * 8000), name: f.name, category: f.category, location: f.location, qty, uom: f.uom, reorder, status: qty === 0 ? 'Out' : qty <= reorder ? 'Low' : 'OK' });
  };
  const input = (label, k, full, type = 'text') => (<div className={full ? 'col-span-2' : ''}><label className="text-[11px] font-semibold text-slate-600">{label}</label><input type={type} value={f[k]} onChange={(e) => set(k)(e.target.value)} className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0b1c30]" /></div>);
  return (
    <Modal open={open} onClose={onClose} title="Add Inventory Item" width="max-w-2xl"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={!f.name}>Add Item</Button></>}>
      <div className="grid grid-cols-2 gap-3">
        {input('Item Name', 'name', true)}
        {input('SKU (optional)', 'sku')}
        <div><label className="text-[11px] font-semibold text-slate-600">Category</label><div className="mt-1"><Select value={f.category} onChange={set('category')} options={INVENTORY_CATEGORIES} /></div></div>
        <div><label className="text-[11px] font-semibold text-slate-600">Store / Location</label><div className="mt-1"><Select value={f.location} onChange={set('location')} options={['Central Store', 'Engineering Store', 'Lab Store', 'Pharmacy Store', 'Admin Store']} /></div></div>
        {input('Quantity', 'qty', false, 'number')}
        {input('Unit (UoM)', 'uom')}
        {input('Reorder Level', 'reorder', false, 'number')}
      </div>
    </Modal>
  );
}

function IssueModal({ item, onClose, onIssue }) {
  const [qty, setQty] = useState(1);
  const [dept, setDept] = useState('Wards');
  if (!item) return null;
  return (
    <Modal open={!!item} onClose={onClose} title={`Issue — ${item.name}`} subtitle={`In stock: ${item.qty} ${item.uom}`} width="max-w-md"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={() => onIssue(Number(qty))} disabled={qty < 1 || qty > item.qty}>Issue Stock</Button></>}>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-[11px] font-semibold text-slate-600">Quantity</label><input type="number" value={qty} onChange={(e) => setQty(e.target.value)} className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
        <div><label className="text-[11px] font-semibold text-slate-600">Issue to</label><div className="mt-1"><Select value={dept} onChange={setDept} options={['Wards', 'OPD', 'ICU', 'Theatre', 'Laboratory', 'Pharmacy', 'Maintenance']} /></div></div>
      </div>
    </Modal>
  );
}
