// src/store/app.store.ts

import { create } from 'zustand';
import { getUserPrefs, setUserPrefs } from '@/lib/storage';
import { get as apiGet } from '@/lib/api';
import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS, DISTRICTS } from '@/constants';
import type { Language } from '@/types';

export interface NavTabConfig {
  key: string;
  labelTa: string;
  labelEn: string;
  visible: boolean;
}

export interface OnboardingSlideConfig {
  imageUrl: string | null;
  titleTa: string;
  titleEn: string;
  descTa: string;
  descEn: string;
}

// Shared shape for the two "soft" pre-permission screens (notification ask +
// location ask) — same layout, different copy, so one config shape covers
// both (see PermissionRequestScreen.tsx / LocationPermissionScreen.tsx).
export interface PermissionScreenBullet {
  labelTa: string;
  labelEn: string;
  on: boolean;
}

export interface PermissionScreenConfig {
  titleTa: string;
  titleEn: string;
  descTa: string;
  descEn: string;
  bullets: PermissionScreenBullet[];
  buttonLabelTa: string;
  buttonLabelEn: string;
  skipLabelTa: string;
  skipLabelEn: string;
}

export interface TermsScreenConfig {
  termsTa: string;
  termsEn: string;
  privacyTa: string;
  privacyEn: string;
}

export interface AboutScreenConfig {
  descTa: string;
  descEn: string;
  helpUrl: string;
  helpEnabled: boolean;
  contactEmail: string;
  contactEnabled: boolean;
  advertiseEmail: string;
  advertiseEnabled: boolean;
  rateUsEnabled: boolean;
  playStoreUrl: string;
  appStoreUrl: string;
}

export interface LanguageDistrictScreenConfig {
  taglineTa: string;
  taglineEn: string;
}

interface RemoteConfig {
  // Feature flags
  loginGate: boolean;
  breakingAlerts: boolean;
  maintenanceMode: boolean;
  freeArticleLimit: number;
  minSupportedVersion: string | null;
  latestVersion: string | null;

  // Home layout
  homeHeroStyle: 'slider' | 'single';
  homeShowBreakingBar: boolean;
  homeSectionOrder: string[];

  // Widgets
  widgetBreakingBanner: boolean;
  widgetCategoryTabs: boolean;

  // Bottom navigation
  navTabs: NavTabConfig[] | null;
  navShowLabels: boolean;

  // Side menu
  sideMenuEnabled: boolean;
  sideMenuShowProfile: boolean;
  sideMenuShowBookmarks: boolean;
  sideMenuShowDarkMode: boolean;
  sideMenuShowLanguage: boolean;
  sideMenuShowContact: boolean;

  // News sections
  pinnedCategorySlugs: string[];
  newsShowSeeAll: boolean;

  // Advertisement placement
  adInFeedFrequency: number;
  localAdsEnable: boolean;
  admobEnable: boolean;

  // Splash screen
  splashBgColor: string;
  splashDurationMs: number;
  splashAnimation: 'fade' | 'none' | 'wings';
  splashLogoUrl: string | null;
  splashShowTagline: boolean;
  splashTaglineTa: string;
  splashTaglineEn: string;

  // Theme
  defaultThemeMode: 'light' | 'dark' | 'system';

  // Onboarding carousel — admin-editable in App Configuration
  onboardingSlides: OnboardingSlideConfig[];

  // Rate ticker strip under the Home feed
  rateTickerEnabled: boolean;
  rateTickerSponsorName: string;
  rateTickerGoldRate: string;
  rateTickerSilverRate: string;

  // Setup-flow screens — admin-editable in App Configuration
  notifPermissionScreen: PermissionScreenConfig;
  locationPermissionScreen: PermissionScreenConfig;
  termsScreen: TermsScreenConfig;
  aboutScreen: AboutScreenConfig;
  languageDistrictScreen: LanguageDistrictScreenConfig;
}

