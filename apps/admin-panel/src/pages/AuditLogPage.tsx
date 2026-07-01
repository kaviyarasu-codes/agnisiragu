// src/pages/AuditLogPage.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, ClipboardList, Search, X } from 'lucide-react';
import { format } from 'date-fns';
import Pagination from '../components/Pagination';
import EmptyState from '../components/EmptyState';
import { apiGet } from '../lib/api';
import type { AuditLog, PaginatedResponse } from '../types';

const ACTION_OPTIONS = [
  { value: '', label: 'All Actions' },
  { value: 'CREATE', label: 'Create' },
  { value: 'UPDATE', label: 'Update' },
  { value: 'DELETE', label: 'Delete' },
  { value: 'PUBLISH', label: 'Publish' },
  { value: 'LOGIN', label: 'Login' },
];

const ACTION_BADGE: Record<string, string> = {
  CREATE:  'badge-green',
  UPDATE:  'bg-blue-50 text-blue-700',
  DELETE:  'badge-red',
  PUBLISH: 'bg-purple-50 text-purple-700',
  LOGIN:   'badge-gray',
};

export default function AuditLogPage() {
  const [actionFilter, setActionFilter] = useState('');
  const [adminFilter, setAdminFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const LIMIT = 25;

  const hasFilters = !!(actionFilter || adminFilter || dateFrom || dateTo);

  const clearFilters = () => {
    setActionFilter('');
    setAdminFilter('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', actionFilter, adminFilter, dateFrom, dateTo, page],
    queryFn: () =>
      apiGet<{ data: AuditLog[]; meta: { total: number; hasMore: boolean } }>('/admin/audit-logs', {
        action:   actionFilter || undefined,
        adminId:  adminFilter  || undefined,
        dateFrom: dateFrom     || undefined,
        dateTo:   dateTo       || undefined,
        page,
        limit: LIMIT,
      }),
  });

  const logs = data?.data ?? [];
  const meta = data?.meta;

  const handleNext = () => { if (meta?.hasMore) setPage((p) => p + 1); };
  const handlePrev = () => { if (page > 1) setPage((p) => p - 1); };

  return (
    <div className="space-y-4">

      {/* ── Filters ──────────────────────────────────────────────────── */}
      <div className="card">
        <div className="card-body py-3">
          <div className="flex flex-wrap items-center gap-3">

            {/* Admin ID search */}
            <div className="relative flex-1 min-w-[160px] max-w-[220px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input
                type="text"
                value={adminFilter}
                onChange={(e) => { setAdminFilter(e.target.value); setPage(1); }}
                placeholder="Filter by admin..."
                className="input pl-8 text-sm"
              />
            </div>

            {/* Action dropdown */}
            <select
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
              className="input w-auto text-sm"
            >
              {ACTION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            {/* Date range */}
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                className="input w-auto text-sm"
              />
              <span className="text-text-muted text-xs font-medium">to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                className="input w-auto text-sm"
              />
            </div>

            {/* Clear filters */}
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="btn-ghost text-xs flex items-center gap-1 text-text-muted"
              >
                <X size={13} /> Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Table ────────────────────────────────────────────────────── */}
      <div className="card p-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-red" />
          </div>
        ) : logs.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No audit logs found"
            description={hasFilters ? 'Try adjusting your filters' : 'Admin actions will appear here as they happen'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="th">Admin</th>
                  <th className="th">Action</th>
                  <th className="th">Entity Type</th>
                  <th className="th">Entity ID</th>
                  <th className="th">IP Address</th>
                  <th className="th">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="tr-hover">
                    <td className="td">
                      <p className="font-medium text-text-primary text-sm">{log.adminName || log.adminId}</p>
                    </td>
                    <td className="td">
                      <span className={`badge ${ACTION_BADGE[log.action] ?? 'badge-gray'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="td text-text-secondary text-xs">{log.entityType}</td>
                    <td className="td">
                      {log.entityId ? (
                        <code className="text-2xs text-text-muted bg-page border border-border px-1.5 py-0.5 rounded font-mono">
                          {log.entityId.slice(0, 8)}…
                        </code>
                      ) : <span className="text-text-muted">—</span>}
                    </td>
                    <td className="td text-text-muted text-xs">{log.ip || '—'}</td>
                    <td className="td text-text-muted text-xs whitespace-nowrap">
                      {format(new Date(log.createdAt), 'dd MMM yyyy, HH:mm:ss')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          total={meta?.total ?? 0}
          showing={logs.length}
          hasMore={meta?.hasMore ?? false}
          hasPrev={page > 1}
          onNext={handleNext}
          onPrev={handlePrev}
        />
      </div>
    </div>
  );
}
