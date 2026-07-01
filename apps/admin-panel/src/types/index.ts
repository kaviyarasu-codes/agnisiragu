// src/types/index.ts

export type AdminRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  // Editor Team
  | 'EDITOR_MANAGER'
  | 'EDITOR_MEMBER'
  // News Verification Team
  | 'VERIFICATION_MANAGER'
  | 'VERIFICATION_MEMBER'
  // Reporter App Team
  | 'REPORTER_APP_MANAGER'
  | 'REPORTER_APP_MEMBER'
  // Reporters Management Team
  | 'REPORTERS_MANAGER'
  | 'REPORTERS_MEMBER'
  // Advertisement Department
  | 'ADVERTISEMENT_MANAGER'
  | 'LOCAL_ADS_MANAGER'
  | 'ADMOB_MANAGER';

export type TeamType =
  | 'SYSTEM'
  | 'EDITOR_TEAM'
  | 'VERIFICATION_TEAM'
  | 'REPORTER_APP_TEAM'
  | 'REPORTERS_MANAGEMENT_TEAM'
  | 'ADVERTISEMENT_TEAM'
  | 'LOCAL_ADS_TEAM'
  | 'ADMOB_TEAM';

export type ArticleStatus = 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'UNPUBLISHED' | 'DELETED';
export type Language = 'ta' | 'en';

export type AdType = 'IMAGE' | 'VIDEO' | 'BANNER' | 'CAROUSEL';
export type CtaType = 'WHATSAPP' | 'PHONE' | 'WEBSITE' | 'EMAIL' | 'MAPS' | 'FORM';
export type AdStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'EXPIRED';
export type AdPlacement = 'ADMOB' | 'LOCAL' | 'BOTH';

export interface Admin {
  id: string;
  email: string;
  name: string;
  phone?: string;
  adminRole: AdminRole;
  teamType?: TeamType | string;
  isActive?: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  nameTa: string;
  nameEn: string;
  slug: string;
  iconUrl?: string;
  isActive: boolean;
  displayOrder: number;
}

export interface AdminAccount {
  id: string;
  name: string;
  email: string;
  phone?: string;
  adminRole: string;
  teamType?: string;
  isActive?: boolean;
}

export interface Article {
  id: string;
  titleTa: string;
  titleEn: string;
  bodyTa: string;
  bodyEn: string;
  excerpt?: string;
  thumbnailUrl?: string;
  byline?: string;
  category: Category;
  admin: { id: string; name: string };
  status: ArticleStatus;
  isBreaking: boolean;
  scheduledAt?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  phone: string;
  name?: string;
  role: string;
  articleReadCount: number;
  isBanned: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  adminId?: string;
  adminName?: string;
  adminTeam?: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  device?: string;
  createdAt: string;
}

export interface Stats {
  totalArticles: number;
  publishedArticles: number;
  totalUsers: number;
  breakingCount: number;
  todayArticles: number;
  todayUsers: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    hasMore: boolean;
    page?: number;
  };
}

export interface ApiResponse<T> {
  data: T;
}

export interface MediaFile {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

export interface Notification {
  id: string;
  titleTa: string;
  bodyTa: string;
  titleEn: string;
  bodyEn: string;
  target: string;
  categoryId?: string;
  status: string;
  sentAt?: string;
  createdAt: string;
}

export interface SiteSettings {
  siteName: string;
  adMobAndroidAppId: string;
  adMobIosAppId: string;
  msg91SenderId: string;
  msg91AuthKey: string;
}

export interface LocalAd {
  id: string;
  title: string;
  description?: string;
  adType: AdType;
  mediaUrl?: string;
  carousel?: string[];
  startDate: string;
  endDate: string;
  categoryId?: string;
  targetAudience?: string;
  priority: number;
  status: AdStatus;
  ctaType: CtaType;
  ctaValue: string;
  placement: AdPlacement;
  clickCount: number;
  impressions: number;
  adminId: string;
  admin?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  id: string;
  name: string;
  nameTa?: string;
  type: string;
  description?: string;
  color: string;
  isActive: boolean;
  createdAt: string;
}
