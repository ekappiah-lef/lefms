import React, { useState } from 'react';
import { ShoppingCart, FileClock, CheckCircle2, Truck, Building2, Plus } from 'lucide-react';
import { PageHeader, KpiGrid, Kpi, Tabs, Table, Td, Tr, Badge, Button, Modal, Select, ActionBtn, RowActions, DeleteBtn } from '../components/ui';

export default function Procurement({ store }) {
  const { purchaseRequests, setPurchaseRequests, purchaseOrders, setPurchaseOrders, suppliers, setSuppliers } = store;
  const [tab, setTab] = useState('Requests');
  const [modal, setModal] = useState(null); // 'pr' | 'po' | 'supplier'

  const decide = (id, status) => setPurchaseRequests((prev) => prev.map((p) => p.id === id ? { ...p, status } : p));
  const receivePO = (id) => setPurchaseOrders((prev) => prev.map((p) => p.id === id ? { ...p, status: 'Received' } : p));

  const addLabel = { Requests: 'New Request', 'Purchase Orders': 'New Purchase Order', Suppliers: 'Add Supplier' }[tab];
  const openAdd = () => setModal(tab === 'Requests' ? 'pr' : tab === 'Purchase Orders' ? 'po' : 'supplier');

  return (
    <div className="space-y-5">
      <PageHeader title="Procurement" subtitle="Purchase requests, orders & supplier management"
        actions={<Button icon={Plus} onClick={openAdd}>{addLabel}</Button>} />

      <KpiGrid cols={4}>
        <Kpi title="Pending PRs" value={purchaseRequests.filter((p) => p.status === 'Pending').length} icon={FileClock} tone="amber" />
        <Kpi title="Approved PRs" value={purchaseRequests.filter((p) => p.status === 'Approved').length} icon={CheckCircle2} tone="green" />
        <Kpi title="Open POs" value={purchaseOrders.filter((p) => !['Received', 'Closed'].includes(p.status)).length} icon={ShoppingCart} tone="blue" />
        <Kpi title="Suppliers" value={suppliers.length} icon={Building2} tone="slate" />
      </KpiGrid>

      <Tabs tabs={['Requests', 'Purchase Orders', 'Suppliers']} active={tab} onChange={setTab} />

      {tab === 'Requests' && (
        <Table headers={['PR', 'Item', 'Qty', 'Department', 'Requested By', 'Date', 'Est. (GHS)', 'Status', 'Decision']}>
          {purchaseRequests.map((p) => (
            <Tr key={p.id}>
              <Td className="font-semibold text-slate-800">{p.id}</Td>
              <Td className="font-medium">{p.item}</Td>
              <Td>{p.qty}</Td>
              <Td>{p.dept}</Td>
              <Td>{p.requestedBy}</Td>
              <Td>{p.date}</Td>
              <Td>{p.est}</Td>
              <Td><Badge value={p.status === 'Approved' ? 'Approved' : p.status === 'Rejected' ? 'Overdue' : 'Pending'}>{p.status}</Badge></Td>
              <Td>
                <RowActions>
                  {p.status === 'Pending' && <ActionBtn tone="success" onClick={() => decide(p.id, 'Approved')}>Approve</ActionBtn>}
                  {p.status === 'Pending' && <ActionBtn tone="danger" onClick={() => decide(p.id, 'Rejected')}>Reject</ActionBtn>}
                  <DeleteBtn onDelete={() => setPurchaseRequests((prev) => prev.filter((x) => x.id !== p.id))} />
                </RowActions>
              </Td>
            </Tr>
          ))}
        </Table>
      )}

      {tab === 'Purchase Orders' && (
        <Table headers={['PO', 'Supplier', 'Items', 'Total (GHS)', 'Date', 'Linked PR', 'Status', '']}>
          {purchaseOrders.map((p) => (
            <Tr key={p.id}>
              <Td className="font-semibold text-slate-800">{p.id}</Td>
              <Td className="font-medium">{p.supplier}</Td>
              <Td>{p.items}</Td>
              <Td>{p.total.toLocaleString()}</Td>
              <Td>{p.date}</Td>
              <Td>{p.linkedPR}</Td>
              <Td><Badge value={p.status === 'Received' ? 'Completed' : p.status === 'Draft' ? 'Pending' : 'In Progress'}>{p.status}</Badge></Td>
              <Td>
                <RowActions>
                  {!['Received', 'Closed'].includes(p.status) && <ActionBtn tone="navy" onClick={() => receivePO(p.id)}>Receive</ActionBtn>}
                  <DeleteBtn onDelete={() => setPurchaseOrders((prev) => prev.filter((x) => x.id !== p.id))} />
                </RowActions>
              </Td>
            </Tr>
          ))}
        </Table>
      )}

      {tab === 'Suppliers' && (
        <Table headers={['Code', 'Supplier', 'Category', 'Contact', 'Rating', 'Status', 'Actions']}>
          {suppliers.map((s) => (
            <Tr key={s.id}>
              <Td className="font-semibold text-slate-800">{s.id}</Td>
              <Td className="font-medium">{s.name}</Td>
              <Td>{s.category}</Td>
              <Td>{s.contact}</Td>
              <Td>⭐ {s.rating}</Td>
              <Td><Badge value="Active" /></Td>
              <Td><DeleteBtn onDelete={() => setSuppliers((prev) => prev.filter((x) => x.id !== s.id))} /></Td>
            </Tr>
          ))}
        </Table>
      )}

      <ProcModal kind={modal} onClose={() => setModal(null)} suppliers={suppliers}
        onSave={(kind, rec) => {
          if (kind === 'pr') setPurchaseRequests((p) => [rec, ...p]);
          if (kind === 'po') setPurchaseOrders((p) => [rec, ...p]);
          if (kind === 'supplier') setSuppliers((p) => [rec, ...p]);
          setModal(null);
        }} />
    </div>
  );
}

