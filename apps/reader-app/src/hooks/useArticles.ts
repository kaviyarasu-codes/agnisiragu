// src/hooks/useArticles.ts

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import type { Article, PaginatedResponse } from '@/types';

export function useArticles(categoryId?: string) {
  return useInfiniteQuery<PaginatedResponse<Article>, Error>({
    queryKey: ['articles', categoryId],
    queryFn: async ({ pageParam }) => {
      const params: Record<string, unknown> = { limit: 20 };
      if (categoryId) params.categoryId = categoryId;
      if (pageParam) params.cursor = pageParam as string;
      return get<PaginatedResponse<Article>>('/news', params);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasMore ? lastPage.meta.nextCursor : undefined,
  });
}

export function useBreakingNews() {
  return useQuery<Article[], Error>({
    queryKey: ['breaking-news'],
    queryFn: async () => {
      const response = await get<PaginatedResponse<Article>>('/news/breaking');
      return response.data;
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useArticle(id: string) {
  return useQuery<Article, Error>({
    queryKey: ['article', id],
    queryFn: async () => {
      const response = await get<{ data: Article }>('/news/' + id);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useSearch(query: string, categoryId?: string) {
  return useQuery<Article[], Error>({
    queryKey: ['search', query, categoryId],
    queryFn: async () => {
      const params: Record<string, unknown> = { q: query };
      if (categoryId) params.categoryId = categoryId;
      const response = await get<PaginatedResponse<Article>>('/news/search', params);
      return response.data;
    },
    enabled: query.trim().length > 1,
    staleTime: 1000 * 60,
  });
}

export function useRelatedArticles(categoryId: string, excludeId: string) {
  return useQuery<Article[], Error>({
    queryKey: ['related-articles', categoryId, excludeId],
    queryFn: async () => {
      const response = await get<PaginatedResponse<Article>>('/news', {
        categoryId,
        limit: 3,
      });
      return response.data.filter((a) => a.id !== excludeId);
    },
    enabled: !!categoryId,
  });
}
