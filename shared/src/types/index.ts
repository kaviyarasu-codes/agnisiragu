// agnisiragu/shared/src/types/index.ts
// Shared TypeScript types used across backend, mobile apps and admin panel.

export type Role = 'READER' | 'REPORTER' | 'ADMIN';

export type ReporterStatus = 'TEMPORARY' | 'VERIFIED' | 'SENIOR' | 'PRESS_ID';

export type NewsStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type NewsPriority = 'BREAKING' | 'REGULAR' | 'LOW';

export type NewsCategory =
  | 'POLITICS'
  | 'SPORTS'
  | 'CINEMA'
  | 'CRIME'
  | 'TECHNOLOGY'
  | 'BUSINESS'
  | 'LOCAL'
  | 'INTERNATIONAL'
  | 'ENTERTAINMENT';

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: Role;
  createdAt: string;
}

export interface Reporter {
  id: string;
  userId: string;
  penName: string;
  usePenName: boolean;
  trustScore: number;
  status: ReporterStatus;
  strikeCount: number;
  verifiedAt?: string;
}

export interface News {
  id: string;
  title: string;
  body: string;
  mediaUrl?: string;
  audioUrl?: string;
  category: NewsCategory;
  reporterId: string;
  status: NewsStatus;
  priority: NewsPriority;
  location?: string;
  publishedAt?: string;
  createdAt: string;
}

export interface Reward {
  id: string;
  reporterId: string;
  newsId: string;
  points: number;
  category: NewsCategory;
  claimed: boolean;
  week: string;
}

// Category-based reward points (Phase 2 reward engine).
export const REWARD_POINTS: Record<string, number> = {
  BREAKING: 50,
  EXCLUSIVE: 45,
  POLITICS: 30,
  LOCAL: 25,
  SPORTS: 20,
  ENTERTAINMENT: 10,
};
