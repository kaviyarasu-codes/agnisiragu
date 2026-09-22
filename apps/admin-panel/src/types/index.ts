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
  avatarUrl?: string | null;
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

// Minimal roster entry from GET /admin/directory — id/name/role only, no
// email/phone/etc. Used by the byline picker, which any admin can call
// (unlike AdminAccount's full record, which is SUPER_ADMIN-only).
export interface AdminDirectoryEntry {
  id: string;
  name: string;
  adminRole: string;
}

export interface Article {
  id: string;
  titleTa: string;
  titleEn: string;
  bodyTa: string;
  bodyEn: string;
  excerpt?: string;
  thumbnailUrl?: string;
  mediaUrls?: string[];
  byline?: string;
  category: Category;
  admin: { id: string; name: string };
  status: ArticleStatus;
  isBreaking: boolean;
  isFeatured?: boolean;
  featuredOrder?: number;
  thumbnailWatermarked?: boolean;
  cardStyle?: 'STANDARD' | 'FULL_BLEED' | 'NEWSPRINT';
  likeCount?: number;
  dislikeCount?: number;
  commentCount?: number;
  viewCount?: number;
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
  successCount?: number;
  failureCount?: number;
  error?: string;
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

export type TaskStatus = 'NEW' | 'IN_PROGRESS' | 'DONE';

export interface TaskPerson {
  id: string;
  name: string;
  avatarUrl?: string | null;
  adminRole?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  assignedTo: TaskPerson;
  assignedBy: TaskPerson;
  dueDate?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Roster entry for the "Assign Task" picker — who the current admin is
// allowed to hand a task to (empty for anyone without assignment rights).
export interface AssignableAdmin {
  id: string;
  name: string;
  adminRole: string;
  teamType?: string | null;
}

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TicketStatusValue = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';

export interface Ticket {
  id: string;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatusValue;
  attachmentUrls: string[];
  resolutionNote?: string | null;
  raisedBy: TaskPerson;
  resolvedBy?: TaskPerson | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Workforce (HR): attendance, hours, payment, access grants ─────────────
// See backend/src/hr — a per-admin SUPER_ADMIN-only-by-default module that
// can be selectively opened up to an ADMIN or team *_MANAGER.

export interface MyHrAccess {
  isSuperAdmin: boolean;
  canView: boolean;
  canEdit: boolean;
}

export interface WorkforcePerson {
  id: string;
  name: string;
  email: string;
  adminRole: string;
  teamType?: string | null;
  avatarUrl?: string | null;
  isActive: boolean;
}

export interface DailyAttendanceEntry extends WorkforcePerson {
  date: string;
  present: boolean;
  activeMinutes: number;
  firstSeenAt?: string | null;
  lastSeenAt?: string | null;
}

export interface MonthlyAttendanceEntry extends WorkforcePerson {
  month: number;
  year: number;
  daysInMonth: number;
  daysPresent: number;
  totalHours: number;
  avgHoursPerPresentDay: number;
  attendanceRate: number;
}

export interface MemberAttendanceDetail {
  admin: { id: string; name: string; adminRole: string; teamType?: string | null; avatarUrl?: string | null };
  month: number;
  year: number;
  days: { date: string; activeMinutes: number; hours: number; firstSeenAt?: string | null; lastSeenAt?: string | null }[];
}

export type SalaryStatusValue = 'PENDING' | 'PAID';

export interface SalaryEntry extends WorkforcePerson {
  month: number;
  year: number;
  recordId: string | null;
  amount: number;
  status: SalaryStatusValue;
  paidAt?: string | null;
  notes?: string | null;
}

export interface AccessGrantEntry extends WorkforcePerson {
  canView: boolean;
  canEdit: boolean;
  grantedAt?: string | null;
}

// Org-wide recurring costs (domain/server renewals etc.) — see
// backend RecurringExpense model. Not tied to a person, unlike salary.
export type ExpenseTypeValue = 'DOMAIN' | 'SERVER' | 'OTHER';

export interface RecurringExpense {
  id: string;
  name: string;
  type: ExpenseTypeValue;
  provider?: string | null;
  amount: number;
  renewalDate: string;
  status: SalaryStatusValue;
  notes?: string | null;
  recordedById?: string | null;
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