function ProcModal({ kind, onClose, onSave, suppliers }) {
  const [f, setF] = useState({});
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  if (!kind) return null;
  const input = (label, k, full, type = 'text') => (<div className={full ? 'col-span-2' : ''}><label className="text-[11px] font-semibold text-slate-600">{label}</label><input type={type} value={f[k] || ''} onChange={(e) => set(k)(e.target.value)} className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0b1c30]" /></div>);

  const titles = { pr: 'New Purchase Request', po: 'New Purchase Order', supplier: 'Add Supplier' };
  const save = () => {
    if (kind === 'pr') onSave('pr', { id: 'PR-' + Math.floor(5 + Math.random() * 90), item: f.item, qty: Number(f.qty) || 1, dept: f.dept || 'Central Store', requestedBy: f.requestedBy || 'Michael Osei', date: '2026-07-19', est: Number(f.est) || 0, status: 'Pending' });
    if (kind === 'po') onSave('po', { id: 'PO-' + Math.floor(2604 + Math.random() * 90), supplier: f.supplier || suppliers[0]?.name, items: f.items, total: Number(f.total) || 0, date: '2026-07-19', linkedPR: f.linkedPR || '', status: 'Draft' });
    if (kind === 'supplier') onSave('supplier', { id: 'SUP-' + Math.floor(5 + Math.random() * 90), name: f.name, category: f.category || 'Medical Supplies', contact: f.contact, rating: 4.0, status: 'Active' });
  };

  return (
    <Modal open={!!kind} onClose={onClose} title={titles[kind]} width="max-w-2xl"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={save}>Save</Button></>}>
      <div className="grid grid-cols-2 gap-3">
        {kind === 'pr' && <>
          {input('Item', 'item', true)}
          {input('Quantity', 'qty', false, 'number')}
          <div><label className="text-[11px] font-semibold text-slate-600">Department</label><div className="mt-1"><Select value={f.dept || 'Central Store'} onChange={set('dept')} options={['Central Store', 'Wards', 'OPD', 'Theatre', 'Laboratory', 'Pharmacy', 'Maintenance']} /></div></div>
          {input('Requested By', 'requestedBy')}
          {input('Estimated Cost (GHS)', 'est', false, 'number')}
        </>}
        {kind === 'po' && <>
          <div className="col-span-2"><label className="text-[11px] font-semibold text-slate-600">Supplier</label><div className="mt-1"><Select value={f.supplier || suppliers[0]?.name} onChange={set('supplier')} options={suppliers.map((s) => s.name)} /></div></div>
          {input('Items (summary)', 'items', true)}
          {input('Total (GHS)', 'total', false, 'number')}
          {input('Linked PR (optional)', 'linkedPR')}
        </>}
        {kind === 'supplier' && <>
          {input('Supplier Name', 'name', true)}
          <div><label className="text-[11px] font-semibold text-slate-600">Category</label><div className="mt-1"><Select value={f.category || 'Medical Supplies'} onChange={set('category')} options={['Medical Supplies', 'Biomedical', 'Pharmacy', 'Laboratory', 'General', 'Maintenance']} /></div></div>
          {input('Contact (email/phone)', 'contact')}
        </>}
      </div>
    </Modal>
  );
}
