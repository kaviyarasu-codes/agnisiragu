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
  // True once thumbnailUrl's file already has the brand logo baked into its
  // pixels (see admin-panel/src/lib/media.ts withBakedWatermark). Every
  // feed card / hero that overlays its own ImageWatermark chip must gate on
  // `!thumbnailWatermarked`, or a baked image shows the logo twice. This
  // field was missing from the app's Article type entirely, which is why
  // every reader-app card below draws the overlay unconditionally.
  thumbnailWatermarked?: boolean;
  mediaUrls?: string[];
  byline?: string;
  admin?: { id: string; name: string; avatarUrl?: string | null } | null;
  category: Category;
  isBreaking: boolean;
  cardStyle?: 'STANDARD' | 'FULL_BLEED' | 'NEWSPRINT';
  publishedAt: string;
  createdAt: string;
  likeCount?: number;
  dislikeCount?: number;
  commentCount?: number;
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