const DEFAULT_CONFIG: RemoteConfig = {
  loginGate: true,
  breakingAlerts: true,
  maintenanceMode: false,
  freeArticleLimit: 10,
  minSupportedVersion: null,
  latestVersion: null,

  homeHeroStyle: 'slider',
  homeShowBreakingBar: true,
  homeSectionOrder: ['breaking', 'categories', 'feed'],

  widgetBreakingBanner: true,
  widgetCategoryTabs: true,

  navTabs: null,
  navShowLabels: true,

  sideMenuEnabled: true,
  sideMenuShowProfile: true,
  sideMenuShowBookmarks: true,
  sideMenuShowDarkMode: true,
  sideMenuShowLanguage: true,
  sideMenuShowContact: true,

  pinnedCategorySlugs: [],
  newsShowSeeAll: true,

  adInFeedFrequency: 5,
  localAdsEnable: true,
  admobEnable: false,

  splashBgColor: '#F5F1EB',
  splashDurationMs: 3400,
  splashAnimation: 'wings',
  splashLogoUrl: null,
  splashShowTagline: true,
  splashTaglineTa: 'உங்கள் ஊர் செய்திகள்',
  splashTaglineEn: 'Your town, your news',

  defaultThemeMode: 'system',

  rateTickerEnabled: true,
  rateTickerSponsorName: 'ஸ்ரீ லக்ஷ்மி நகைமாளிகை',
  rateTickerGoldRate: '₹7,240',
  rateTickerSilverRate: '₹96',

  onboardingSlides: [
    {
      imageUrl: null,
      titleTa: 'உங்கள் ஊரின் செய்தி, உடனே',
      titleEn: "Your town's news, instantly",
      descTa: 'உங்கள் மாவட்டத்தில் நடப்பதை முதலில் தெரிந்து கொள்ளுங்கள். சரிபார்க்கப்பட்ட செய்திகள் மட்டும்.',
      descEn: "Be the first to know what's happening in your district. Verified news only.",
    },
    {
      imageUrl: null,
      titleTa: 'உள்ளூர் மக்களே நிருபர்கள்',
      titleEn: 'Locals are the reporters',
      descTa: 'உங்கள் பகுதியில் நடப்பதை நீங்களே பதிவு செய்யலாம் — ஆசிரியர் குழு சரிபார்த்த பிறகு உடனே வெளியிடப்படும்.',
      descEn: "Report what's happening in your area yourself — published instantly after editorial review.",
    },
    {
      imageUrl: null,
      titleTa: 'எழுதி சம்பாதியுங்கள்',
      titleEn: 'Write and earn',
      descTa: 'தொடர்ந்து செய்தி அளிக்கும் நிருபர்களுக்கு புள்ளிகள் மற்றும் அதிகாரப்பூர்வ பத்திரிகையாளர் அடையாள அட்டை.',
      descEn: 'Consistent reporters earn points and an official Press ID card.',
    },
  ],

  notifPermissionScreen: {
    titleTa: 'முக்கிய செய்திகளை உடனே அறியுங்கள்',
    titleEn: 'Know important news instantly',
    descTa: 'உங்கள் மாவட்டத்தில் அவசர செய்தி வரும்போது மட்டும் அறிவிப்பு அனுப்புவோம். நாளொன்றுக்கு 2–3 மட்டுமே.',
    descEn: "We'll only notify you when there's urgent news in your district — just 2-3 a day.",
    bullets: [
      { labelTa: 'அவசர செய்தி எச்சரிக்கை', labelEn: 'Breaking news alerts', on: true },
      { labelTa: 'உங்கள் ஊர் செய்திகள்', labelEn: 'News from your town', on: true },
      { labelTa: 'விளம்பரம் இல்லை', labelEn: 'No spam', on: false },
    ],
    buttonLabelTa: 'அனுமதி அளி',
    buttonLabelEn: 'Allow',
    skipLabelTa: 'இப்போது வேண்டாம்',
    skipLabelEn: 'Not now',
  },

  locationPermissionScreen: {
    titleTa: 'உங்கள் இருப்பிடத்தை அறிய அனுமதி தேவை',
    titleEn: 'Location access needed',
    descTa: 'இருப்பிட அனுமதி அளித்தால், உங்கள் மாவட்ட செய்திகளை தானாக காட்டுவோம். இதை எப்போது வேண்டுமானாலும் அமைப்புகளில் மாற்றலாம்.',
    descEn: "With location access, we'll automatically show news from your district. You can change this anytime in Settings.",
    bullets: [
      { labelTa: 'உங்கள் மாவட்ட செய்திகள் தானாக தேர்வு', labelEn: 'Auto-select your district news', on: true },
      { labelTa: 'அருகிலுள்ள நிகழ்வுகள் மற்றும் விளம்பரங்கள்', labelEn: 'Nearby events and offers', on: true },
      { labelTa: 'எப்போது வேண்டுமானாலும் அமைப்புகளில் மாற்றலாம்', labelEn: 'Change anytime in Settings', on: false },
    ],
    buttonLabelTa: 'அனுமதி அளி',
    buttonLabelEn: 'Allow',
    skipLabelTa: 'இப்போது வேண்டாம்',
    skipLabelEn: 'Not now',
  },

  termsScreen: {
    termsTa: `இந்த செயலியை பயன்படுத்துவதன் மூலம் நீங்கள் அக்னிசிறகு பயன்பாட்டு விதிமுறைகளை ஏற்றுக்கொள்கிறீர்கள்.

1. உள்ளடக்கம்: அக்னிசிறகு மூலம் வெளியிடப்படும் அனைத்து செய்திகளும் சரிபார்ப்புக்கு உட்பட்டவை. பயனர்கள் சமர்ப்பிக்கும் செய்திகள் வெளியிடப்படுவதற்கு முன் ஆசிரியர் குழுவால் சரிபார்க்கப்படும்.

2. கணக்கு: தொலைபேசி எண் மூலம் பதிவு செய்யப்படும் கணக்குகள் அந்தந்த பயனருக்கே சொந்தமானவை. தவறான தகவல் அளிப்பது கணக்கு நிறுத்தத்திற்கு வழிவகுக்கும்.

3. நடத்தை: வெறுப்புணர்வு, வன்முறை அல்லது தவறான தகவல்களை பரப்புவது தடைசெய்யப்பட்டது.

4. மாற்றங்கள்: இந்த விதிமுறைகள் அவ்வப்போது புதுப்பிக்கப்படலாம்.`,
    termsEn: `By using this app, you agree to Agnisiragu's terms of use.

1. Content: All news published through Agnisiragu is subject to editorial verification. User-submitted reports are reviewed by our editorial team before publication.

2. Accounts: Accounts registered via phone number belong to the individual user. Providing false information may result in account suspension.

3. Conduct: Hate speech, incitement to violence, or the deliberate spread of misinformation is prohibited.

4. Changes: These terms may be updated from time to time.`,
    privacyTa: `உங்கள் தனியுரிமையை நாங்கள் மதிக்கிறோம்.

1. சேகரிக்கப்படும் தகவல்கள்: தொலைபேசி எண், விருப்பமான மொழி, மாவட்டம் மற்றும் பயன்பாட்டு புள்ளிவிவரங்கள்.

2. பயன்பாடு: உங்கள் தகவல்கள் செய்திகளை தனிப்பயனாக்கவும், அறிவிப்புகள் அனுப்பவும் மட்டுமே பயன்படுத்தப்படும்.

3. பகிர்வு: உங்கள் தனிப்பட்ட தகவல்கள் மூன்றாம் தரப்பினருடன் விற்கப்படாது.

4. தொடர்பு: தனியுரிமை தொடர்பான கேள்விகளுக்கு எங்களை தொடர்பு கொள்ளுங்கள்.`,
    privacyEn: `We respect your privacy.

1. Information we collect: phone number, language preference, district, and usage analytics.

2. Use: your information is used only to personalize news and send relevant alerts.

3. Sharing: your personal information is never sold to third parties.

4. Contact: reach out to us with any privacy-related questions.`,
  },

  aboutScreen: {
    descTa: 'உங்கள் ஊர் செய்திகளை உங்கள் மொழியில், சரிபார்க்கப்பட்ட நிருபர்களிடமிருந்து.',
    descEn: "Your town's news, in your language, from verified reporters.",
    helpUrl: 'https://agnisiragu.com/help',
    helpEnabled: true,
    contactEmail: 'agni360tn@gmail.com',
    contactEnabled: true,
    advertiseEmail: 'ads@agnisiragu.com',
    advertiseEnabled: true,
    rateUsEnabled: true,
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.agnisiragu.reader',
    appStoreUrl: 'https://apps.apple.com/app/agnisiragu',
  },

  languageDistrictScreen: {
    taglineTa: 'உங்கள் ஊர் செய்திகள், ஒரே இடத்தில்',
    taglineEn: 'Your town\'s news, all in one place',
  },
};

