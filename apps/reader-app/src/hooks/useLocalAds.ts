// src/hooks/useLocalAds.ts
// Fetches active Local Ads created in Admin Panel → Local Ads.
// Backend already filters by status=ACTIVE + date range server-side.

import { useQuery } from '@tanstack/react-query';
import { get, post } from '@/lib/api';

export interface LocalAd {
  id: string;
  title: string;
  description?: string;
  adType: 'IMAGE' | 'VIDEO' | 'BANNER' | 'CAROUSEL';
  mediaUrl?: string;
  carousel?: string[];
  ctaType: 'WHATSAPP' | 'PHONE' | 'WEBSITE' | 'EMAIL' | 'MAPS' | 'FORM';
  ctaValue: string;
  placement: 'ADMOB' | 'LOCAL' | 'BOTH';
  priority: number;
}

export function useLocalAds() {
  return useQuery<LocalAd[]>({
    queryKey: ['local-ads', 'active'],
    queryFn: async () => {
      // 'LOCAL' pulls ads placed as LOCAL or BOTH — the pool we can actually
      // render ourselves (no AdMob SDK wired into the app yet).
      const res = await get<{ data: LocalAd[] }>('/local-ads/active', { placement: 'LOCAL' });
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

export function trackLocalAdImpression(id: string) {
  post(`/local-ads/${id}/impression`).catch(() => {});
}

export function trackLocalAdClick(id: string) {
  post(`/local-ads/${id}/click`).catch(() => {});
}
