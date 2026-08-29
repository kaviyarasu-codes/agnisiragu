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

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, AppState } from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import * as SplashScreenNative from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query';
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
import {
  getLastNotificationResponseAsync,
  addNotificationResponseReceivedListener,
} from '@/lib/notificationsCompat';

SplashScreenNative.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,
    },
  },
});

// React Query's default focusManager listens for the browser's
// `visibilitychange` event, which never fires in React Native — so
// "refetch on window focus" (what makes a stale feed re-fetch when the user
// comes back to the app) silently never happened on any screen, on any
// query, in this app. This was the real cause behind "there is no reload or
// refresh for new news articles": articles fetched more than staleTime ago
// just sat there forever until the app was fully force-closed and relaunched
// (a fresh mount refetches regardless). Wiring AppState in makes RN's actual
// foreground/background transitions drive the same focus-refetch behavior
// every screen already opts into via staleTime.
focusManager.setEventListener((handleFocus) => {
  const sub = AppState.addEventListener('change', (state) => {
    handleFocus(state === 'active');
  });
  return () => sub.remove();
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

  // Safety net for the "stuck on splash forever" report: hydrateFromStorage
  // and fetchRemoteConfig both already guarantee their own flags via
  // finally/catch, so a rejected promise there isn't the issue. What isn't
  // guarded is a promise that never SETTLES at all — e.g. expo-font's
  // useFonts() only exposes `loaded` (the `error` slot is ignored below and
  // upstream), and SecureStore/AsyncStorage calls are known to occasionally
  // hang rather than reject on some Android OEM Keystore implementations,
  // especially right after a fresh install. Neither case is caught by a
  // try/catch since nothing ever throws — the awaited promise just never
  // resolves, and previously nothing ever un-stuck the splash screen when
  // that happened. Force everything "ready" after a timeout so the app can
  // never hang here indefinitely — worst case it opens once with default
  // language/theme/config instead of the saved ones, which is far better
  // than requiring a force-close.
  const [forceReady, setForceReady] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setForceReady(true), 6000);
    return () => clearTimeout(timer);
  }, []);

  // Notification tap → open the linked article. Two cases: cold start (the
  // notification tap launched the app process — checked once via
  // getLastNotificationResponseAsync) and warm (the app was already running,
  // in foreground or background — the listener fires live). Both existed as
  // dead weight before this: breaking-news pushes already sent
  // data.articleId, and the admin panel's Compose Notification can now
  // attach one too, but nothing ever read it back out on the device.
  // Navigation is deferred until the app has actually finished booting
  // (fonts/hydration/config, or the forceReady timeout) since the root Stack
  // isn't mounted before then; isReadyRef avoids a stale closure since the
  // listener is registered once on mount.
  const isReady = (hydrated && fontsLoaded && configLoaded) || forceReady;
  const isReadyRef = useRef(isReady);
  useEffect(() => { isReadyRef.current = isReady; }, [isReady]);
  const pendingArticleIdRef = useRef<string | null>(null);

  useEffect(() => {
    function openLinkedArticle(articleId: string) {
      if (isReadyRef.current) {
        router.push(`/article/${articleId}`);
      } else {
        pendingArticleIdRef.current = articleId;
      }
    }

    function handleResponse(response: { notification: { request: { content: { data?: unknown } } } }) {
      const data = response.notification.request.content.data as { articleId?: string } | undefined;
      if (data?.articleId) openLinkedArticle(data.articleId);
    }

    getLastNotificationResponseAsync().then((response) => {
      if (response) handleResponse(response);
    });

    const sub = addNotificationResponseReceivedListener(handleResponse);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (isReady && pendingArticleIdRef.current) {
      const id = pendingArticleIdRef.current;
      pendingArticleIdRef.current = null;
      router.push(`/article/${id}`);
    }
  }, [isReady]);

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
    if (isReady) {
      SplashScreenNative.hideAsync().catch(() => {});
    }
  }, [isReady]);

  useEffect(() => {
    if (hydrated && !onboardingDone) {
      router.replace('/onboarding');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, onboardingDone]);

  // Don't mount the navigable screens until fonts are ready — every screen
  // uses Anek Tamil / Noto Sans Tamil / Barlow. SplashOverlay (rendered by
  // the caller regardless of this gate) covers the wait visually. forceReady
  // overrides this after the timeout above so the app is never stuck here.
  if ((!fontsLoaded || !hydrated) && !forceReady) {
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
