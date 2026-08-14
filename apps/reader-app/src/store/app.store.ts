// src/store/app.store.ts

import { create } from 'zustand';
import { getUserPrefs, setUserPrefs } from '@/lib/storage';
import { get as apiGet } from '@/lib/api';
import type { Language } from '@/types';

export interface NavTabConfig {
  key: string;
  labelTa: string;
  labelEn: string;
  visible: boolean;
}

interface RemoteConfig {
  // Feature flags
  loginGate: boolean;
  breakingAlerts: boolean;
  maintenanceMode: boolean;
  freeArticleLimit: number;

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
  splashAnimation: 'fade' | 'none';
  splashLogoUrl: string | null;
  splashShowTagline: boolean;
  splashTaglineTa: string;
  splashTaglineEn: string;

  // Theme
  defaultThemeMode: 'light' | 'dark' | 'system';
}

const DEFAULT_CONFIG: RemoteConfig = {
  loginGate: true,
  breakingAlerts: true,
  maintenanceMode: false,
  freeArticleLimit: 10,

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

  splashBgColor: '#000000',
  splashDurationMs: 1200,
  splashAnimation: 'fade',
  splashLogoUrl: null,
  splashShowTagline: true,
  splashTaglineTa: 'உண்மையை உரக்கச் சொல்வோம்',
  splashTaglineEn: 'Truth, Told Loud',

  defaultThemeMode: 'system',
};

interface AppStore {
  language: Language;
  colorScheme: 'light' | 'dark' | 'system';
  selectedCategories: string[];
  hydrated: boolean;
  remoteConfig: RemoteConfig;
  configLoaded: boolean;
  sideMenuOpen: boolean;
  setSideMenuOpen: (open: boolean) => void;
  setLanguage: (lang: Language) => void;
  setColorScheme: (scheme: 'light' | 'dark' | 'system') => void;
  toggleCategory: (categoryId: string) => void;
  setSelectedCategories: (ids: string[]) => void;
  clearCategoryFilter: () => void;
  hydrateFromStorage: () => Promise<void>;
  fetchRemoteConfig: () => Promise<void>;
}

export const useAppStore = create<AppStore>((set, get) => ({
  language: 'ta',
  colorScheme: 'system',
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
      const prefs = await getUserPrefs();
      if (prefs?.language) {
        set({ language: prefs.language });
      }
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
