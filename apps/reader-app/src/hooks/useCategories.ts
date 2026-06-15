// src/hooks/useCategories.ts

import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import type { Category } from '@/types';

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await get<{ data: Category[] }>('/categories');
      return res.data;
    },
    staleTime: 1000 * 60 * 10, // categories rarely change
  });
}
