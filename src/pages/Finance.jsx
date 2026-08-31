import React, { useState } from 'react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import { Wallet, CheckCircle2, Clock, FileText, TrendingUp } from 'lucide-react';
import { PageHeader, KpiGrid, Kpi, SectionCard, FilterBar, Select, Table, Td, Tr, Badge, Modal, Button, Field, ActionBtn, RowActions, DeleteBtn } from '../components/ui';
import { INVOICE_STATUSES } from '../data/extraData';

const COLORS = ['#10b981', '#febb06', '#0b1c30', '#ef4444'];
const MONTHLY = [
  { m: 'Feb', revenue: 182, outstanding: 40 }, { m: 'Mar', revenue: 205, outstanding: 55 },
  { m: 'Apr', revenue: 198, outstanding: 48 }, { m: 'May', revenue: 233, outstanding: 61 },
  { m: 'Jun', revenue: 251, outstanding: 44 }, { m: 'Jul', revenue: 268, outstanding: 72 },
];

export default function Finance({ store }) {
  const { invoices, setInvoices } = store;
  const [status, setStatus] = useState('');
  const [sel, setSel] = useState(null);
  const rows = invoices.filter((i) => !status || i.status === status);

  const revenue = invoices.filter((i) => i.status === 'Paid').reduce((s, i) => s + i.total, 0);
  const outstanding = invoices.filter((i) => i.status !== 'Paid').reduce((s, i) => s + i.total, 0);

  const markPaid = (id) => {
    setInvoices((prev) => prev.map((i) => i.id === id ? { ...i, status: 'Paid' } : i));
    if (sel?.id === id) setSel((s) => ({ ...s, status: 'Paid' }));
  };
  const submitClaim = (id) => {
    setInvoices((prev) => prev.map((i) => i.id === id ? { ...i, status: 'Claim Submitted' } : i));
    if (sel?.id === id) setSel((s) => ({ ...s, status: 'Claim Submitted' }));
  };

  const byPayer = ['NHIS', 'Private', 'Cash'].map((p) => ({ name: p, value: invoices.filter((i) => i.payer === p).reduce((s, i) => s + i.total, 0) }));

  return (
    <div className="space-y-5">
      <PageHeader title="Finance" subtitle="Patient billing, NHIS/insurance claims & payments" />

      <KpiGrid cols={4}>
        <Kpi title="Revenue (Paid)" value={`GHS ${revenue.toLocaleString()}`} icon={CheckCircle2} tone="green" />
        <Kpi title="Outstanding" value={`GHS ${outstanding.toLocaleString()}`} icon={Clock} tone="amber" />
        <Kpi title="Invoices" value={invoices.length} icon={FileText} tone="blue" />
        <Kpi title="NHIS Claims" value={invoices.filter((i) => i.status.includes('Claim') || i.payer === 'NHIS').length} icon={Wallet} tone="blue" />
      </KpiGrid>

      <SectionCard title="Revenue Trend (GHS '000)" action={<span className="inline-flex items-center gap-1 text-[12px] font-semibold text-emerald-600"><TrendingUp className="h-4 w-4" /> +7% MoM</span>}>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={MONTHLY} margin={{ left: -18, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
            <XAxis dataKey="m" tick={{ fontSize: 11 }} stroke="#94a3b8" />
            <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
            <Tooltip />
            <Legend />
            <Bar dataKey="revenue" name="Revenue" fill="#0b1c30" radius={[4, 4, 0, 0]} />
            <Bar dataKey="outstanding" name="Outstanding" fill="#febb06" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </SectionCard>

      <div className="grid lg:grid-cols-3 gap-4">
        <SectionCard title="Revenue by Payer">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={byPayer} dataKey="value" nameKey="name" innerRadius={40} outerRadius={75} paddingAngle={3}>
                {byPayer.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-3">
            {byPayer.map((p, i) => <span key={p.name} className="flex items-center gap-1 text-[11px] text-slate-600"><span className="h-2 w-2 rounded-full" style={{ background: COLORS[i] }} />{p.name}</span>)}
          </div>
        </SectionCard>

        <div className="lg:col-span-2 space-y-4">
          <FilterBar>
            <Select value={status} onChange={setStatus} options={INVOICE_STATUSES} label="All statuses" />
          </FilterBar>
          <Table headers={['Invoice', 'Patient', 'Payer', 'Date', 'Total', 'Status', '']}>
            {rows.map((i) => (
              <Tr key={i.id} onClick={() => setSel(i)}>
                <Td className="font-semibold text-slate-800">{i.id}</Td>
                <Td className="font-medium">{i.patient}</Td>
                <Td>{i.payer}</Td>
                <Td>{i.date}</Td>
                <Td className="font-semibold">GHS {i.total.toLocaleString()}</Td>
                <Td><Badge value={i.status === 'Paid' ? 'Paid' : i.status === 'Overdue' ? 'Overdue' : 'Pending'}>{i.status}</Badge></Td>
                <Td onClick={(e) => e.stopPropagation()}>
                  <RowActions>
                    {i.status !== 'Paid' && <ActionBtn tone="success" onClick={() => markPaid(i.id)}>Settle</ActionBtn>}
                    <DeleteBtn onDelete={() => setInvoices((prev) => prev.filter((x) => x.id !== i.id))} />
                  </RowActions>
                </Td>
              </Tr>
            ))}
          </Table>
        </div>
      </div>

      <Modal open={!!sel} onClose={() => setSel(null)} title={sel ? `Invoice ${sel.id}` : ''} subtitle={sel ? `${sel.patient} · ${sel.payer}` : ''}
        footer={sel && (<>{sel.payer === 'NHIS' && sel.status !== 'Claim Submitted' && <Button variant="ghost" onClick={() => submitClaim(sel.id)}>Submit NHIS Claim</Button>}{sel.status !== 'Paid' && <Button icon={Wallet} onClick={() => markPaid(sel.id)}>Mark Paid</Button>}</>)}>
        {sel && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Patient No" value={sel.patientId} />
              <Field label="Status" value={<Badge value={sel.status === 'Paid' ? 'Paid' : 'Pending'}>{sel.status}</Badge>} />
              <Field label="Payer" value={sel.payer} />
              <Field label="Date" value={sel.date} />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Line Items</div>
              <Table headers={['Service', 'Amount (GHS)']}>
                {sel.services.map((s, i) => (<Tr key={i}><Td>{s.desc}</Td><Td>{s.amount}</Td></Tr>))}
              </Table>
              <div className="flex justify-end mt-2 text-sm font-bold text-slate-800">Total: GHS {sel.total.toLocaleString()}</div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
