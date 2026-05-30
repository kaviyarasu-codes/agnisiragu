// src/types/index.ts

export interface User {
  id: string;
  phone: string;
  name?: string;
  role: 'READER' | 'ADMIN';
  articleReadCount: number;
  preferredLang: 'ta' | 'en';
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
  isBreaking: boolean;
  publishedAt: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    hasMore: boolean;
    nextCursor?: string;
    total: number;
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface OtpSendResponse {
  message: string;
  expiresIn: number;
}

export interface OtpVerifyResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface UserPrefs {
  language: 'ta' | 'en';
  notificationCategories: string[];
}

export type Language = 'ta' | 'en';
