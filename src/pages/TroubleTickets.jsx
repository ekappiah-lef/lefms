import React, { useEffect, useState, useCallback } from 'react';
import { AlertOctagon, Clock, CheckCircle2, Plus } from 'lucide-react';
import { PageHeader, KpiGrid, Kpi, FilterBar, Select, Table, Td, Tr, Badge, Button, Pagination, pageSlice } from '../components/ui';
import { api } from '../api/client';
import { TT_STATUS_LABELS, TT_STATUS_TONE, canCreateIn } from '../lib/workflow';

export default function TroubleTickets({ user, openCreate, openDetail }) {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    api.troubleTickets.list({ ...(status ? { status } : {}), ...(search ? { q: search } : {}) }).then(setRows).finally(() => setLoading(false));
  }, [status, search]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { setPage(1); }, [status, search]);

  const pageRows = pageSlice(rows, page);

  return (
    <div className="space-y-5">
      <PageHeader title="Trouble Tickets" subtitle="All raised trouble tickets across all sites"
        actions={canCreateIn(user, 'trouble_tickets') && <Button icon={Plus} onClick={() => openCreate('trouble_ticket')}>New Trouble Ticket</Button>} />

      <KpiGrid cols={3}>
        <Kpi title="Total TT" value={rows.length} icon={AlertOctagon} />
        <Kpi title="Open TT" value={rows.filter((t) => t.status === 'OPEN').length} icon={Clock} tone="amber" />
        <Kpi title="Closed TT" value={rows.filter((t) => t.status === 'CLOSED').length} icon={CheckCircle2} tone="green" />
      </KpiGrid>

      <FilterBar search={search} onSearch={setSearch} placeholder="Search TT, site, site ID…">
        <Select className="w-40" value={status} onChange={setStatus} options={Object.entries(TT_STATUS_LABELS).map(([value, label]) => ({ value, label }))} label="All statuses" />
      </FilterBar>

      <Table headers={['TT No', 'Title', 'Site', 'Region', 'Priority', 'Status', 'Work Order', 'Created']} empty={loading ? 'Loading…' : 'No trouble tickets found'}>
        {pageRows.map((t) => (
          <Tr key={t.id} onClick={() => openDetail('trouble_ticket', t.id)}>
            <Td className="font-semibold text-slate-800">{t.ttNo}</Td>
            <Td className="font-medium max-w-[200px] truncate">{t.title}</Td>
            <Td>{t.siteCode}   {t.siteName}</Td>
            <Td>{t.regionName}</Td>
            <Td><Badge value={t.priority} /></Td>
            <Td><Badge tone={TT_STATUS_TONE[t.status]}>{TT_STATUS_LABELS[t.status]}</Badge></Td>
            <Td>{t.woNo || ' '}</Td>
            <Td>{new Date(t.createdAt).toLocaleDateString('en-GB')}</Td>
          </Tr>
        ))}
      </Table>
      <Pagination page={page} setPage={setPage} total={rows.length} />
    </div>
  );
}
