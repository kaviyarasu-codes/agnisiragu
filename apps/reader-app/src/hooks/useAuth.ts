// src/hooks/useAuth.ts

import { useAuthStore } from '@/store/auth.store';
import { post } from '@/lib/api';
import { setToken, setRefreshToken, clearTokens } from '@/lib/storage';
import { FREE_ARTICLE_LIMIT } from '@/constants';
import type { User } from '@/types';

interface VerifyOtpApiResponse {
  data: {
    accessToken: string;
    refreshToken: string;
    user: User;
  };
}

interface SendOtpApiResponse {
  message: string;
}

export function useAuth() {
  const { user, isAuthenticated, articleReadCount, setUser, setAuthenticated, logout: storeLogout } =
    useAuthStore();

  async function sendOtp(phone: string): Promise<string> {
    const response = await post<SendOtpApiResponse>('/auth/send-otp', { phone });
    return response.message;
  }

  async function verifyOtp(phone: string, otp: string): Promise<void> {
    const response = await post<VerifyOtpApiResponse>('/auth/verify-otp', { phone, otp });
    await setToken(response.data.accessToken);
    await setRefreshToken(response.data.refreshToken);
    setUser(response.data.user);
    setAuthenticated(true);
  }

  async function logout(): Promise<void> {
    try {
      await post('/auth/logout');
    } catch {
      // best effort
    } finally {
      await clearTokens();
      storeLogout();
    }
  }

  function checkArticleLimit(): boolean {
    if (isAuthenticated) return false;
    return articleReadCount >= FREE_ARTICLE_LIMIT;
  }

  return {
    user,
    isAuthenticated,
    articleReadCount,
    sendOtp,
    verifyOtp,
    logout,
    checkArticleLimit,
  };
}
