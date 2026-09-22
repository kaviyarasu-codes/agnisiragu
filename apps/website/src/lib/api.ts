// src/lib/api.ts
// Thin fetch wrapper against the same backend the reader-app and admin
// panel use (see backend/src/news, backend/src/categories) — this site is
// read-only and hits only the public, unauthenticated endpoints.

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.agnisiragu.com/api/v1';

export interface Category {
  id: string;
  nameTa: string;
  nameEn: string;
  slug: string;
  iconUrl?: string | null;
  isActive: boolean;
  displayOrder: number;
}

export interface Article {
  id: string;
  titleTa: string;
  titleEn: string;
  bodyTa: string;
  bodyEn: string;
  excerpt?: string | null;
  thumbnailUrl?: string | null;
  mediaUrls: string[];
  byline?: string | null;
  admin?: { id: string; name: string; avatarUrl?: string | null } | null;
  categoryId: string;
  category: Category;
  isBreaking: boolean;
  publishedAt: string | null;
  likeCount: number;
  dislikeCount: number;
  commentCount: number;
  viewCount?: number;
}

interface ListResponse<T> {
  data: T[];
  meta?: { hasMore: boolean; nextCursor: string | null; count?: number };
}

export interface WebsiteAdsConfig {
  enabled: boolean;
  adsensePublisherId: string;
  leaderboardSlotId: string;
  rectangleSlotId: string;
  infeedSlotId: string;
  inFeedFrequency: number;
  // Local Ads (self-hosted, Admin Panel -> Local Ads) shown alongside
  // AdSense — see AdSlot.tsx for the fallback order.
  localAdsEnable: boolean;
}

export interface WebsiteGeneralConfig {
  siteTitleTa: string;
  siteTitleEn: string;
  metaDescription: string;
  contactEmail: string;
  socialFacebook: string;
  socialInstagram: string;
  socialTwitter: string;
  socialYoutube: string;
  homepageSectionCount: number;
}

const DEFAULT_WEBSITE_ADS: WebsiteAdsConfig = {
  enabled: false,
  adsensePublisherId: '',
  leaderboardSlotId: '',
  rectangleSlotId: '',
  infeedSlotId: '',
  inFeedFrequency: 6,
  localAdsEnable: true,
};

const DEFAULT_WEBSITE_CONFIG: WebsiteGeneralConfig = {
  siteTitleTa: 'அக்னிசிறகு',
  siteTitleEn: 'Agnisiragu',
  metaDescription: 'Latest Tamil news — politics, cinema, sports, local and more. Managed with precision.',
  contactEmail: 'agni360tn@gmail.com',
  socialFacebook: '',
  socialInstagram: '',
  socialTwitter: '',
  socialYoutube: '',
  homepageSectionCount: 5,
};

// Admin-controlled site settings, from the same /config endpoint the
// reader-app polls on launch (backend/src/admin/config.controller.ts) —
// this is the only public, unauthenticated read of App Config. Falls back
// to sane defaults so the site still renders correctly if the backend is
// briefly unreachable or an admin hasn't touched these sections yet.
export async function getSiteConfig(): Promise<{ ads: WebsiteAdsConfig; site: WebsiteGeneralConfig }> {
  try {
    const { data } = await apiGet<{ data: { websiteAds?: Partial<WebsiteAdsConfig>; websiteConfig?: Partial<WebsiteGeneralConfig> } }>('/config');
    return {
      ads: { ...DEFAULT_WEBSITE_ADS, ...data.websiteAds },
      site: { ...DEFAULT_WEBSITE_CONFIG, ...data.websiteConfig },
    };
  } catch {
    return { ads: DEFAULT_WEBSITE_ADS, site: DEFAULT_WEBSITE_CONFIG };
  }
}

// Revalidate every 60s (ISR) — fresh enough for a news homepage without
// hitting the backend on every single request.
const REVALIDATE_SECONDS = 60;

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (!res.ok) {
    throw new Error(`API ${path} failed: ${res.status}`);
  }
  return res.json();
}

export function getCategories(): Promise<ListResponse<Category>> {
  return apiGet<ListResponse<Category>>('/categories');
}

export function getArticles(categoryId?: string): Promise<ListResponse<Article>> {
  const qs = categoryId ? `?categoryId=${encodeURIComponent(categoryId)}` : '';
  return apiGet<ListResponse<Article>>(`/news${qs}`);
}

export function getBreakingNews(): Promise<{ data: Article[] }> {
  return apiGet<{ data: Article[] }>('/news/breaking');
}

// Up to 3 articles for the homepage hero (lead story + 2 side stories) —
// admin-curated via the "Feature on Website Homepage" toggle in the article
// editor, auto-filled with the newest published articles when fewer than 3
// are featured. See NewsService.homepagePicks.
export function getHomepagePicks(): Promise<{ data: Article[] }> {
  return apiGet<{ data: Article[] }>('/news/homepage-picks');
}

export async function getArticle(id: string): Promise<{ data: Article } | null> {
  try {
    return await apiGet<{ data: Article }>(`/news/${id}`);
  } catch {
    return null;
  }
}

// Used on the article page for the "related news" grid and prev/next
// navigation — there's no dedicated related-articles endpoint yet, so we
// just pull the current category's list and slice around the current id.
export async function getCategoryArticles(categoryId: string): Promise<Article[]> {
  try {
    const { data } = await getArticles(categoryId);
    return data;
  } catch {
    return [];
  }
}

// ─── Search (client-side — /search is interactive, not ISR-cached) ─────────
// Backed by GET /news/search: `q` matches titleTa/titleEn/bodyTa/bodyEn
// directly plus a precomputed Thanglish/phonetic blob (searchText), so one
// query box covers Tamil, English and Thanglish-typed-Tamil without any
// language switch in the UI. See backend/src/common/utils/tamil-transliterate.ts.
export interface SearchParams {
  q?: string;
  categoryId?: string;
  byline?: string;
  dateFrom?: string;
  dateTo?: string;
  cursor?: string;
  limit?: number;
}

export async function searchArticles(params: SearchParams): Promise<ListResponse<Article>> {
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', params.q);
  if (params.categoryId) qs.set('categoryId', params.categoryId);
  if (params.byline) qs.set('byline', params.byline);
  if (params.dateFrom) qs.set('dateFrom', params.dateFrom);
  if (params.dateTo) qs.set('dateTo', params.dateTo);
  if (params.cursor) qs.set('cursor', params.cursor);
  qs.set('limit', String(params.limit ?? 20));

  const res = await fetch(`${API_URL}/news/search?${qs.toString()}`);
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  return res.json();
}

// Distinct reporter/byline names for the search page's reporter dropdown.
export async function getAuthors(): Promise<{ data: string[] }> {
  try {
    return await apiGet<{ data: string[] }>('/news/authors');
  } catch {
    return { data: [] };
  }
}
