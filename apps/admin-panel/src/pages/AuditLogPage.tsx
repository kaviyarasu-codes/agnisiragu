// src/pages/AuditLogPage.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, ClipboardList, Search } from 'lucide-react';
import { format } from 'date-fns';
import Pagination from '../components/Pagination';
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

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700',
  PUBLISH: 'bg-purple-100 text-purple-700',
  LOGIN: 'bg-gray-100 text-gray-700',
};

export default function AuditLogPage() {
  const [actionFilter, setActionFilter] = useState('');
  const [adminFilter, setAdminFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [cursor, setCursor] = useState<string | undefined>();
  const [cursorStack, setCursorStack] = useState<string[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', actionFilter, adminFilter, dateFrom, dateTo, cursor],
    queryFn: () =>
      apiGet<PaginatedResponse<AuditLog>>('/admin/audit-logs', {
        action: actionFilter || undefined,
        adminId: adminFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        cursor,
        limit: 25,
      }),
  });

  const logs = data?.data ?? [];
  const meta = data?.meta;

  const handleNext = () => {
    if (meta?.nextCursor) {
      setCursorStack((prev) => [...prev, cursor ?? '']);
      setCursor(meta.nextCursor);
    }
  };

  const handlePrev = () => {
    const stack = [...cursorStack];
    const prev = stack.pop();
    setCursorStack(stack);
    setCursor(prev || undefined);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="card py-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={adminFilter}
              onChange={(e) => setAdminFilter(e.target.value)}
              placeholder="Filter by admin ID..."
              className="input-field pl-8 w-48 text-sm"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="input-field w-auto text-sm"
          >
            {ACTION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="input-field w-auto text-sm"
            />
            <span className="text-gray-400 text-sm">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="input-field w-auto text-sm"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 size={28} className="animate-spin text-primary" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <ClipboardList size={40} className="mb-2" />
            <p className="text-sm">No audit logs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">Admin</th>
                  <th className="table-header">Action</th>
                  <th className="table-header">Entity Type</th>
                  <th className="table-header">Entity ID</th>
                  <th className="table-header">IP</th>
                  <th className="table-header">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-cell">
                      <div>
                        <p className="font-medium text-sm">{log.adminName || log.adminId}</p>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ACTION_COLORS[log.action] ?? 'bg-gray-100 text-gray-600'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className="text-xs text-gray-600">{log.entityType}</span>
                    </td>
                    <td className="table-cell">
                      <code className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                        {log.entityId.slice(0, 8)}...
                      </code>
                    </td>
                    <td className="table-cell text-xs text-gray-400">{log.ip || '—'}</td>
                    <td className="table-cell text-xs text-gray-400 whitespace-nowrap">
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
          hasPrev={cursorStack.length > 0}
          onNext={handleNext}
          onPrev={handlePrev}
        />
      </div>
    </div>
  );
}
