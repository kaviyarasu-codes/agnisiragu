// src/pages/PushNotificationPage.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Send, Bell, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { apiGet, apiPost } from '../lib/api';
import { useCategories } from '../hooks/useCategories';
import type { Notification } from '../types';

const schema = z.object({
  titleTa: z.string().min(1, 'Tamil title is required'),
  bodyTa: z.string().min(1, 'Tamil body is required'),
  titleEn: z.string().min(1, 'English title is required'),
  bodyEn: z.string().min(1, 'English body is required'),
  target: z.enum(['ALL', 'CATEGORY']),
  categoryId: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function PushNotificationPage() {
  const queryClient = useQueryClient();
  const { data: catData } = useCategories();
  const categories = catData?.data ?? [];

  const { data: notifData, isLoading: notifLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiGet<{ data: Notification[] }>('/notifications'),
  });

  const notifications = notifData?.data ?? [];

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { target: 'ALL' },
  });

  const target = watch('target');

  const sendMutation = useMutation({
    mutationFn: (payload: FormValues) => apiPost('/notifications/send', payload),
    onSuccess: () => {
      toast.success('Notification sent successfully!');
      reset();
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: () => toast.error('Failed to send notification'),
  });

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Compose Form */}
      <div>
        <div className="card">
          <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Bell size={18} className="text-primary" />
            Compose Notification
          </h3>

          <form onSubmit={handleSubmit((v) => sendMutation.mutate(v))} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title (Tamil)</label>
                <input
                  {...register('titleTa')}
                  className="input-field"
                  placeholder="அறிவிப்பு தலைப்பு"
                />
                {errors.titleTa && <p className="mt-1 text-xs text-accent">{errors.titleTa.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title (English)</label>
                <input
                  {...register('titleEn')}
                  className="input-field"
                  placeholder="Notification title"
                />
                {errors.titleEn && <p className="mt-1 text-xs text-accent">{errors.titleEn.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Body (Tamil)</label>
                <textarea
                  {...register('bodyTa')}
                  rows={3}
                  className="input-field resize-none"
                  placeholder="அறிவிப்பு உடலை உள்ளிடுக..."
                />
                {errors.bodyTa && <p className="mt-1 text-xs text-accent">{errors.bodyTa.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Body (English)</label>
                <textarea
                  {...register('bodyEn')}
                  rows={3}
                  className="input-field resize-none"
                  placeholder="Notification body..."
                />
                {errors.bodyEn && <p className="mt-1 text-xs text-accent">{errors.bodyEn.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
              <select {...register('target')} className="input-field">
                <option value="ALL">All Users</option>
                <option value="CATEGORY">By Category</option>
              </select>
            </div>

            {target === 'CATEGORY' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select {...register('categoryId')} className="input-field">
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.nameTa} / {c.nameEn}</option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={sendMutation.isPending}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {sendMutation.isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
              Send Now
            </button>
          </form>
        </div>
      </div>

      {/* History */}
      <div className="card p-0">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-800">Sent Notifications</h3>
        </div>

        {notifLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 size={24} className="animate-spin text-primary" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <Bell size={36} className="mb-2" />
            <p className="text-sm">No notifications sent yet</p>
          </div>
        ) : (
          <div className="overflow-y-auto max-h-[500px]">
            {notifications.map((n) => (
              <div key={n.id} className="px-6 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-gray-800 truncate">{n.titleTa}</p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{n.bodyTa}</p>
                    <p className="text-xs text-gray-400 mt-1">Target: {n.target}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${n.status === 'SENT' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {n.status}
                    </span>
                    <p className="text-xs text-gray-400 mt-1 whitespace-nowrap">
                      {n.sentAt ? format(new Date(n.sentAt), 'dd MMM, HH:mm') : '—'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
