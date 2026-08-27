// src/types/index.ts
// Mirrors backend/prisma/schema.prisma's Reporter / News / Reward models +
// the ReporterStatus / NewsStatus / NewsPriority enums.

import type { ReporterStatus, NewsStatus, NewsPriority } from '@/constants';

export interface ReporterProfile {
  id: string;
  userId: string;
  realName: string;
  penName: string;
  usePenName: boolean;
  trustScore: number;
  status: ReporterStatus;
  strikeCount: number;
  verifiedAt: string | null;
  createdAt: string;
  phone: string;
  taluk?: string;
  district?: string;
  pressIdNumber?: string;
  pressIdValidTill?: string;
  programStartedAt?: string;
}

export interface ReporterStats {
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
  totalPoints: number;
  unclaimedPoints: number;
  claimedPoints: number;
  weekPoints: number;
  rank?: number;
}

export interface ReporterNews {
  id: string;
  titleTa: string;
  bodyTa: string;
  status: NewsStatus;
  priority: NewsPriority;
  category?: string;
  location?: string;
  mediaUrls: string[];
  views?: number;
  shares?: number;
  points?: number;
  rejectionReason?: string;
  rejectionChecklist?: { label: string; done: boolean }[];
  submittedAt: string;
  reviewedAt?: string;
  reviewerName?: string;
}

export interface Reward {
  id: string;
  newsId: string;
  newsTitleTa: string;
  points: number;
  category: string;
  claimed: boolean;
  week: string;
  createdAt: string;
}
