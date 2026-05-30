// src/pages/ArticleListPage.tsx
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Loader2, Newspaper, Edit2, Trash2, CheckCircle, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import ArticleStatusBadge from '../components/ArticleStatusBadge';
import ConfirmModal from '../components/ConfirmModal';
import Pagination from '../components/Pagination';
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

  // Debounce search
  const handleSearchChange = useCallback((val: string) => {
    setSearch(val);
    clearTimeout(window.__searchTimeout);
    window.__searchTimeout = window.setTimeout(() => setDebouncedSearch(val), 400);
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
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search articles..."
              className="input-field pl-9"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ArticleStatus | '')}
            className="input-field w-auto"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input-field w-auto"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.nameTa}</option>
            ))}
          </select>
        </div>

        <button onClick={() => navigate('/articles/new')} className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          New Article
        </button>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
          <span className="text-sm font-medium text-primary">{selected.size} selected</span>
          <button
            onClick={() => handleBulkAction('publish')}
            className="text-sm text-green-700 hover:text-green-800 font-medium"
          >
            Publish All
          </button>
          <button
            onClick={() => handleBulkAction('delete')}
            className="text-sm text-accent hover:text-red-700 font-medium"
          >
            Delete All
          </button>
        </div>
      )}

      {/* Table */}
      <div className="card p-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 size={28} className="animate-spin text-primary" />
          </div>
        ) : articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <Newspaper size={40} className="mb-2" />
            <p className="text-sm">No articles found</p>
            <button onClick={() => navigate('/articles/new')} className="btn-primary mt-3 text-sm">
              Create your first article
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header w-10">
                    <input
                      type="checkbox"
                      checked={selected.size === articles.length && articles.length > 0}
                      onChange={toggleAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="table-header">Article</th>
                  <th className="table-header">Category</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Breaking</th>
                  <th className="table-header">Published</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody>
                {articles.map((article) => (
                  <tr key={article.id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-cell w-10">
                      <input
                        type="checkbox"
                        checked={selected.has(article.id)}
                        onChange={() => toggleSelect(article.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        {article.thumbnailUrl ? (
                          <img
                            src={article.thumbnailUrl}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <Newspaper size={16} className="text-gray-400" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-gray-800 truncate max-w-[200px]">{article.titleTa}</p>
                          <p className="text-xs text-gray-400 truncate max-w-[200px]">{article.titleEn}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full whitespace-nowrap">
                        {article.category.nameTa}
                      </span>
                    </td>
                    <td className="table-cell">
                      <ArticleStatusBadge status={article.status} />
                    </td>
                    <td className="table-cell">
                      {article.isBreaking ? (
                        <span className="text-xs bg-accent bg-opacity-10 text-accent font-medium px-2 py-0.5 rounded-full">
                          Breaking
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="table-cell text-gray-400 whitespace-nowrap text-xs">
                      {article.publishedAt ? format(new Date(article.publishedAt), 'dd MMM yyyy') : '—'}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => navigate(`/articles/${article.id}/edit`)}
                          className="p-1.5 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handlePublishToggle(article)}
                          className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title={article.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                        >
                          {article.status === 'PUBLISHED' ? <EyeOff size={15} /> : <CheckCircle size={15} />}
                        </button>
                        <button
                          onClick={() => setDeleteTarget(article.id)}
                          className="p-1.5 text-gray-400 hover:text-accent hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={15} />
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
