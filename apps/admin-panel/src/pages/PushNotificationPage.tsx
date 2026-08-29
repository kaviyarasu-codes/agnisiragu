// src/pages/PushNotificationPage.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Send, Bell, Loader2, Users, Tag, Newspaper, X } from 'lucide-react';
import { format } from 'date-fns';
import { apiGet, apiPost } from '../lib/api';
import { useCategories } from '../hooks/useCategories';
import type { Notification, Article } from '../types';

const schema = z
  .object({
    titleTa: z.string().min(1, 'Tamil title is required'),
    bodyTa: z.string().min(1, 'Tamil body is required'),
    titleEn: z.string().min(1, 'English title is required'),
    bodyEn: z.string().min(1, 'English body is required'),
    target: z.enum(['ALL', 'CATEGORY']),
    categoryId: z.string().optional(),
  })
  // "By Category" with no category picked was silently submitting
  // categoryId: '' — the backend's @IsUUID() validator rejects an empty
  // string (it only skips undefined/null), so that request 400'd and the
  // admin panel only ever showed a generic "Failed to send notification"
  // toast with no clue why. Catch it here instead, before it leaves the browser.
  .refine((v) => v.target !== 'CATEGORY' || !!v.categoryId, {
    message: 'Pick a category',
    path: ['categoryId'],
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

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { target: 'ALL' },
  });

  const target = watch('target');

  // Optional "open this article on tap" link — previously the compose form
  // had no way to set this at all, so a manually-sent notification always
  // opened to the default screen instead of the relevant story (breaking-
  // news auto-sends already did this via the same `data.articleId` field —
  // see news.service.ts's notifyBreaking — this just exposes it here too).
  const [articleQuery, setArticleQuery] = useState('');
  const [linkedArticle, setLinkedArticle] = useState<Article | null>(null);
  const articleSearchEnabled = articleQuery.trim().length > 1;
  const { data: articleSearchData, isFetching: searchingArticles } = useQuery({
    queryKey: ['articles', 'notification-picker', articleQuery],
    queryFn: () => apiGet<{ data: Article[] }>('/articles', { search: articleQuery, status: 'PUBLISHED', limit: 6 }),
    enabled: articleSearchEnabled,
  });
  const articleResults = articleSearchEnabled ? (articleSearchData?.data ?? []) : [];

  const sendMutation = useMutation({
    mutationFn: (payload: FormValues) =>
      apiPost<{ data: { successCount: number; failureCount: number; message?: string } }>('/notifications/send', {
        ...payload,
        ...(linkedArticle ? { data: { articleId: linkedArticle.id } } : {}),
      }),
    onSuccess: (res) => {
      // The endpoint returns 200 even when nothing was actually delivered
      // (e.g. zero registered devices) — it's a valid, non-error outcome
      // from the backend's point of view, but showing a flat "sent
      // successfully" here was actively misleading: the toast said success
      // while the very next row in Sent Notifications showed FAILED. Read
      // the actual counts instead of trusting "the request didn't throw".
      const successCount = res?.data?.successCount ?? 0;
      if (successCount > 0) {
        toast.success(`Sent to ${successCount} device${successCount === 1 ? '' : 's'}${res.data.failureCount ? ` (${res.data.failureCount} failed)` : ''}`);
      } else {
        toast.error(res?.data?.message || 'No devices received this — 0 successful deliveries. Check Sent Notifications for the reason.');
      }
      reset();
      setLinkedArticle(null);
      setArticleQuery('');
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error: any) => {
      // Surface the backend's actual reason instead of a generic message —
      // NestJS validation errors come back as { message: string | string[] }.
      const backendMessage = error?.response?.data?.message;
      const detail = Array.isArray(backendMessage) ? backendMessage.join(', ') : backendMessage;
      toast.error(detail ? `Failed to send notification: ${detail}` : 'Failed to send notification');
    },
  });

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-5 items-start">

      {/* ── Compose Form (wider) ────────────────────────────────────── */}
      <div className="xl:col-span-3 card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red/10 flex items-center justify-center">
              <Bell size={16} className="text-red" />
            </div>
            <div>
              <h3 className="section-title">Compose Notification</h3>
              <p className="text-2xs text-text-muted mt-0.5">Send push to all users or a category</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit((v) => sendMutation.mutate(v))} className="card-body space-y-4">

          {/* Tamil + English title row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Title (Tamil)</label>
              <input {...register('titleTa')} className="input" placeholder="அறிவிப்பு தலைப்பு" />
              {errors.titleTa && <p className="mt-1.5 text-xs text-status-red">{errors.titleTa.message}</p>}
            </div>
            <div>
              <label className="label">Title (English)</label>
              <input {...register('titleEn')} className="input" placeholder="Notification title" />
              {errors.titleEn && <p className="mt-1.5 text-xs text-status-red">{errors.titleEn.message}</p>}
            </div>
          </div>

          {/* Tamil + English body row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Body (Tamil)</label>
              <textarea
                {...register('bodyTa')}
                rows={4}
                className="input resize-none"
                placeholder="அறிவிப்பு உடலை உள்ளிடுக..."
              />
              {errors.bodyTa && <p className="mt-1.5 text-xs text-status-red">{errors.bodyTa.message}</p>}
            </div>
            <div>
              <label className="label">Body (English)</label>
              <textarea
                {...register('bodyEn')}
                rows={4}
                className="input resize-none"
                placeholder="Notification body..."
              />
              {errors.bodyEn && <p className="mt-1.5 text-xs text-status-red">{errors.bodyEn.message}</p>}
            </div>
          </div>

          {/* Link to article — optional; when set, tapping the notification
              opens this story instead of the app's default screen. */}
          <div>
            <label className="label">Link to Article (optional)</label>
            {linkedArticle ? (
              <div className="flex items-center gap-3 p-2.5 rounded-lg border border-red/30 bg-red/5">
                <Newspaper size={15} className="text-red flex-shrink-0" />
                <span className="text-sm text-text-primary truncate flex-1">{linkedArticle.titleTa}</span>
                <button type="button" onClick={() => setLinkedArticle(null)} className="btn-ghost p-1 flex-shrink-0">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  value={articleQuery}
                  onChange={(e) => setArticleQuery(e.target.value)}
                  className="input"
                  placeholder="Search a published article by title..."
                />
                {articleQuery.trim().length > 1 && (
                  <div className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-surface shadow-lg max-h-56 overflow-y-auto">
                    {searchingArticles ? (
                      <div className="p-3 flex items-center justify-center">
                        <Loader2 size={14} className="animate-spin text-text-muted" />
                      </div>
                    ) : articleResults.length === 0 ? (
                      <p className="p-3 text-xs text-text-muted">No published articles match "{articleQuery}"</p>
                    ) : (
                      articleResults.map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => { setLinkedArticle(a); setArticleQuery(''); }}
                          className="w-full text-left px-3 py-2 hover:bg-page transition-colors border-b border-border last:border-b-0"
                        >
                          <p className="text-sm text-text-primary truncate">{a.titleTa}</p>
                          <p className="text-2xs text-text-muted truncate">{a.titleEn}</p>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
            <p className="text-2xs text-text-muted mt-1.5">Leave blank to open the app's default screen on tap.</p>
          </div>

          {/* Target */}
          <div>
            <label className="label">Target Audience</label>
            <div className="grid grid-cols-2 gap-2">
              <label className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer transition-all ${
                target === 'ALL' ? 'border-red bg-red/5 text-red' : 'border-border text-text-secondary hover:bg-page'
              }`}>
                <input {...register('target')} type="radio" value="ALL" className="hidden" />
                <Users size={15} />
                <span className="text-sm font-medium">All Users</span>
              </label>
              <label className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer transition-all ${
                target === 'CATEGORY' ? 'border-red bg-red/5 text-red' : 'border-border text-text-secondary hover:bg-page'
              }`}>
                <input {...register('target')} type="radio" value="CATEGORY" className="hidden" />
                <Tag size={15} />
                <span className="text-sm font-medium">By Category</span>
              </label>
            </div>
          </div>

          {target === 'CATEGORY' && (
            <div>
              <label className="label">Category</label>
              <select {...register('categoryId')} className="input">
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.nameTa} / {c.nameEn}</option>
                ))}
              </select>
              {errors.categoryId && <p className="mt-1.5 text-xs text-status-red">{errors.categoryId.message}</p>}
            </div>
          )}

          <button
            type="submit"
            disabled={sendMutation.isPending}
            className="btn-primary w-full justify-center"
          >
            {sendMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {sendMutation.isPending ? 'Sending...' : 'Send Now'}
          </button>
        </form>
      </div>

      {/* ── Sent History ────────────────────────────────────────────── */}
      <div className="xl:col-span-2 card flex flex-col min-h-[420px]">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <h3 className="section-title">Sent Notifications</h3>
            {notifications.length > 0 && (
              <span className="text-2xs font-semibold bg-page border border-border text-text-muted px-1.5 py-0.5 rounded">
                {notifications.length}
              </span>
            )}
          </div>
        </div>

        {notifLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 size={24} className="animate-spin text-red" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-10 text-center px-6">
            <div className="w-12 h-12 rounded-2xl bg-page border border-border flex items-center justify-center mb-3">
              <Bell size={20} className="text-text-muted" />
            </div>
            <p className="text-sm font-semibold text-text-secondary">No notifications sent yet</p>
            <p className="text-xs text-text-muted mt-1">Compose one on the left and hit Send</p>
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 divide-y divide-border">
            {notifications.map((n) => (
              <div key={n.id} className="px-4 py-3.5 hover:bg-page transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-text-primary truncate">{n.titleTa}</p>
                    <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{n.bodyTa}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-2xs text-text-muted bg-page border border-border px-1.5 py-0.5 rounded">
                        {n.target === 'ALL' ? 'All Users' : 'Category'}
                      </span>
                    </div>
                    {n.status === 'FAILED' && n.error && (
                      <p className="text-2xs text-status-red mt-1.5">{n.error}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`text-2xs px-2 py-0.5 rounded-full font-semibold ${
                      n.status === 'SENT' ? 'badge-green' : 'badge-yellow'
                    }`}>
                      {n.status}
                    </span>
                    <p className="text-2xs text-text-muted mt-1.5 whitespace-nowrap">
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
