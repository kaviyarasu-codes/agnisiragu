// src/screens/DeepLinkLandingScreen.tsx
// Screen 2aa — deep-link landing/redirect. Most links (agnisiragu://article/…,
// https://agnisiragu.com/article/…) already resolve straight to their target
// route via expo-router's file-based linking config; this screen is the
// fallback for a link shape expo-router can't match directly — e.g. a share
// link carrying `type` + `id` query params instead of a path — so it never
// leaves the reader on a dead screen.

import React, { useEffect } from 'react';
import { View, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';

export default function DeepLinkLandingScreen() {
  const t = useTheme();
  const params = useLocalSearchParams<{ type?: string; id?: string; categoryId?: string; url?: string }>();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (params.type === 'article' && params.id) {
        router.replace(`/article/${params.id}`);
      } else if (params.type === 'category' && params.categoryId) {
        router.replace({ pathname: '/', params: { categoryId: params.categoryId } });
      } else if (params.type === 'reporter' && params.id) {
        router.replace({ pathname: '/reporter/[byline]' as never, params: { byline: params.id } });
      } else {
        router.replace('/');
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [params]);

  return (
    <View style={[styles.container, { backgroundColor: t.surface }]}>
      <Image
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        source={require('../../assets/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <ActivityIndicator color={t.red} style={{ marginTop: 20 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 90, height: 40 },
});
