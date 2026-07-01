// src/pages/AuditLogPage.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, ClipboardList, Search, X, Monitor, Smartphone } from 'lucide-react';
import { format } from 'date-fns';
import Pagination from '../components/Pagination';
import EmptyState from '../components/EmptyState';
import { apiGet } from '../lib/api';
import type { AuditLog, PaginatedResponse } from '../types';

const ACTION_OPTIONS = [
  { value: '',                   label: 'All Actions' },
  // Auth
  { value: 'ADMIN_LOGIN',        label: 'Admin Login' },
  { value: 'ADMIN_LOGOUT',       label: 'Admin Logout' },
  { value: 'ADMIN_LOGIN_FAILED', label: 'Login Failed' },
  // Articles
  { value: 'ARTICLE_CREATE',     label: 'Article Create' },
  { value: 'ARTICLE_UPDATE',     label: 'Article Update' },
  { value: 'ARTICLE_PUBLISH',    label: 'Article Publish' },
  { value: 'ARTICLE_UNPUBLISH',  label: 'Article Unpublish' },
  { value: 'ARTICLE_DELETE',     label: 'Article Delete' },
  { value: 'ARTICLE_BULK_PUBLISH', label: 'Bulk Publish' },
  { value: 'ARTICLE_BULK_DELETE',  label: 'Bulk Delete' },
  { value: 'ARTICLE_BREAKING_ON',  label: 'Breaking ON' },
  { value: 'ARTICLE_BREAKING_OFF', label: 'Breaking OFF' },
  // Categories
  { value: 'CATEGORY_CREATE',    label: 'Category Create' },
  { value: 'CATEGORY_UPDATE',    label: 'Category Update' },
  { value: 'CATEGORY_ACTIVATE',  label: 'Category Activate' },
  { value: 'CATEGORY_DEACTIVATE', label: 'Category Deactivate' },
  // Users
  { value: 'BAN_USER',           label: 'User Ban' },
  { value: 'UNBAN_USER',         label: 'User Unban' },
  // Admin accounts
  { value: 'ADMIN_CREATE',       label: 'Admin Created' },
  { value: 'ADMIN_UPDATE',       label: 'Admin Updated' },
  { value: 'ADMIN_DELETE',       label: 'Admin Deleted' },
  // Local Ads
  { value: 'LOCAL_AD_CREATE',    label: 'Ad Create' },
  { value: 'LOCAL_AD_UPDATE',    label: 'Ad Update' },
  { value: 'LOCAL_AD_DELETE',    label: 'Ad Delete' },
  // Notifications
  { value: 'NOTIFICATION_SEND',  label: 'Notification Sent' },
  // Config
  { value: 'APP_CONFIG_UPDATE',  label: 'App Config Updated' },
];

const ACTION_BADGE: Record<string, string> = {
  // Auth
  ADMIN_LOGIN:          'bg-green-50 text-green-700 border border-green-200',
  ADMIN_LOGOUT:         'badge-gray',
  ADMIN_LOGIN_FAILED:   'bg-red/10 text-status-red border border-red/20',
  // Articles
  ARTICLE_CREATE:       'bg-blue-50 text-blue-700 border border-blue-200',
  ARTICLE_UPDATE:       'bg-sky-50 text-sky-700 border border-sky-200',
  ARTICLE_PUBLISH:      'bg-green-50 text-green-700 border border-green-200',
  ARTICLE_UNPUBLISH:    'bg-yellow-50 text-yellow-700 border border-yellow-200',
  ARTICLE_DELETE:       'bg-red/10 text-status-red border border-red/20',
  ARTICLE_BULK_PUBLISH: 'bg-green-50 text-green-700 border border-green-200',
  ARTICLE_BULK_DELETE:  'bg-red/10 text-status-red border border-red/20',
  ARTICLE_BREAKING_ON:  'bg-orange-50 text-orange-700 border border-orange-200',
  ARTICLE_BREAKING_OFF: 'badge-gray',
  // Categories
  CATEGORY_CREATE:      'bg-purple-50 text-purple-700 border border-purple-200',
  CATEGORY_UPDATE:      'bg-purple-50 text-purple-600 border border-purple-100',
  CATEGORY_ACTIVATE:    'bg-green-50 text-green-700 border border-green-200',
  CATEGORY_DEACTIVATE:  'badge-gray',
  // Users
  BAN_USER:             'bg-red/10 text-status-red border border-red/20',
  UNBAN_USER:           'bg-green-50 text-green-700 border border-green-200',
  // Admin
  ADMIN_CREATE:         'bg-blue-50 text-blue-700 border border-blue-200',
  ADMIN_UPDATE:         'bg-sky-50 text-sky-700 border border-sky-200',
  ADMIN_DELETE:         'bg-red/10 text-status-red border border-red/20',
  // Ads
  LOCAL_AD_CREATE:      'bg-teal-50 text-teal-700 border border-teal-200',
  LOCAL_AD_UPDATE:      'bg-teal-50 text-teal-600 border border-teal-100',
  LOCAL_AD_DELETE:      'bg-red/10 text-status-red border border-red/20',
  // Notifications
  NOTIFICATION_SEND:    'bg-indigo-50 text-indigo-700 border border-indigo-200',
  // Config
  APP_CONFIG_UPDATE:    'bg-amber-50 text-amber-700 border border-amber-200',
};

const TEAM_OPTIONS = [
  { value: '', label: 'All Teams' },
  { value: 'EDITOR_TEAM', label: 'Editor Team' },
  { value: 'VERIFICATION_TEAM', label: 'Verification Team' },
  { value: 'REPORTER_APP_TEAM', label: 'Reporter App Team' },
  { value: 'REPORTERS_MANAGEMENT_TEAM', label: 'Reporters Mgmt' },
  { value: 'ADVERTISEMENT_TEAM', label: 'Advertisement' },
  { value: 'LOCAL_ADS_TEAM', label: 'Local Ads' },
  { value: 'ADMOB_TEAM', label: 'AdMob' },
];

function deviceIcon(device?: string) {
  if (!device) return null;
  const d = device.toLowerCase();
  if (d.includes('mobile') || d.includes('android') || d.includes('iphone')) {
    return <Smartphone size={12} className="text-text-muted flex-shrink-0" />;
  }
  return <Monitor size={12} className="text-text-muted flex-shrink-0" />;
}

function DeviceCell({ device }: { device?: string }) {
  if (!device) return <span className="text-text-muted">—</span>;
  const d = device.toLowerCase();
  let platform = 'Desktop';
  if (d.includes('iphone') || d.includes('ipad')) platform = 'iOS';
  else if (d.includes('android')) platform = 'Android';
  else if (d.includes('mobile')) platform = 'Mobile';
  return (
    <span className="flex items-center gap-1">
      {deviceIcon(device)}
      <span className="text-xs text-text-secondary">{platform}</span>
    </span>
  );
}

export default function AuditLogPage() {
  const [actionFilter, setActionFilter] = useState('');
  const [adminFilter, setAdminFilter]   = useState('');
  const [teamFilter, setTeamFilter]     = useState('');
  const [dateFrom, setDateFrom]         = useState('');
  const [dateTo, setDateTo]             = useState('');
  const [page, setPage]                 = useState(1);
  const LIMIT = 25;

  const hasFilters = !!(actionFilter || adminFilter || teamFilter || dateFrom || dateTo);

  const clearFilters = () => {
    setActionFilter(''); setAdminFilter(''); setTeamFilter('');
    setDateFrom(''); setDateTo(''); setPage(1);
  };

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', actionFilter, adminFilter, teamFilter, dateFrom, dateTo, page],
    queryFn: () =>
      apiGet<{ data: AuditLog[]; meta: { total: number; hasMore: boolean } }>('/admin/audit-logs', {
        action:   actionFilter || undefined,
        adminId:  adminFilter  || undefined,
        team:     teamFilter   || undefined,
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

      {/* ── Filters ────────────────────────────────────────────────────── */}
      <div className="card">
        <div className="card-body py-3">
          <div className="flex flex-wrap items-center gap-3">

            <div className="relative flex-1 min-w-[160px] max-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input
                type="text"
                value={adminFilter}
                onChange={(e) => { setAdminFilter(e.target.value); setPage(1); }}
                placeholder="Filter by admin..."
                className="input pl-8 text-sm"
              />
            </div>

            <select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }} className="input w-auto text-sm">
              {ACTION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            <select value={teamFilter} onChange={(e) => { setTeamFilter(e.target.value); setPage(1); }} className="input w-auto text-sm">
              {TEAM_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            <div className="flex items-center gap-2">
              <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="input w-auto text-sm" />
              <span className="text-text-muted text-xs font-medium">to</span>
              <input type="date" value={dateTo}   onChange={(e) => { setDateTo(e.target.value);   setPage(1); }} className="input w-auto text-sm" />
            </div>

            {hasFilters && (
              <button onClick={clearFilters} className="btn-ghost text-xs flex items-center gap-1 text-text-muted">
                <X size={13} /> Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────────────────────── */}
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
                  <th className="th">Date / Time</th>
                  <th className="th">Admin</th>
                  <th className="th">Team</th>
                  <th className="th">Action</th>
                  <th className="th">Entity</th>
                  <th className="th">IP</th>
                  <th className="th">Device</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="tr-hover">
                    <td className="td text-text-muted text-xs whitespace-nowrap">
                      {format(new Date(log.createdAt), 'dd MMM yyyy')}<br/>
                      <span className="text-2xs">{format(new Date(log.createdAt), 'HH:mm:ss')}</span>
                    </td>
                    <td className="td">
                      <p className="font-medium text-text-primary text-sm">{log.adminName || '—'}</p>
                      {log.adminId && (
                        <code className="text-2xs text-text-muted">{log.adminId.slice(0, 8)}…</code>
                      )}
                    </td>
                    <td className="td text-xs text-text-secondary">
                      {log.adminTeam ? log.adminTeam.replace(/_/g, ' ').replace(' TEAM', '') : '—'}
                    </td>
                    <td className="td">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-2xs font-semibold ${ACTION_BADGE[log.action] ?? 'badge-gray'}`}>
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="td">
                      <span className="text-xs text-text-secondary capitalize">{log.entityType}</span>
                      {log.entityId && (
                        <code className="block text-2xs text-text-muted bg-page border border-border px-1 py-0.5 rounded font-mono mt-0.5">
                          {log.entityId.slice(0, 8)}…
                        </code>
                      )}
                    </td>
                    <td className="td text-text-muted text-xs whitespace-nowrap">{log.ip || '—'}</td>
                    <td className="td"><DeviceCell device={log.device} /></td>
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
