// src/lib/auth.ts
// Minimal phone-OTP session storage for the website reader. Mirrors the
// reader-app's approach (backend/src/auth: /auth/send-otp, /auth/verify-otp,
// /auth/refresh — see apps/reader-app/src/hooks/useAuth.ts) but with
// localStorage instead of AsyncStorage/SecureStore, and a window
// CustomEvent instead of a Zustand store, since this app has no state
// library (see package.json) — any component can subscribe via
// onAuthChange() without prop-drilling or adding a Context provider around
// the whole app.
//
// Reading (articles, comments, reactions) never needs this — it's only
// used to gate posting a comment. Google login will reuse the same
// setSession()/clearSession() once added; only the sign-in method differs.

export interface WebsiteUser {
  id: string;
  phone?: string | null;
  email?: string | null;
  name?: string | null;
}

const ACCESS_KEY = 'agnisiragu_access_token';
const REFRESH_KEY = 'agnisiragu_refresh_token';
const USER_KEY = 'agnisiragu_user';
const AUTH_EVENT = 'agnisiragu-auth-changed';

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function getStoredUser(): WebsiteUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as WebsiteUser) : null;
  } catch {
    return null;
  }
}

export function setSession(accessToken: string, refreshToken: string, user: WebsiteUser) {
  localStorage.setItem(ACCESS_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function setAccessToken(token: string) {
  localStorage.setItem(ACCESS_KEY, token);
}

export function clearSession() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function onAuthChange(cb: () => void): () => void {
  window.addEventListener(AUTH_EVENT, cb);
  return () => window.removeEventListener(AUTH_EVENT, cb);
}
