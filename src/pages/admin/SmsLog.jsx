import React, { useEffect, useState, useCallback } from 'react';
import { PageHeader, FilterBar, Select, DateInput, Table, Td, Tr, Badge, Pagination, pageSlice } from '../../components/ui';
import { api } from '../../api/client';

const EVENT_LABEL = { wo_assigned: 'WO Assigned', wo_high_critical: 'High / Critical WO', wo_pending: 'WO Pending 10+ Days' };
const RECIPIENT_LABEL = { engineer: 'Engineer', group: 'Group' };

export default function SmsLog() {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState('');
  const [eventType, setEventType] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const refresh = useCallback(() => {
    setLoading(true);
    api.smsLog.list({ ...(status ? { status } : {}), ...(eventType ? { eventType } : {}), ...(from ? { from } : {}), ...(to ? { to } : {}) })
      .then(setRows).finally(() => setLoading(false));
  }, [status, eventType, from, to]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { setPage(1); }, [status, eventType, from, to]);

  return (
    <div className="space-y-5">
      <PageHeader title="SMS Log" subtitle="Every SMS alert LEF MS has attempted to send, delivered or failed" />

      <FilterBar>
        <Select className="w-40" value={status} onChange={setStatus} options={['sent', 'failed']} label="All statuses" />
        <Select className="w-52" value={eventType} onChange={setEventType} options={Object.entries(EVENT_LABEL).map(([value, label]) => ({ value, label }))} label="All events" />
        <DateInput value={from} onChange={setFrom} />
        <span className="text-slate-400 text-xs">to</span>
        <DateInput value={to} onChange={setTo} />
      </FilterBar>

      <Table headers={['Sent', 'Event', 'Recipient', 'Phone', 'Work Order', 'Status', 'Response']} empty={loading ? 'Loading…' : 'No SMS attempts recorded yet'}>
        {pageSlice(rows, page).map((r) => (
          <Tr key={r.id}>
            <Td className="whitespace-nowrap">{new Date(r.createdAt).toLocaleString('en-GB')}</Td>
            <Td>{EVENT_LABEL[r.eventType] || r.eventType}</Td>
            <Td>{r.recipientLabel} <span className="text-slate-400 text-[11px]">({RECIPIENT_LABEL[r.recipientType] || r.recipientType})</span></Td>
            <Td>{r.phone}</Td>
            <Td>{r.woNo || <span className="text-slate-400">—</span>}</Td>
            <Td><Badge tone={r.status === 'sent' ? 'green' : 'red'}>{r.status === 'sent' ? 'Delivered' : 'Failed'}</Badge></Td>
            <Td className="max-w-[260px] truncate text-slate-500">{r.response || ' '}</Td>
          </Tr>
        ))}
      </Table>
      <Pagination page={page} setPage={setPage} total={rows.length} />
    </div>
  );
}
