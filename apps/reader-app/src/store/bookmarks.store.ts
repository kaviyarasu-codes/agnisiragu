// src/store/bookmarks.store.ts

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Article } from '@/types';

const STORAGE_KEY = 'bookmarked_articles';

interface BookmarksStore {
  bookmarks: Article[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  isBookmarked: (id: string) => boolean;
  toggleBookmark: (article: Article) => void;
  clearAll: () => void;
}

export const useBookmarksStore = create<BookmarksStore>((set, get) => ({
  bookmarks: [],
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) set({ bookmarks: JSON.parse(raw) as Article[] });
    } catch {
      // ignore
    } finally {
      set({ hydrated: true });
    }
  },

  isBookmarked: (id: string) => get().bookmarks.some((a) => a.id === id),

  toggleBookmark: (article: Article) => {
    const current = get().bookmarks;
    const exists = current.some((a) => a.id === article.id);
    const updated = exists
      ? current.filter((a) => a.id !== article.id)
      : [article, ...current];
    set({ bookmarks: updated });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
  },

  clearAll: () => {
    set({ bookmarks: [] });
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  },
}));