interface AppStore {
  language: Language;
  colorScheme: 'light' | 'dark' | 'system';
  district: string | null;
  onboardingDone: boolean;
  selectedCategories: string[];
  hydrated: boolean;
  remoteConfig: RemoteConfig;
  configLoaded: boolean;
  sideMenuOpen: boolean;
  setSideMenuOpen: (open: boolean) => void;
  setLanguage: (lang: Language) => void;
  setColorScheme: (scheme: 'light' | 'dark' | 'system') => void;
  setDistrict: (districtId: string) => void;
  completeOnboarding: () => void;
  toggleCategory: (categoryId: string) => void;
  setSelectedCategories: (ids: string[]) => void;
  clearCategoryFilter: () => void;
  hydrateFromStorage: () => Promise<void>;
  fetchRemoteConfig: () => Promise<void>;
}

export const useAppStore = create<AppStore>((set, get) => ({
  language: 'ta',
  colorScheme: 'system',
  district: null,
  onboardingDone: false,
  selectedCategories: [],
  hydrated: false,
  remoteConfig: DEFAULT_CONFIG,
  configLoaded: false,
  sideMenuOpen: false,
  setSideMenuOpen: (open) => set({ sideMenuOpen: open }),

  setColorScheme: (scheme) => {
    set({ colorScheme: scheme });
    setUserPrefs({ ...(getUserPrefs as any), colorScheme: scheme }).catch(() => {});
  },

  setLanguage: (lang) => {
    set({ language: lang });
    // Persist language preference
    getUserPrefs().then((prefs) => {
      setUserPrefs({
        language: lang,
        notificationCategories: prefs?.notificationCategories ?? [],
      }).catch(() => {});
    }).catch(() => {});
  },

  setDistrict: (districtId) => {
    set({ district: districtId });
    SecureStore.setItemAsync(STORAGE_KEYS.DISTRICT, districtId).catch(() => {});
  },

  completeOnboarding: () => {
    set({ onboardingDone: true });
    SecureStore.setItemAsync(STORAGE_KEYS.ONBOARDING_DONE, '1').catch(() => {});
  },

  toggleCategory: (categoryId) => {
    const current = get().selectedCategories;
    const exists = current.includes(categoryId);
    set({
      selectedCategories: exists
        ? current.filter((id) => id !== categoryId)
        : [...current, categoryId],
    });
  },

  setSelectedCategories: (ids) => set({ selectedCategories: ids }),

  clearCategoryFilter: () => set({ selectedCategories: [] }),

  hydrateFromStorage: async () => {
    try {
      const [prefs, district, onboardingDone] = await Promise.all([
        getUserPrefs(),
        SecureStore.getItemAsync(STORAGE_KEYS.DISTRICT).catch(() => null),
        SecureStore.getItemAsync(STORAGE_KEYS.ONBOARDING_DONE).catch(() => null),
      ]);
      if (prefs?.language) set({ language: prefs.language });
      if (district && DISTRICTS.some((d) => d.id === district)) set({ district });
      if (onboardingDone === '1') set({ onboardingDone: true });
    } catch {
      // ignore
    } finally {
      set({ hydrated: true });
    }
  },

  fetchRemoteConfig: async () => {
    try {
      const res = await apiGet<{ data: RemoteConfig }>('/config');
      const merged = { ...DEFAULT_CONFIG, ...res.data };
      set({ remoteConfig: merged, configLoaded: true });
      // Apply the admin's platform default theme — only meaningful at first
      // boot since colorScheme still starts at 'system' every launch.
      if (get().colorScheme === 'system' && merged.defaultThemeMode !== 'system') {
        set({ colorScheme: merged.defaultThemeMode });
      }
    } catch {
      // Backend unreachable — fall back to defaults, don't block the app.
      set({ configLoaded: true });
    }
  },
}));
