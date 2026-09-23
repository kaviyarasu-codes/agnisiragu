// src/lib/api.ts
import axios from 'axios';
import toast from 'react-hot-toast';
import { getRefreshToken, setToken, clearToken } from './auth';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  // Without this, a hung request (dead backend, bad network) leaves the
  // caller's loading state spinning forever — mirrors the reader-app's
  // axios timeout (apps/reader-app/src/lib/api.ts) and the website's
  // fetchWithTimeout. Reports endpoints can be slower than simple CRUD,
  // so this is a bit more generous than the 15s used elsewhere.
  timeout: 20000,
});

// Request interceptor: attach Bearer token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Access tokens expire in 15 minutes (JWT_EXPIRES_IN). Before this fix, ANY
// 401 — including one caused by nothing more than an editor spending 15+
// minutes writing an article before hitting Save — immediately wiped
// localStorage and hard-redirected to /login, silently discarding whatever
// they were doing. Now a plain expired-token 401 is handled transparently:
// swap it for a fresh access token via the stored refresh token and replay
// the original request once. Only fall through to a forced logout if that
// refresh itself fails (refresh token also expired/revoked, or this session
// was superseded by a login elsewhere — see validateJwtPayload).
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  try {
    const res = await axios.post<{ data: { accessToken: string } }>(`${BASE_URL}/auth/refresh`, { refreshToken });
    const newToken = res.data?.data?.accessToken;
    if (!newToken) return null;
    setToken(newToken);
    return newToken;
  } catch {
    return null;
  }
}

// Requests to /auth/* (login, refresh itself, send-otp, ...) manage their
// own error handling in their callers (e.g. LoginPage's 409-conflict
// handling) — they should never trigger a silent refresh attempt or a
// forced redirect away from the page that's already showing the real error.
function isAuthEndpoint(url?: string): boolean {
  return !!url && url.includes('/auth/');
}

// Response interceptor: transparently refresh an expired access token once,
// otherwise handle a genuinely-dead session (logout everywhere, forced
// sign-out).
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as (import('axios').InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (error.response?.status === 401 && original && !original._retry && !isAuthEndpoint(original.url)) {
      original._retry = true;
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => { refreshPromise = null; });
      }
      const newToken = await refreshPromise;
      if (newToken) {
        original.headers = { ...(original.headers as Record<string, string> | undefined), Authorization: `Bearer ${newToken}` } as typeof original.headers;
        return api(original);
      }
    }

    if (error.response?.status === 401 && !isAuthEndpoint(original?.url)) {
      // AuthService.validateJwtPayload throws this specific message (rather
      // than the generic "Unauthorized") when this token's session id no
      // longer matches the account's active one — i.e. someone signed in
      // on another device and this session got superseded. Worth a clearer
      // message than "please log in again", since the person didn't do
      // anything wrong here.
      const superseded = error.response?.data?.message === 'SESSION_SUPERSEDED';
      clearToken();
      if (superseded) {
        toast.error('You were signed out because this account was signed in on another device.', { duration: 6000 });
      }
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export async function apiGet<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const response = await api.get<T>(url, { params });
  return response.data;
}

export async function apiPost<T>(url: string, data?: unknown, timeoutMs?: number): Promise<T> {
  const response = await api.post<T>(url, data, timeoutMs ? { timeout: timeoutMs } : undefined);
  return response.data;
}

export async function apiPatch<T>(url: string, data?: unknown): Promise<T> {
  const response = await api.patch<T>(url, data);
  return response.data;
}

export async function apiDelete<T>(url: string): Promise<T> {
  const response = await api.delete<T>(url);
  return response.data;
}

// Pulls the backend's actual error message out of an axios error, instead
// of every caller showing the same generic "failed" toast for a 403 role
// restriction, a 400 validation error, and a dead network all alike — which
// is exactly what made "I keep having problems" reports (e.g. a blocked
// Publish attempt for a role that isn't allowed to publish) impossible to
// diagnose from the user's side.
export function getErrorMessage(err: unknown, fallback: string): string {
  const e = err as { response?: { status?: number; data?: { message?: string | string[] } } };
  const msg = e?.response?.data?.message;
  if (Array.isArray(msg) && msg.length) return msg.join(', ');
  if (typeof msg === 'string' && msg) return msg;
  if (e?.response?.status === 403) return "You don't have permission to do this.";
  return fallback;
}
