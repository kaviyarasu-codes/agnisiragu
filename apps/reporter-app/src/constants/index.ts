// src/constants/index.ts
// Colors/tokens lifted directly from the design's .dc.html (Agnisiragu
// Reporter.dc.html) so screens match pixel-for-pixel: dark tool chrome
// (#1C1917) instead of the reader app's white chrome, same brand red.

// DEV: Replace YOUR_LAPTOP_IP with your laptop's hotspot IP (run `ipconfig` → Wireless LAN adapter → IPv4)
// PROD: same backend as the reader app — reporters are Users too (Reporter.userId → User)
export const API_BASE_URL = __DEV__
  ? 'http://10.65.105.253:3000/api/v1'   // ← replace with your laptop IP for local dev
  : 'https://agnisiragu-backend-production.up.railway.app/api/v1';

export const COLORS = {
  // Brand
  primary:      '#CC1F2D',
  primaryDark:  '#A8181F',

  // Backgrounds
  background:   '#F5F1EB',
  surface:      '#FFFFFF',
  dark:         '#1C1917',   // tool chrome — headers, splash, stat cards

  // Ink / Typography
  ink:          '#1C1917',
  inkSecondary: '#57534E',
  inkLight:     '#A8A29E',
  inkOnDark:    '#8a8480',

  // Borders
  border:       '#DDD8D0',
  borderLight:  '#EFEBE5',
  borderReject: '#F0D0D3',

  // Status
  success:      '#16A34A',
  successBg:    '#F0FAF2',
  pending:      '#B4820C',
  pendingBg:    '#FFF8E8',
  rejected:     '#CC1F2D',
  rejectedBg:   '#FDF4F4',
  gold:         '#E9B84A',
};

export const FONT_FAMILIES = {
  displayRegular:    'AnekTamil-Regular',
  displaySemiBold:   'AnekTamil-SemiBold',
  displayBold:       'AnekTamil-Bold',
  displayExtraBold:  'AnekTamil-ExtraBold',
  bodyRegular:       'NotoSansTamil-Regular',
  bodyMedium:        'NotoSansTamil-Medium',
  bodySemiBold:      'NotoSansTamil-SemiBold',
  uiRegular:         'Barlow-Regular',
  uiMedium:          'Barlow-Medium',
  uiSemiBold:        'Barlow-SemiBold',
  uiBold:            'Barlow-Bold',
  condensedSemiBold: 'BarlowCondensed-SemiBold',
  condensedBold:     'BarlowCondensed-Bold',
};

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'reporter_access_token',
  REFRESH_TOKEN: 'reporter_refresh_token',
  ONBOARDING_DONE: 'reporter_onboarding_done',
};

// Reporter.status enum — kept in sync with backend/prisma/schema.prisma
export type ReporterStatus = 'TEMPORARY' | 'VERIFIED' | 'SENIOR' | 'PRESS_ID';

// News.status enum for a reporter's own submissions
export type NewsStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

// News.priority enum
export type NewsPriority = 'BREAKING' | 'REGULAR' | 'LOW';

export const TALUKS = [
  'மொப்பிரிபாளையம்', 'கோயம்புத்தூர்', 'திருப்பூர்', 'ஈரோடு', 'பொள்ளாச்சி',
  'மேட்டுப்பாளையம்', 'சேலம்', 'ஓமலூர்',
];

export const CATEGORIES = [
  { id: 'politics', nameTa: 'அரசியல்' },
  { id: 'local', nameTa: 'உள்ளூர்' },
  { id: 'sports', nameTa: 'விளையாட்டு' },
  { id: 'business', nameTa: 'வணிகம்' },
  { id: 'weather', nameTa: 'வானிலை' },
];

export const EMERGENCY_TAGS = [
  { id: 'accident', nameTa: 'விபத்து' },
  { id: 'fire', nameTa: 'தீ' },
  { id: 'flood', nameTa: 'வெள்ளம்' },
  { id: 'blockade', nameTa: 'மறியல்' },
];

export const STRINGS = {
  APP_NAME_TA: 'அக்னிசிறகு',
  APP_NAME_EN: 'Agnisiragu',
  ROLE_TA: 'நிருபர்',
};
