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

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => apiGet<{ data: Category[] }>('/categories'),
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

export function useToggleCategoryActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiPatch<{ data: Category }>(`/categories/${id}`, { isActive }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useReorderCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, displayOrder }: { id: string; displayOrder: number }) =>
      apiPatch<{ data: Category }>(`/categories/${id}`, { displayOrder }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}
