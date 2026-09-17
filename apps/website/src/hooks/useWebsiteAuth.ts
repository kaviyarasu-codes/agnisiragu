'use client';

// src/hooks/useWebsiteAuth.ts
import { useCallback, useEffect, useState } from 'react';
import { getStoredUser, onAuthChange, clearSession, type WebsiteUser } from '@/lib/auth';

export function useWebsiteAuth() {
  const [user, setUser] = useState<WebsiteUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setUser(getStoredUser());
    setHydrated(true);
    return onAuthChange(() => setUser(getStoredUser()));
  }, []);

  const logout = useCallback(() => clearSession(), []);

  return { user, isAuthenticated: !!user, hydrated, logout };
}
