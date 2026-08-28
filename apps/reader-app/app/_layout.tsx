// app/_layout.tsx
// Root stack — rewritten for the Aug 2026 redesign. The (tabs) bottom-nav
// group is gone: Home is now a top-level route and every other screen is a
// pushed Stack screen, reached from the side menu, the swipe feed's edge
// rail, or the header/settings rows those screens build themselves. Most
// screens render their own in-screen header (back button + title matching
// the design), so they run with headerShown:false; the handful that don't
// build one (Search, Bookmarks, Profile, Jobs, Reels, Notifications,
// Reporter profile, Settings) get a themed native header instead.
//
// Also adds: font loading gate (useAppFonts — screens use Anek Tamil/Noto
// Sans Tamil/Barlow throughout, so nothing should render before they're
// ready), the onboarding redirect (first launch → /onboarding), and the
// force-update gate (remoteConfig.minSupportedVersion vs. the running
// app's version).

import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import * as SplashScreenNative from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '@/store/auth.store';
import { useAppStore } from '@/store/app.store';
import { useBookmarksStore } from '@/store/bookmarks.store';
import { useHistoryStore } from '@/store/history.store';
import { useTheme } from '@/hooks/useTheme';
import { useAppFonts } from '@/theme/fonts';
import { getToken, getArticleReadCount } from '@/lib/storage';
import { get } from '@/lib/api';
import type { User } from '@/types';
import MaintenanceScreen from '@/components/MaintenanceScreen';
import ForceUpdateScreen from '@/screens/ForceUpdateScreen';
import SideMenu from '@/components/SideMenu';
import SplashOverlay from '@/components/SplashOverlay';
import { registerPushToken, registerGuestPushToken } from '@/lib/push';

SplashScreenNative.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,
    },
  },
});

// "1.2.0" > "1.10.0" etc. — plain string comparison breaks on multi-digit
// segments, so compare numerically per segment.
function isVersionBelow(current: string, minimum: string): boolean {
  const c = current.split('.').map((n) => parseInt(n, 10) || 0);
  const m = minimum.split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(c.length, m.length); i++) {
    const cv = c[i] ?? 0;
    const mv = m[i] ?? 0;
    if (cv < mv) return true;
    if (cv > mv) return false;
  }
  return false;
}

function AppBootstrap({ children }: { children: React.ReactNode }) {
  const { setUser, setAuthenticated, setArticleReadCount } = useAuthStore();
  const { hydrateFromStorage, fetchRemoteConfig, remoteConfig, configLoaded, onboardingDone, hydrated } = useAppStore();
  const { hydrate: hydrateBookmarks } = useBookmarksStore();
  const { hydrate: hydrateHistory } = useHistoryStore();
  const fontsLoaded = useAppFonts();

  useEffect(() => {
    async function bootstrap() {
      try {
        const [token, readCount] = await Promise.all([
          getToken(),
          getArticleReadCount(),
          hydrateFromStorage(),
          hydrateBookmarks(),
          hydrateHistory(),
          fetchRemoteConfig(),
        ]);

        setArticleReadCount(readCount as number);

        // Registers this device for breaking-news push regardless of login
        // state — most installs never log in (login is only required after
        // the free-article limit), so alerts can't be gated on an account.
        registerGuestPushToken();

        if (token) {
          try {
            const res = await get<{ data: User }>('/users/me');
            const user = res.data;
            setUser(user);
            setAuthenticated(true);
            registerPushToken();
          } catch {
            // Token expired or invalid; stays logged out
          }
        }
      } catch {
        // ignore bootstrap errors
      }
    }

    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (hydrated && fontsLoaded && configLoaded) {
      SplashScreenNative.hideAsync().catch(() => {});
    }
  }, [hydrated, fontsLoaded, configLoaded]);

  useEffect(() => {
    if (hydrated && !onboardingDone) {
      router.replace('/onboarding');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, onboardingDone]);

  // Don't mount the navigable screens until fonts are ready — every screen
  // uses Anek Tamil / Noto Sans Tamil / Barlow. SplashOverlay (rendered by
  // the caller regardless of this gate) covers the wait visually.
  if (!fontsLoaded || !hydrated) {
    return <View style={{ flex: 1, backgroundColor: '#F5F1EB' }} />;
  }

  // Block the whole app behind a maintenance screen when the admin flips
  // the "Maintenance Mode" flag in App Config (checked once on launch).
  if (configLoaded && remoteConfig.maintenanceMode) {
    return <MaintenanceScreen />;
  }

  const currentVersion = Constants.expoConfig?.version ?? '1.0.0';
  if (configLoaded && remoteConfig.minSupportedVersion && isVersionBelow(currentVersion, remoteConfig.minSupportedVersion)) {
    return <ForceUpdateScreen />;
  }

  return <>{children}</>;
}

function RootStack() {
  const t = useTheme();

  return (
    <>
    <StatusBar style={t.isDark ? 'light' : 'dark'} />
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: t.surface },
        headerTintColor: t.ink,
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: t.bg },
      }}
    >
      {/* Screens that build their own in-screen header — no native header */}
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="categories" options={{ headerShown: false }} />
      <Stack.Screen name="archive" options={{ headerShown: false }} />
      <Stack.Screen name="post" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="change-number" options={{ headerShown: false }} />
      <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
      <Stack.Screen name="terms" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="language-district" options={{ headerShown: false }} />
      <Stack.Screen name="permission" options={{ headerShown: false }} />
      <Stack.Screen name="report/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="deep-link" options={{ headerShown: false }} />

      {/* Screens with no in-screen header — themed native header */}
      <Stack.Screen
        name="article/[id]"
        options={{
          title: '',
          // Matches the design's "FULL STORY" red label, top-right of the
          // header, on the full article screen.
          headerRight: () => (
            <Text style={{ color: t.red, fontWeight: '800', fontSize: 12, letterSpacing: 0.6 }}>
              FULL STORY
            </Text>
          ),
        }}
      />
      <Stack.Screen name="contact" options={{ title: 'எங்களை தொடர்பு கொள்ள / Contact Us' }} />
      <Stack.Screen name="search" options={{ title: 'தேடல் / Search' }} />
      <Stack.Screen name="bookmarks" options={{ title: 'சேமிப்பு / Saved' }} />
      <Stack.Screen name="profile" options={{ title: 'சுயவிவரம் / Profile' }} />
      <Stack.Screen name="jobs" options={{ title: 'வேலை வாய்ப்பு / Jobs' }} />
      <Stack.Screen name="reels" options={{ title: '', headerTransparent: true }} />
      <Stack.Screen name="notifications" options={{ title: 'அறிவிப்புகள் / Notifications' }} />
      <Stack.Screen name="settings" options={{ title: 'அமைப்புகள் / Settings' }} />
      <Stack.Screen name="reporter/[byline]" options={{ title: '' }} />
    </Stack>
    </>
  );
}

export default function RootLayout() {
  // Screenshot/screen-recording blocking (usePreventScreenCapture, Android
  // FLAG_SECURE) is disabled for now so screenshots can be taken freely
  // during testing — re-enable before a real public release if the anti-
  // piracy protection is wanted back.

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <AppBootstrap>
            <RootStack />
            <SideMenu />
          </AppBootstrap>
          <SplashOverlay />
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
