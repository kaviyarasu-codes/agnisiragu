// src/constants/index.ts

// DEV: Replace YOUR_LAPTOP_IP with your laptop's hotspot IP (run `ipconfig` → Wireless LAN adapter → IPv4)
// Example: 'http://192.168.137.1:3000/api/v1'
// PROD: 'https://api.agnisiragu.com/api/v1'
export const API_BASE_URL = __DEV__
  ? 'http://10.65.105.253:3000/api/v1'   // ← replace with your laptop IP for local dev
  : 'https://agnisiragu-backend-production.up.railway.app/api/v1';

// Fallback used only if the remote config hasn't loaded yet.
// Actual gating now follows remoteConfig.loginGate (see app.store.ts) —
// when the admin disables Login Gate, this is bypassed entirely (Infinity).
export const FREE_ARTICLE_LIMIT = 10;

export const COLORS = {
  // Brand
  primary:       '#CC1F2D',   // Agnisiragu red
  primaryDark:   '#A8181F',

  // Backgrounds — warm newsprint feel
  background:    '#F5F1EB',
  surface:       '#FFFFFF',
  surfaceWarm:   '#EDE9E3',

  // Ink / Typography
  ink:           '#1C1917',   // deep ink (headlines)
  inkSecondary:  '#57534E',   // body text
  inkLight:      '#A8A29E',   // timestamps, muted

  // Borders
  border:        '#DDD8D0',
  borderStrong:  '#C5BFB8',

  // Status
  accent:        '#CC1F2D',
  success:       '#16A34A',
  warning:       '#D97706',

  // Legacy aliases (keep so existing screens don't break)
  text:          '#1C1917',
  textSecondary: '#57534E',

  // Category strip colors (left border on cards)
  catColors: {
    politics:      '#2563EB',
    sports:        '#16A34A',
    entertainment: '#7C3AED',
    business:      '#D97706',
    technology:    '#0891B2',
    health:        '#DC2626',
    default:       '#CC1F2D',
  },
};

export const FONTS = {
  regular: 'System',
  bold: 'System',
};

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  ARTICLE_READ_COUNT: 'article_read_count',
  USER_PREFS: 'user_prefs',
  RECENT_SEARCHES: 'recent_searches',
};

export const AD_UNIT_IDS = {
  ANDROID_BANNER: 'ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx',
  IOS_BANNER: 'ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx',
};

export const STRINGS = {
  APP_NAME_TA: 'அக்னிசிறகு',
  APP_NAME_EN: 'Agnisiragu',
  BREAKING_NEWS_TA: 'முக்கிய செய்திகள்',
  BREAKING_NEWS_EN: 'Breaking News',
  LOGIN_TA: 'உள்நுழைய',
  LOGIN_EN: 'Login',
  LOGOUT_TA: 'வெளியேறு',
  LOGOUT_EN: 'Logout',
  HOME_TA: 'முகப்பு',
  HOME_EN: 'Home',
  CATEGORIES_TA: 'பிரிவுகள்',
  CATEGORIES_EN: 'Categories',
  SEARCH_TA: 'தேடல்',
  SEARCH_EN: 'Search',
  PROFILE_TA: 'சுயவிவரம்',
  PROFILE_EN: 'Profile',
  NO_RESULTS_TA: 'தேடல் முடிவுகள் இல்லை',
  NO_RESULTS_EN: 'No results found',
  LOGIN_GATE_HEADING_TA: 'படிக்கத் தொடரவும்',
  LOGIN_GATE_HEADING_EN: 'Continue Reading',
  LOGIN_GATE_MSG_TA: '10 செய்திகள் இலவசம். மேலும் படிக்க உள்நுழையவும்',
  LOGIN_GATE_MSG_EN: '10 articles free. Login to read more.',
  LOGIN_WITH_PHONE_TA: 'தொலைபேசியில் உள்நுழைய',
  LOGIN_WITH_PHONE_EN: 'Login with Phone',
  ADVERTISEMENT_EN: 'Advertisement',
  BOOKMARKS_TA: 'சேமிப்பு',
  BOOKMARKS_EN: 'Saved',
};
