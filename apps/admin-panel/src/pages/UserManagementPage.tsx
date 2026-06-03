// src/pages/UserManagementPage.tsx
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Loader2, Users, Ban, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import ConfirmModal from '../components/ConfirmModal';
import Pagination from '../components/Pagination';
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
    window.__userSearchTimeout = window.setTimeout(() => setDebouncedSearch(val), 400);
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
      toast.success(isBanned ? 'User unbanned successfully' : 'User banned successfully');
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
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by phone number..."
            className="input-field pl-9"
          />
        </div>
      </div>

      <div className="card p-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 size={28} className="animate-spin text-primary" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <Users size={40} className="mb-2" />
            <p className="text-sm">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">Phone</th>
                  <th className="table-header">Name</th>
                  <th className="table-header">Role</th>
                  <th className="table-header">Articles Read</th>
                  <th className="table-header">Joined</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-cell font-medium">{user.phone}</td>
                    <td className="table-cell">{user.name || <span className="text-gray-300">—</span>}</td>
                    <td className="table-cell">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{user.role}</span>
                    </td>
                    <td className="table-cell text-center">{user.articleReadCount}</td>
                    <td className="table-cell text-gray-400 text-xs whitespace-nowrap">
                      {format(new Date(user.createdAt), 'dd MMM yyyy')}
                    </td>
                    <td className="table-cell">
                      <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium mb-1 ${user.isBanned ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {user.isBanned ? 'Banned' : 'Active'}
                      </span>
                      <button
                        onClick={() => setBanTarget(user)}
                        className={`flex items-center gap-1 p-1.5 rounded-lg transition-colors text-xs ${user.isBanned ? 'text-gray-400 hover:text-green-600 hover:bg-green-50' : 'text-gray-400 hover:text-accent hover:bg-red-50'}`}
                      >
                        {user.isBanned ? <ShieldCheck size={14} /> : <Ban size={14} />}
                        {user.isBanned ? 'Unban' : 'Ban'}
                      </button>
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
            ? `Are you sure you want to unban ${banTarget?.phone ?? 'this user'}? They will regain access.`
            : `Are you sure you want to ban ${banTarget?.phone ?? 'this user'}? They will lose access to the platform.`
        }
        confirmLabel={banTarget?.isBanned ? 'Unban User' : 'Ban User'}
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
