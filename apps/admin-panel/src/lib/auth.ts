// src/lib/auth.ts
import type { Admin } from '../types';

const TOKEN_KEY = 'admin_token';
const ADMIN_KEY = 'admin_user';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ADMIN_KEY);
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
