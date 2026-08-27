// src/store/auth.store.ts

import { create } from 'zustand';
import type { ReporterProfile } from '@/types';
import { clearTokens } from '@/lib/storage';

interface AuthStore {
  reporter: ReporterProfile | null;
  isAuthenticated: boolean;
  isRegistered: boolean; // has a Reporter row (vs. just a phone-verified User)
  setReporter: (reporter: ReporterProfile | null) => void;
  setAuthenticated: (v: boolean) => void;
  setRegistered: (v: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  reporter: null,
  isAuthenticated: false,
  isRegistered: false,

  setReporter: (reporter) => set({ reporter, isRegistered: !!reporter }),
  setAuthenticated: (v) => set({ isAuthenticated: v }),
  setRegistered: (v) => set({ isRegistered: v }),

  logout: () => {
    clearTokens().catch(() => {});
    set({ reporter: null, isAuthenticated: false, isRegistered: false });
  },
}));
