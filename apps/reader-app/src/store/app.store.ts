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
