// src/screens/HomeScreen.tsx
// The swipe-feed home shell (design 1a/1d/1e): header with menu / logo /
// search / district chip, over an admin-configurable stack of sections
// (breaking / categories / feed — App Config → Home Layout / Widgets)
// above the SwipeFeed card deck.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Image, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/store/app.store';
import { useTheme } from '@/hooks/useTheme';
import { useCategories } from '@/hooks/useCategories';
import { useBreakingNews } from '@/hooks/useArticles';
import { FONT_FAMILIES } from '@/constants';
import Icon from '@/components/icons/Icon';
import SwipeFeed from '@/components/feed/SwipeFeed';
import CategoryTab from '@/components/CategoryTab';
import BreakingNewsCarousel from '@/components/BreakingNewsCarousel';

export default function HomeScreen() {
  const params = useLocalSearchParams<{ categoryId?: string }>();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const { setSideMenuOpen, district, language, remoteConfig } = useAppStore();
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { data: categories = [] } = useCategories();
  const { data: breakingArticles = [] } = useBreakingNews();

  // Explicit, always-visible "reload feed" button — the swipe-down gesture
  // on SwipeFeed's image zone already refetches, but it's easy to miss
  // (readers reported no obvious way to pull new articles). Invalidating
  // by key prefix hits every mounted `useArticles` variant (all categories)
  // plus breaking news, so SwipeFeed's own existing refetch/loading UI
  // takes over from here once the query is marked stale.
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!refreshing) {
      spinValue.stopAnimation();
      spinValue.setValue(0);
      return;
    }
    spinValue.setValue(0);
    const anim = Animated.loop(
      Animated.timing(spinValue, { toValue: 1, duration: 700, easing: Easing.linear, useNativeDriver: true }),
    );
    anim.start();
    return () => anim.stop();
  }, [refreshing, spinValue]);

  async function handleRefresh() {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['articles'] }),
        qc.invalidateQueries({ queryKey: ['breaking-news'] }),
      ]);
    } finally {
      setRefreshing(false);
    }
  }

  const spin = spinValue.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  useEffect(() => {
    if (params.categoryId) setSelectedCategoryId(params.categoryId);
  }, [params.categoryId]);

  const districtMeta = remoteConfig.districts.find((d) => d.id === district);
  const districtLabel = districtMeta
    ? (language === 'ta' ? districtMeta.nameTa : districtMeta.nameEn).toUpperCase()
    : null;

  // App Config → Home Layout: pinned categories (in the order chosen in the
  // admin panel) come first, then the rest keep their normal displayOrder.
  const orderedCategories = useMemo(() => {
    const pinned = remoteConfig.pinnedCategorySlugs;
    if (!pinned.length) return categories;
    const bySlug = new Map(categories.map((c) => [c.slug, c]));
    const pinnedCats = pinned.map((slug) => bySlug.get(slug)).filter((c): c is (typeof categories)[number] => !!c);
    const pinnedIds = new Set(pinnedCats.map((c) => c.id));
    return [...pinnedCats, ...categories.filter((c) => !pinnedIds.has(c.id))];
  }, [categories, remoteConfig.pinnedCategorySlugs]);

  // Both "Home Layout → Breaking News Bar" and "Widgets → Breaking News
  // Banner" toggle the same carousel — either one off hides it.
  const showBreaking = remoteConfig.homeShowBreakingBar && remoteConfig.widgetBreakingBanner && breakingArticles.length > 0;
  const showCategoryTabs = remoteConfig.widgetCategoryTabs;

  const sections: Record<string, React.ReactNode> = {
    breaking: showBreaking ? (
      <BreakingNewsCarousel key="breaking" articles={breakingArticles} language={language} mode={remoteConfig.homeHeroStyle} />
    ) : null,
    categories: showCategoryTabs ? (
      <CategoryTab
        key="categories"
        categories={orderedCategories}
        selectedId={selectedCategoryId}
        onSelect={setSelectedCategoryId}
        language={language}
        showSeeAll={remoteConfig.newsShowSeeAll}
      />
    ) : null,
    // The feed itself isn't independently toggleable — it's the screen's
    // reason for being — but its position in the stack still follows
    // homeSectionOrder same as the other two.
    feed: <SwipeFeed key="feed" categoryId={selectedCategoryId ?? undefined} />,
  };

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <View style={[styles.header, { backgroundColor: t.surface, borderBottomColor: t.border, paddingTop: insets.top, paddingBottom: 8 }]}>
        <TouchableOpacity onPress={() => setSideMenuOpen(true)} hitSlop={10} style={styles.iconBtn}>
          <Icon name="menu" size={17} color={t.ink} />
        </TouchableOpacity>
        <Image
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          source={require('../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={() => router.push('/search')} hitSlop={10} style={styles.iconBtn}>
          <Icon name="search" size={16} color={t.inkSub} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleRefresh} disabled={refreshing} hitSlop={10} style={styles.iconBtn}>
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Icon name="refresh" size={16} color={t.inkSub} />
          </Animated.View>
        </TouchableOpacity>
        {districtLabel ? (
          <TouchableOpacity
            style={[styles.districtChip, { backgroundColor: t.bg }]}
            onPress={() => router.push('/language-district')}
          >
            <View style={[styles.districtDot, { backgroundColor: t.red }]} />
            <Text style={[styles.districtText, { color: t.inkSub }]} numberOfLines={1}>{districtLabel}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {remoteConfig.homeSectionOrder.map((key) => sections[key] ?? null)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  iconBtn: { padding: 2 },
  logo: { height: 30, width: 68 },
  districtChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 20, paddingHorizontal: 9, paddingVertical: 5, maxWidth: 130,
  },
  districtDot: { width: 7, height: 7, borderRadius: 3.5 },
  districtText: { fontFamily: FONT_FAMILIES.uiSemiBold, fontSize: 9.5, letterSpacing: 0.7 },
});
