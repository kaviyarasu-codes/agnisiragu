// src/constants/index.ts

// DEV: Replace YOUR_LAPTOP_IP with your laptop's hotspot IP (run `ipconfig` → Wireless LAN adapter → IPv4)
// Example: 'http://192.168.137.1:3000/api/v1'
// PROD: 'https://api.agnisiragu.com/api/v1'
export const API_BASE_URL = __DEV__
  ? 'http://10.65.105.253:3000/api/v1'
  : 'https://api.agnisiragu.com/api/v1';

export const FREE_ARTICLE_LIMIT = 10;

export const COLORS = {
  primary: '#1E3A5F',
  accent: '#E63946',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  text: '#111827',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  success: '#16A34A',
  warning: '#D97706',
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
};
