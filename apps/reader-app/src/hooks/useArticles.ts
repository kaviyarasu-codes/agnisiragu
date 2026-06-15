// src/hooks/useArticles.ts

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import type { Article } from '@/types';

interface ArticlePage {
  data: Article[];
  meta: { hasMore: boolean; nextCursor: string | null };
}

// ─── Paginated articles feed ──────────────────────────────────────────────────

export function useArticles(categoryId?: string) {
  return useInfiniteQuery<ArticlePage>({
    queryKey: ['articles', categoryId ?? 'all'],
    queryFn: async ({ pageParam }) => {
      const params: Record<string, unknown> = { limit: 20 };
      if (categoryId) params.categoryId = categoryId;
      if (pageParam) params.cursor = pageParam as string;
      return get<ArticlePage>('/news', params);
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasMore ? lastPage.meta.nextCursor : undefined,
    staleTime: 1000 * 60 * 2,
  });
}

// ─── Breaking news ────────────────────────────────────────────────────────────

export function useBreakingNews() {
  return useQuery<Article[]>({
    queryKey: ['breaking-news'],
    queryFn: async () => {
      const res = await get<{ data: Article[] }>('/news/breaking');
      return res.data;
    },
    staleTime: 1000 * 60 * 1,
  });
}

// ─── Single article ───────────────────────────────────────────────────────────

export function useArticle(id: string) {
  return useQuery<Article>({
    queryKey: ['article', id],
    queryFn: async () => {
      const res = await get<{ data: Article }>(`/news/${id}`);
      return res.data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

// ─── Related articles (same category, exclude current) ───────────────────────

export function useRelatedArticles(categoryId: string, excludeId: string) {
  return useQuery<Article[]>({
    queryKey: ['related', categoryId, excludeId],
    queryFn: async () => {
      const res = await get<ArticlePage>('/news', { categoryId, limit: 5 });
      return res.data.filter((a) => a.id !== excludeId).slice(0, 4);
    },
    enabled: !!categoryId && !!excludeId,
    staleTime: 1000 * 60 * 5,
  });
}

// ─── Search ───────────────────────────────────────────────────────────────────

export function useSearch(query: string, categoryId?: string) {
  return useQuery<Article[]>({
    queryKey: ['search', query, categoryId],
    queryFn: async () => {
      const params: Record<string, unknown> = { q: query, limit: 20 };
      if (categoryId) params.categoryId = categoryId;
      const res = await get<{ data: Article[] }>('/news/search', params);
      return res.data;
    },
    enabled: query.length > 1,
    staleTime: 1000 * 30,
  });
}
