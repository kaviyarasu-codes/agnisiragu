// src/store/auth.store.ts
import { create } from 'zustand';
import type { Admin } from '../types';
import { clearToken, getAdmin, setAdmin as persistAdmin } from '../lib/auth';

interface AuthStore {
  admin: Admin | null;
  isAuthenticated: boolean;
  setAdmin: (admin: Admin | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  admin: getAdmin(),
  isAuthenticated: !!getAdmin(),

  setAdmin: (admin) => {
    if (admin) {
      persistAdmin(admin);
    }
    set({ admin, isAuthenticated: !!admin });
  },

  logout: () => {
    clearToken();
    set({ admin: null, isAuthenticated: false });
  },
}));
