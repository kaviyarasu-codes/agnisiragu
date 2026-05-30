// src/store/auth.store.ts

import { create } from 'zustand';
import type { User } from '@/types';
import { clearTokens, setArticleReadCount } from '@/lib/storage';

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  articleReadCount: number;
  setUser: (user: User | null) => void;
  setAuthenticated: (v: boolean) => void;
  incrementReadCount: () => void;
  setArticleReadCount: (count: number) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isAuthenticated: false,
  articleReadCount: 0,

  setUser: (user) => set({ user }),

  setAuthenticated: (v) => set({ isAuthenticated: v }),

  incrementReadCount: () => {
    const newCount = get().articleReadCount + 1;
    set({ articleReadCount: newCount });
    setArticleReadCount(newCount).catch(() => {});
  },

  setArticleReadCount: (count) => set({ articleReadCount: count }),

  logout: () => {
    clearTokens().catch(() => {});
    set({ user: null, isAuthenticated: false, articleReadCount: 0 });
  },
}));
