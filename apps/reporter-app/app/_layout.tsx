// app/_layout.tsx
// Root stack. Phase 1 (UI-only): no auth/API gating yet — bootstrap just
// loads fonts and hides the native splash. Phase 2 will add the same
// token-check + onboarding-redirect bootstrap the reader app uses
// (see reader-app/app/_layout.tsx's AppBootstrap for the pattern to copy).

import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreenNative from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAppFonts } from '@/theme/fonts';
import { COLORS } from '@/constants';

SplashScreenNative.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 2, staleTime: 1000 * 60 * 5 } },
});

function Gate({ children }: { children: React.ReactNode }) {
  const fontsLoaded = useAppFonts();

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreenNative.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: COLORS.dark }} />;
  }
  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <Gate>
            <StatusBar style="light" />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.background } }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="register" />
              <Stack.Screen name="account-status" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="upload-preview" options={{ presentation: 'card' }} />
              <Stack.Screen name="report/[id]" options={{ presentation: 'card' }} />
              <Stack.Screen name="emergency" options={{ presentation: 'fullScreenModal' }} />
              <Stack.Screen name="profile" options={{ presentation: 'card' }} />
            </Stack>
          </Gate>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
