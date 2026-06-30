// src/hooks/useArticles.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch, apiDelete } from '../lib/api';
import type { Article, AdminAccount, PaginatedResponse, ArticleStatus } from '../types';

interface ArticleFilters {
  status?: ArticleStatus;
  categoryId?: string;
  search?: string;
  cursor?: string;
  limit?: number;
}

interface CreateArticlePayload {
  titleTa: string;
  titleEn: string;
  bodyTa: string;
  bodyEn: string;
  excerpt?: string;
  thumbnailUrl?: string;
  byline?: string;
  categoryId: string;
  status: ArticleStatus;
  isBreaking: boolean;
  scheduledAt?: string;
}

export function useAdminAccounts() {
  return useQuery({
    queryKey: ['admin-accounts'],
    queryFn: () => apiGet<{ data: AdminAccount[] }>('/admin/accounts'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useArticles(filters: ArticleFilters = {}) {
  return useQuery({
    queryKey: ['articles', filters],
    queryFn: () =>
      apiGet<PaginatedResponse<Article>>('/articles', filters as Record<string, unknown>),
  });
}

export function useArticle(id: string) {
  return useQuery({
    queryKey: ['articles', id],
    queryFn: () => apiGet<{ data: Article }>(`/articles/${id}`),
    enabled: !!id,
  });
}

export function useCreateArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateArticlePayload) =>
      apiPost<{ data: Article }>('/articles', payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });
}

export function useUpdateArticle(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<CreateArticlePayload>) =>
      apiPatch<{ data: Article }>(`/articles/${id}`, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });
}

export function usePublishArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiPatch<{ data: Article }>(`/articles/${id}/publish`, {}),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });
}

export function useUnpublishArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiPatch<{ data: Article }>(`/articles/${id}/unpublish`, {}),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });
}

export function useDeleteArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete<void>(`/articles/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });
}

export function useBulkAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (