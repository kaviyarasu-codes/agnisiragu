// src/store/history.store.ts
// Local reading history — backs ProfileScreen's "History" tab. There's no
// server-side read-history endpoint (only the aggregate articleReadCount on
// auth.store), so this mirrors bookmarks.store's AsyncStorage pattern:
// device-local, capped, most-recent-first.

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Article } from '@/types';

const STORAGE_KEY = 'reading_history';
const MAX_HISTORY = 100;

interface HistoryStore {
  history: Article[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  addToHistory: (article: Article) => void;
  clearAll: () => void;
}

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  history: [],
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) set({ history: JSON.parse(raw) as Article[] });
    } catch {
      // ignore
    } finally {
      set({ hydrated: true });
    }
  },

  addToHistory: (article: Article) => {
    const current = get().history;
    const updated = [article, ...current.filter((a) => a.id !== article.id)].slice(0, MAX_HISTORY);
    set({ history: updated });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
  },

  clearAll: () => {
    set({ history: [] });
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  },
}));
