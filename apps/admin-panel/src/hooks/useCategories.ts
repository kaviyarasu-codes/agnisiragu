// src/hooks/useCategories.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch, apiDelete } from '../lib/api';
import type { Category } from '../types';

interface CategoryPayload {
  nameTa: string;
  nameEn: string;
  slug: string;
  iconUrl?: string;
  isActive?: boolean;
  displayOrder?: number;
}

// ── Public: active categories only (for article form dropdowns) ──────────────
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => apiGet<{ data: Category[] }>('/categories'),
  });
}

// ── Admin: ALL categories including inactive (for category manager) ───────────
export function useAdminCategories() {
  return useQuery({
    queryKey: ['categories', 'admin'],
    queryFn: () => apiGet<{ data: Category[] }>('/categories/admin/all'),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CategoryPayload) =>
      apiPost<{ data: Category }>('/categories', payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useUpdateCategory(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<CategoryPayload>) =>
      apiPatch<{ data: Category }>(`/categories/${id}`, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete<void>(`/categories/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

// Toggle uses dedicated /toggle endpoint — never duplicates or deletes
export function useToggleCategoryActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiPatch<{ data: Category }>(`/categories/${id}/toggle`, {}),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

// Reorder uses dedicated /reorder endpoint — atomic swap, no duplicate orders
export function useReorderCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, direction }: { id: string; direction: 'up' | 'down' }) =>
      apiPatch<{ data: unknown }>(`/categories/${id}/reorder`, { direction }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}
