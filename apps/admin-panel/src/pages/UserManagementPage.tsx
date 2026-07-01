// src/pages/UserManagementPage.tsx
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Loader2, Users, Ban, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import ConfirmModal from '../components/ConfirmModal';
import Pagination from '../components/Pagination';
import EmptyState from '../components/EmptyState';
import { apiGet, apiPatch } from '../lib/api';
import type { User, PaginatedResponse } from '../types';

export default function UserManagementPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [cursor, setCursor] = useState<string | undefined>();
  const [cursorStack, setCursorStack] = useState<string[]>([]);
  const [banTarget, setBanTarget] = useState<User | null>(null);

  const queryClient = useQueryClient();

  const handleSearchChange = useCallback((val: string) => {
    setSearch(val);
    clearTimeout(window.__userSearchTimeout);
    window.__userSearchTimeout = window.setTimeout(() => {
      setDebouncedSearch(val);
      setCursor(undefined);
    }, 400);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['users', debouncedSearch, cursor],
    queryFn: () =>
      apiGet<PaginatedResponse<User>>('/admin/users', {
        phone: debouncedSearch || undefined,
        cursor,
        limit: 20,
      }),
  });

  const users = data?.data ?? [];
  const meta = data?.meta;

  const banMutation = useMutation({
    mutationFn: ({ id, isBanned }: { id: string; isBanned: boolean }) =>
      apiPatch(`/admin/users/${id}/${isBanned ? 'unban' : 'ban'}`, {}),
    onSuccess: (_, { isBanned }) => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(isBanned ? 'User unbanned' : 'User banned');
      setBanTarget(null);
    },
    onError: () => toast.error('Failed to update user'),
  });

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

      {/* ── Toolbar ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by phone number..."
            className="input pl-9"
          />
        </div>
        {meta?.total !== undefined && (
          <span className="text-xs text-text-muted">{meta.total.toLocaleString()} total users</span>
        )}
      </div>

      {/* ── Table ────────────────────────────────────────────────────── */}
      <div className="card p-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-red" />
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No users found"
            description={debouncedSearch ? 'Try a different phone number' : 'Users will appear here after signing up'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="th">Phone</th>
                  <th className="th">Name</th>
                  <th className="th">Role</th>
                  <th className="th text-center">Articles Read</th>
                  <th className="th">Joined</th>
                  <th className="th">Status</th>
                  <th className="th text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="tr-hover">
                    <td className="td font-semibold text-text-primary">{user.phone}</td>
                    <td className="td text-text-secondary">{user.name || <span className="text-text-muted">—</span>}</td>
                    <td className="td">
                      <span className="badge badge-gray">{user.role}</span>
                    </td>
                    <td className="td text-center text-text-secondary">{user.articleReadCount}</td>
                    <td className="td text-text-muted text-xs whitespace-nowrap">
                      {format(new Date(user.createdAt), 'dd MMM yyyy')}
                    </td>
                    <td className="td">
                      <span className={`badge ${user.isBanned ? 'badge-red' : 'badge-green'}`}>
                        {user.isBanned ? 'Banned' : 'Active'}
                      </span>
                    </td>
                    <td className="td">
                      <div className="flex justify-end">
                        <button
                          onClick={() => setBanTarget(user)}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            user.isBanned
                              ? 'text-status-green hover:bg-status-green-bg'
                              : 'text-status-red hover:bg-status-red-bg'
                          }`}
                        >
                          {user.isBanned ? <ShieldCheck size={13} /> : <Ban size={13} />}
                          {user.isBanned ? 'Unban' : 'Ban'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          total={meta?.total ?? 0}
          showing={users.length}
          hasMore={meta?.hasMore ?? false}
          hasPrev={cursorStack.length > 0}
          onNext={handleNext}
          onPrev={handlePrev}
        />
      </div>

      <ConfirmModal
        isOpen={!!banTarget}
        title={banTarget?.isBanned ? 'Unban User' : 'Ban User'}
        message={
          banTarget?.isBanned
            ? `Unban ${banTarget?.phone ?? 'this user'}? They will regain access.`
            : `Ban ${banTarget?.phone ?? 'this user'}? They will lose access to the platform.`
        }
        confirmLabel={banTarget?.isBanned ? 'Unban' : 'Ban User'}
        danger={!banTarget?.isBanned}
        onConfirm={() => banTarget && banMutation.mutate({ id: banTarget.id, isBanned: banTarget.isBanned })}
        onCancel={() => setBanTarget(null)}
      />
    </div>
  );
}

declare global {
  interface Window {
    __userSearchTimeout: ReturnType<typeof setTimeout>;
  }
}
