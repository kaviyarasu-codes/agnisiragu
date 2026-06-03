// src/store/app.store.ts

import { create } from 'zustand';
import { getUserPrefs, setUserPrefs } from '@/lib/storage';
import type { Language } from '@/types';

interface AppStore {
  language: Language;
  selectedCategories: string[];
  hydrated: boolean;
  setLanguage: (lang: Language) => void;
  toggleCategory: (categoryId: string) => void;
  setSelectedCategories: (ids: string[]) => void;
  clearCategoryFilter: () => void;
  hydrateFromStorage: () => Promise<void>;
}

export const useAppStore = create<AppStore>((set, get) => ({
  language: 'ta',
  selectedCategories: [],
  hydrated: false,

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
}));
