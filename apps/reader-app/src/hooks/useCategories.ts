// src/hooks/useCategories.ts

import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import type { Category, PaginatedResponse } from '@/types';

export function useCategories() {
  return useQuery<Category[], Error>({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await get<PaginatedResponse<Category>>('/categories');
      return response.data.sort((a, b) => a.displayOrder - b.displayOrder);
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
