// src/hooks/useStats.ts
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../lib/api';
import type { Stats } from '../types';

export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: () => apiGet<{ data: Stats }>('/admin/stats'),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
