// src/lib/auth.ts
import type { Admin } from '../types';

const TOKEN_KEY = 'admin_token';
const ADMIN_KEY = 'admin_user';
// Needed so Layout.tsx's Logout button (and the idle-timeout auto-logout)
// can call POST /auth/logout with it — that's what clears
// Admin.activeSessionId server-side. Without this, "logout" was purely
// client-side and the account looked permanently "signed in elsewhere" to
// the single-active-session check on the next login attempt.
const REFRESH_KEY = 'admin_refresh_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function setRefreshToken(token: string): void {
  localStorage.setItem(REFRESH_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ADMIN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export function getAdmin(): Admin | null {
  const raw = localStorage.getItem(ADMIN_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Admin;
  } catch {
    return null;
  }
}

export function setAdmin(admin: Admin): void {
  localStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
