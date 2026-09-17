// src/lib/localAds.ts
// Client-side fetch for Local Ads (Admin Panel -> Local Ads) — the same
// self-hosted ad system the reader-app already uses (apps/reader-app/src
// /hooks/useLocalAds.ts). AdSlot.tsx calls this so the website's ad slots
// can show a Local Ad instead of falling straight to Google AdSense.
//
// Runs client-side (AdSlot is 'use client') rather than being fetched
// server-side in layout.tsx, since impression/click tracking needs a
// browser context anyway and multiple <AdSlot> instances on one page
// share a single in-memory cache below instead of each firing its own
// request.

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.agnisiragu.com/api/v1';

export interface LocalAd {
  id: string;
  title: string;
  description?: string | null;
  adType: 'IMAGE' | 'VIDEO' | 'BANNER' | 'CAROUSEL';
  mediaUrl?: string | null;
  carousel?: string[] | null;
  ctaType: 'WHATSAPP' | 'PHONE' | 'WEBSITE' | 'EMAIL' | 'MAPS' | 'FORM';
  ctaValue: string;
  placement: 'ADMOB' | 'LOCAL' | 'BOTH';
  priority: number;
}

export function resolveLocalAdUrl(ad: LocalAd): string {
  const v = ad.ctaValue?.trim() ?? '';
  switch (ad.ctaType) {
    case 'WHATSAPP': {
      const digits = v.replace(/\D/g, '');
      const withCountry = digits.length === 10 ? `91${digits}` : digits;
      return `https://wa.me/${withCountry}`;
    }
    case 'PHONE':
      return `tel:${v.replace(/\s/g, '')}`;
    case 'EMAIL':
      return `mailto:${v}`;
    case 'MAPS':
      return /^https?:\/\//i.test(v) ? v : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(v)}`;
    case 'WEBSITE':
    case 'FORM':
    default:
      return /^https?:\/\//i.test(v) ? v : `https://${v}`;
  }
}

const CTA_LABEL: Record<LocalAd['ctaType'], string> = {
  WHATSAPP: 'WhatsApp',
  PHONE: 'அழைக்க',
  WEBSITE: 'பார்வையிட',
  EMAIL: 'மின்னஞ்சல்',
  MAPS: 'வழி',
  FORM: 'திற',
};

export function localAdCtaLabel(ad: LocalAd): string {
  return CTA_LABEL[ad.ctaType] ?? CTA_LABEL.WEBSITE;
}

// ── Shared in-flight/cache so N ad slots on one page = 1 network request ──

let cache: { data: LocalAd[]; ts: number } | null = null;
let inflight: Promise<LocalAd[]> | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function fetchLocalAds(): Promise<LocalAd[]> {
  if (cache && Date.now() - cache.ts < CACHE_TTL_MS) return cache.data;
  if (inflight) return inflight;

  inflight = fetch(`${API_URL}/local-ads/active?placement=LOCAL`)
    .then((res) => (res.ok ? res.json() : { data: [] }))
    .then((json: { data: LocalAd[] }) => json.data ?? [])
    .catch(() => [] as LocalAd[])
    .finally(() => {
      inflight = null;
    });

  const data = await inflight;
  cache = { data, ts: Date.now() };
  return data;
}

// A page-lifetime counter so sibling <AdSlot> instances rotate through
// different ads instead of every slot showing the same top-priority one.
let rotationCounter = 0;
export function nextRotationIndex(): number {
  return rotationCounter++;
}

export function trackLocalAdImpression(id: string) {
  fetch(`${API_URL}/local-ads/${id}/impression`, { method: 'POST' }).catch(() => {});
}

export function trackLocalAdClick(id: string) {
  fetch(`${API_URL}/local-ads/${id}/click`, { method: 'POST' }).catch(() => {});
}
