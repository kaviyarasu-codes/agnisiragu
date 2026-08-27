// src/mocks/reporter.ts
// Placeholder data for Phase 1 (UI-only build) — exact values lifted from
// the design mockup so screens look identical to Agnisiragu Reporter.dc.html.
// Every screen imports from here instead of calling the API; swap for real
// react-query hooks once the backend Reporter module (Phase 2) exists.

import type { ReporterProfile, ReporterStats, ReporterNews, Reward } from '@/types';

export const MOCK_REPORTER: ReporterProfile = {
  id: 'mock-reporter-1',
  userId: 'mock-user-1',
  realName: 'கவியரசு முருகேசன்',
  penName: 'அக்னி கவி',
  usePenName: true,
  trustScore: 74,
  status: 'VERIFIED',
  strikeCount: 0,
  verifiedAt: '2026-07-20T00:00:00.000Z',
  createdAt: '2026-07-01T00:00:00.000Z',
  phone: '+91 98765 43210',
  taluk: 'மொப்பிரிபாளையம்',
  district: 'COIMBATORE',
  pressIdNumber: 'AGN-2026-0418',
  pressIdValidTill: '31 DEC 2026',
  programStartedAt: '2026-08-04T00:00:00.000Z', // day 22/30 as of "today" in the design
};

export const MOCK_STATS: ReporterStats = {
  approvedCount: 21,
  pendingCount: 3,
  rejectedCount: 2,
  totalPoints: 9840,
  unclaimedPoints: 1240,
  claimedPoints: 8600,
  weekPoints: 420,
  rank: 4,
};

export const MOCK_REPORTS: ReporterNews[] = [
  {
    id: 'r1',
    titleTa: 'மொப்பிரிபாளையத்தில் புதிய பேருந்து நிலையம் திறப்பு',
    bodyTa: '',
    status: 'APPROVED',
    priority: 'REGULAR',
    mediaUrls: [],
    views: 12400,
    shares: 318,
    points: 120,
    submittedAt: '2026-08-25T09:40:00.000Z',
  },
  {
    id: 'r2',
    titleTa: 'உள்ளூர் கிரிக்கெட் இறுதிப் போட்டியில் அக்னி அணி வெற்றி',
    bodyTa: '',
    status: 'PENDING',
    priority: 'REGULAR',
    mediaUrls: [],
    submittedAt: '2026-08-25T07:00:00.000Z',
  },
  {
    id: 'r3',
    titleTa: 'சந்தையில் காய்கறி விலை உயர்வு',
    bodyTa: '',
    status: 'REJECTED',
    priority: 'REGULAR',
    mediaUrls: [],
    rejectionReason: 'செய்தி நல்லா இருக்கு. ஆனா படம் மங்கலா இருக்கு — சந்தை பலகை தெரியுற மாதிரி ஒரு படம் அனுப்புங்க. விலை பட்டியலையும் சேர்த்தா இன்னும் நல்லா இருக்கும்.',
    rejectionChecklist: [
      { label: 'தெளிவான படம்', done: false },
      { label: 'விலை பட்டியல்', done: false },
    ],
    submittedAt: '2026-08-24T18:12:00.000Z',
    reviewerName: 'முருகன்',
    reviewedAt: '2026-08-24T19:30:00.000Z',
  },
  {
    id: 'r4',
    titleTa: 'மின்தடை அறிவிப்பு — மக்கள் கருத்து',
    bodyTa: '',
    status: 'PENDING',
    priority: 'BREAKING',
    mediaUrls: [],
    submittedAt: '2026-08-18T00:00:00.000Z',
  },
];

export const MOCK_REWARDS: Reward[] = [
  { id: 'w1', newsId: 'r1', newsTitleTa: 'பேருந்து நிலையம் திறப்பு', points: 120, category: 'approved · local', claimed: false, week: '34', createdAt: '2026-08-25T00:00:00.000Z' },
  { id: 'w2', newsId: 'r1', newsTitleTa: 'அதிக பார்வை ஊக்கம்', points: 200, category: 'bonus · 12.4k views', claimed: false, week: '34', createdAt: '2026-08-25T00:00:00.000Z' },
  { id: 'w3', newsId: 'r5', newsTitleTa: 'கிரிக்கெட் இறுதிப் போட்டி', points: 100, category: 'approved · sports', claimed: false, week: '34', createdAt: '2026-08-21T00:00:00.000Z' },
  { id: 'w4', newsId: 'r6', newsTitleTa: 'மின்தடை அறிவிப்பு', points: 250, category: 'claimed · week 33', claimed: true, week: '33', createdAt: '2026-08-14T00:00:00.000Z' },
];
