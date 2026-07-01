// src/pages/ArticleListPage.tsx
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Loader2, Newspaper, Edit2, Trash2, CheckCircle, EyeOff, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import ArticleStatusBadge from '../components/ArticleStatusBadge';
import ConfirmModal from '../components/ConfirmModal';
import Pagination from '../components/Pagination';
import EmptyState from '../components/EmptyState';
import { useArticles, useDeleteArticle, usePublishArticle, useUnpublishArticle, useBulkAction } from '../hooks/useArticles';
import { useCategories } from '../hooks/useCategories';
import type { ArticleStatus, Article } from '../types';

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'REVIEW', label: 'Review' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'UNPUBLISHED', label: 'Unpublished' },
];

export default function ArticleListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ArticleStatus | ''>('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [cursor, setCursor] = useState<string | undefined>();
  const [cursorStack, setCursorStack] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const handleSearchChange = useCallback((val: string) => {
    setSearch(val);
    clearTimeout(window.__searchTimeout);
    window.__searchTimeout = window.setTimeout(() => {
      setDebouncedSearch(val);
      setCursor(undefined);
    }, 400);
  }, []);

  const { data, isLoading } = useArticles({
    search: debouncedSearch || undefined,
    status: statusFilter || undefined,
    categoryId: categoryFilter || undefined,
    cursor,
    limit: 20,
  });

  const { data: catData } = useCategories();
  const categories = catData?.data ?? [];
  const articles = data?.data ?? [];
  const meta = data?.meta;

  const deleteMutation = useDeleteArticle();
  const publishMutation = usePublishArticle();
  const unpublishMutation = useUnpublishArticle();
  const bulkMutation = useBulkAction();

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget);
      toast.success('Article deleted');
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete article');
    }
  };

  const handlePublishToggle = async (article: Article) => {
    try {
      if (article.status === 'PUBLISHED') {
        await unpublishMutation.mutateAsync(article.id);
        toast.success('Article unpublished');
      } else {
        await publishMutation.mutateAsync(article.id);
        toast.success('Article published');
      }
    } catch {
      toast.error('Action failed');
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === articles.length) setSelected(new Set());
    else setSelected(new Set(articles.map((a) => a.id)));
  };

  const handleBulkAction = async (action: 'publish' | 'delete') => {
    try {
      await bulkMutation.mutateAsync({ ids: Array.from(selected), action });
      toast.success(`Bulk ${action} complete`);
      setSelected(new Set());
    } catch {
      toast.error(`Bulk ${action} failed`);
    }
  };

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
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search articles..."
            className="input pl-9"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as ArticleStatus | ''); setCursor(undefined); }}
          className="input w-auto"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setCursor(undefined); }}
          className="input w-auto"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.nameTa}</option>
          ))}
        </select>

        <div className="ml-auto">
          <button onClick={() => navigate('/articles/new')} className="btn-primary">
            <Plus size={15} />
            New Article
          </button>
        </div>
      </div>

      {/* ── Bulk action bar ───────────────────────────────────────────── */}
      {selected.size > 0 && (
        <div className="flex items-center gap-4 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5">
          <span className="text-sm font-semibold text-blue-700">{selected.size} selected</span>
          <div className="w-px h-4 bg-blue-200" />
          <button
            onClick={() => handleBulkAction('publish')}
            className="text-sm text-status-green hover:text-green-800 font-medium transition-colors"
          >
            Publish All
          </button>
          <button
            onClick={() => handleBulkAction('delete')}
            className="text-sm text-status-red hover:text-red-800 font-medium transition-colors"
          >
            Delete All
          </button>
        </div>
      )}

      {/* ── Table ────────────────────────────────────────────────────── */}
      <div className="card p-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-red" />
          </div>
        ) : articles.length === 0 ? (
          <EmptyState
            icon={Newspaper}
            title="No articles found"
            description={debouncedSearch || statusFilter || categoryFilter ? 'Try adjusting your filters' : 'Create your first article to get started'}
            action={
              !debouncedSearch && !statusFilter && !categoryFilter ? (
                <button onClick={() => navigate('/articles/new')} className="btn-primary text-sm">
                  <Plus size={14} /> Create Article
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="th w-10">
                    <input
                      type="checkbox"
                      checked={selected.size === articles.length && articles.length > 0}
                      onChange={toggleAll}
                      className="rounded border-border"
                    />
                  </th>
                  <th className="th">Article</th>
                  <th className="th">Category</th>
                  <th className="th">Status</th>
                  <th className="th">Breaking</th>
                  <th className="th">Published</th>
                  <th className="th text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {articles.map((article) => (
                  <tr key={article.id} className="tr-hover cursor-pointer" onClick={() => navigate(`/articles/${article.id}/edit`)}>
                    <td className="td w-10" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.has(article.id)}
                        onChange={() => toggleSelect(article.id)}
                        className="rounded border-border"
                      />
                    </td>
                    <td className="td">
                      <div className="flex items-center gap-3">
                        {article.thumbnailUrl ? (
                          <img
                            src={article.thumbnailUrl}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-border"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-page border border-border flex items-center justify-center flex-shrink-0">
                            <Newspaper size={16} className="text-text-muted" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-text-primary truncate max-w-[220px] text-sm">{article.titleTa}</p>
                          <p className="text-2xs text-text-muted truncate max-w-[220px] mt-0.5">{article.titleEn}</p>
                        </div>
                      </div>
                    </td>
                    <td className="td">
                      <span className="badge badge-gray">{article.category?.nameTa}</span>
                    </td>
                    <td className="td">
                      <ArticleStatusBadge status={article.status} />
                    </td>
                    <td className="td">
                      {article.isBreaking ? (
                        <span className="badge bg-red/10 text-red flex items-center gap-1 w-fit">
                          <Zap size={10} /> Breaking
                        </span>
                      ) : (
                        <span className="text-text-muted text-xs">—</span>
                      )}
                    </td>
                    <td className="td text-text-muted text-xs whitespace-nowrap">
                      {article.publishedAt ? format(new Date(article.publishedAt), 'dd MMM yyyy') : '—'}
                    </td>
                    <td className="td" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => navigate(`/articles/${article.id}/edit`)}
                          className="p-1.5 text-text-muted hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handlePublishToggle(article)}
                          className="p-1.5 text-text-muted hover:text-status-green hover:bg-status-green-bg rounded-lg transition-colors"
                          title={article.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                        >
                          {article.status === 'PUBLISHED' ? <EyeOff size={14} /> : <CheckCircle size={14} />}
                        </button>
                        <button
                          onClick={() => setDeleteTarget(article.id)}
                          className="p-1.5 text-text-muted hover:text-status-red hover:bg-status-red-bg rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
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
          showing={articles.length}
          hasMore={meta?.hasMore ?? false}
          hasPrev={cursorStack.length > 0}
          onNext={handleNext}
          onPrev={handlePrev}
        />
      </div>

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Article"
        message="Are you sure you want to delete this article? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

declare global {
  interface Window {
    __searchTimeout: ReturnType<typeof setTimeout>;
  }
}
