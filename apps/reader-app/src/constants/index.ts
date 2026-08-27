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

// ── Colors — kept in sync with theme/index.ts's lightTheme; use useTheme()
// for anything that must react to dark mode. COLORS is for the few call
// sites (StyleSheet.create defaults, non-component modules) that need a
// static value outside a component. ────────────────────────────────────────
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
  gold:          '#E9B84A',

  // Legacy aliases (keep so existing screens don't break)
  text:          '#1C1917',
  textSecondary: '#57534E',

  // Category strip colors (left border on cards)
  catColors: {
    politics:      '#1565C0',
    sports:        '#E65100',
    entertainment: '#6C3483',
    cinema:        '#6C3483',
    business:      '#2E7D32',
    technology:    '#0891B2',
    health:        '#DC2626',
    default:       '#CC1F2D',
  },
};

// ── Fonts — see theme/fonts.ts for the loader. Tamil headlines/UI use Anek
// Tamil (bold, display-weight — the design's `.ta` class); Tamil body copy
// uses Noto Sans Tamil (the `.tb` class, more readable at small sizes);
// English chrome/numerals use Barlow, with Barlow Condensed for uppercase
// tickers and tiny labels (the design's `.chip` class). Falls back to the
// system font until useAppFonts() resolves. ─────────────────────────────────
export const FONT_FAMILIES = {
  displayRegular:   'AnekTamil-Regular',
  displaySemiBold:  'AnekTamil-SemiBold',
  displayBold:      'AnekTamil-Bold',
  displayExtraBold: 'AnekTamil-ExtraBold',
  bodyRegular:      'NotoSansTamil-Regular',
  bodyMedium:       'NotoSansTamil-Medium',
  bodySemiBold:     'NotoSansTamil-SemiBold',
  uiRegular:        'Barlow-Regular',
  uiMedium:         'Barlow-Medium',
  uiSemiBold:       'Barlow-SemiBold',
  uiBold:           'Barlow-Bold',
  condensedSemiBold: 'BarlowCondensed-SemiBold',
  condensedBold:     'BarlowCondensed-Bold',
};

// Backward-compatible alias used by a couple of older screens.
export const FONTS = {
  regular: FONT_FAMILIES.bodyRegular,
  bold: FONT_FAMILIES.displayBold,
};

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  ARTICLE_READ_COUNT: 'article_read_count',
  USER_PREFS: 'user_prefs',
  RECENT_SEARCHES: 'recent_searches',
  DEVICE_ID: 'device_id',
  DISTRICT: 'district_id',
  ONBOARDING_DONE: 'onboarding_done',
  NOTIF_PERMISSION_ASKED: 'notif_permission_asked',
  LOCATION_PERMISSION_ASKED: 'location_permission_asked',
  SWIPE_HINT_SHOWN: 'swipe_hint_shown',
};

export const AD_UNIT_IDS = {
  ANDROID_BANNER: 'ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx',
  IOS_BANNER: 'ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx',
};

// Districts the reader can follow — drives the onboarding location picker,
// the header chip, search's location filter, and Settings → district.
// (Backend can replace this with GET /districts later; static for Phase 1.)
export const DISTRICTS = [
  { id: 'coimbatore',    nameTa: 'கோயம்புத்தூர்',      nameEn: 'Coimbatore' },
  { id: 'tiruppur',      nameTa: 'திருப்பூர்',           nameEn: 'Tiruppur' },
  { id: 'erode',         nameTa: 'ஈரோடு',               nameEn: 'Erode' },
  { id: 'chennai',       nameTa: 'சென்னை',              nameEn: 'Chennai' },
  { id: 'madurai',       nameTa: 'மதுரை',               nameEn: 'Madurai' },
  { id: 'salem',         nameTa: 'சேலம்',                nameEn: 'Salem' },
  { id: 'trichy',        nameTa: 'திருச்சிராப்பள்ளி',    nameEn: 'Tiruchirappalli' },
  { id: 'vellore',       nameTa: 'வேலூர்',               nameEn: 'Vellore' },
  { id: 'thanjavur',     nameTa: 'தஞ்சாவூர்',            nameEn: 'Thanjavur' },
  { id: 'tirunelveli',   nameTa: 'திருநெல்வேலி',         nameEn: 'Tirunelveli' },
  { id: 'kanyakumari',   nameTa: 'கன்னியாகுமரி',         nameEn: 'Kanyakumari' },
  { id: 'pudukkottai',   nameTa: 'புதுக்கோட்டை',         nameEn: 'Pudukkottai' },
];

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
  ARCHIVE_TA: 'காப்பகம்',
  ARCHIVE_EN: 'Archive',
  JOBS_TA: 'வேலை வாய்ப்பு',
  JOBS_EN: 'Jobs',
  POST_TA: 'செய்தி அனுப்பு',
  POST_EN: 'Post News',
  SETTINGS_TA: 'அமைப்புகள்',
  SETTINGS_EN: 'Settings',
  NOTIFICATIONS_TA: 'அறிவிப்புகள்',
  NOTIFICATIONS_EN: 'Notifications',
};
