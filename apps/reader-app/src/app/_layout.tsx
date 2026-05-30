// src/app/_layout.tsx

import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '@/store/auth.store';
import { getToken, getArticleReadCount } from '@/lib/storage';
import { get } from '@/lib/api';
import type { User } from '@/types';
import { COLORS } from '@/constants';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,
    },
  },
});

function AppBootstrap({ children }: { children: React.ReactNode }) {
  const { setUser, setAuthenticated, setArticleReadCount } = useAuthStore();

  useEffect(() => {
    async function bootstrap() {
      try {
        const [token, readCount] = await Promise.all([
          getToken(),
          getArticleReadCount(),
        ]);

        setArticleReadCount(readCount);

        if (token) {
          try {
            const res = await get<{ data: User }>('/users/me');
            const user = res.data;
            setUser(user);
            setAuthenticated(true);
          } catch {
            // Token expired or invalid; stays logged out
          }
        }
      } catch {
        // ignore bootstrap errors
      } finally {
        await SplashScreen.hideAsync();
      }
    }

    bootstrap();
  }, []);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <AppBootstrap>
            <StatusBar style="light" backgroundColor={COLORS.primary} />
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: COLORS.primary },
                headerTintColor: COLORS.surface,
                headerTitleStyle: { fontWeight: '700' },
                contentStyle: { backgroundColor: COLORS.background },
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="article/[id]"
                options={{ title: '' }}
              />
              <Stack.Screen
                name="login"
                options={{ title: 'உள்நுழைய / Login', presentation: 'modal' }}
              />
              <Stack.Screen
                name="onboarding"
                options={{ headerShown: false }}
              />
            </Stack>
          </AppBootstrap>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
