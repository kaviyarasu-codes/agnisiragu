// src/types/index.ts

export type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR';
export type ArticleStatus = 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'UNPUBLISHED' | 'DELETED';
export type Language = 'ta' | 'en';

export interface Admin {
  id: string;
  email: string;
  name: string;
  adminRole: AdminRole;
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

export interface Article {
  id: string;
  titleTa: string;
  titleEn: string;
  bodyTa: string;
  bodyEn: string;
  excerpt?: string;
  thumbnailUrl?: string;
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
  adminId: string;
  adminName?: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  ip?: string;
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
    nextCursor?: string;
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
