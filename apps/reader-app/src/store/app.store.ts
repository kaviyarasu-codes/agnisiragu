// src/store/app.store.ts

import { create } from 'zustand';
import type { Language } from '@/types';

interface AppStore {
  language: Language;
  selectedCategories: string[];
  setLanguage: (lang: Language) => void;
  toggleCategory: (categoryId: string) => void;
  setSelectedCategories: (ids: string[]) => void;
  clearCategoryFilter: () => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  language: 'ta',
  selectedCategories: [],

  setLanguage: (lang) => set({ language: lang }),

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
}));
