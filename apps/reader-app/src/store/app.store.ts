// src/store/app.store.ts

import { create } from 'zustand';
import { getUserPrefs, setUserPrefs } from '@/lib/storage';
import { get as apiGet } from '@/lib/api';
import type { Language } from '@/types';

interface RemoteConfig {
  loginGate: boolean;
  breakingAlerts: boolean;
  maintenanceMode: boolean;
}

const DEFAULT_CONFIG: RemoteConfig = {
  loginGate: true,
  breakingAlerts: true,
  maintenanceMode: false,
};

interface AppStore {
  language: Language;
  colorScheme: 'light' | 'dark' | 'system';
  selectedCategories: string[];
  hydrated: boolean;
  remoteConfig: RemoteConfig;
  configLoaded: boolean;
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
      set({ remoteConfig: { ...DEFAULT_CONFIG, ...res.data }, configLoaded: true });
    } catch {
      // Backend unreachable — fall back to defaults, don't block the app.
      set({ configLoaded: true });
    }
  },
}));
