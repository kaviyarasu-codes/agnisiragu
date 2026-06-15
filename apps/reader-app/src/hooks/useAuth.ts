// src/hooks/useAuth.ts

import { post } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { setToken, setRefreshToken, getRefreshToken } from '@/lib/storage';
import type { OtpVerifyResponse } from '@/types';

export function useAuth() {
  const { setUser, setAuthenticated, logout: storeLogout } = useAuthStore();

  async function sendOtp(phone: string): Promise<void> {
    await post('/auth/send-otp', { phone });
  }

  async function verifyOtp(phone: string, otp: string): Promise<void> {
    const res = await post<{ data: OtpVerifyResponse }>('/auth/verify-otp', { phone, otp });
    const { user, accessToken, refreshToken } = res.data;
    await setToken(accessToken);
    await setRefreshToken(refreshToken);
    setUser(user);
    setAuthenticated(true);
  }

  async function logout(): Promise<void> {
    try {
      const refreshToken = await getRefreshToken();
      if (refreshToken) {
        await post('/auth/logout', { refreshToken });
      }
    } catch {
      // ignore logout API errors
    } finally {
      storeLogout();
    }
  }

  return { sendOtp, verifyOtp, logout };
}
