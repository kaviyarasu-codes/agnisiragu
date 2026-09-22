// src/lib/api.ts
import axios from 'axios';
import toast from 'react-hot-toast';

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

// Response interceptor: handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // AuthService.validateJwtPayload throws this specific message (rather
      // than the generic "Unauthorized") when this token's session id no
      // longer matches the account's active one — i.e. someone signed in
      // on another device and this session got superseded. Worth a clearer
      // message than "please log in again", since the person didn't do
      // anything wrong here.
      const superseded = error.response?.data?.message === 'SESSION_SUPERSEDED';
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
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
