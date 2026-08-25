// src/screens/HomeScreen.tsx
// The swipe-feed home shell (design 1a/1d/1e): header with menu / logo /
// search / district chip, over the SwipeFeed card deck.

import React, { useEffect, useState } from 'react';
import { View, Image, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAppStore } from '@/store/app.store';
import { useTheme } from '@/hooks/useTheme';
import { DISTRICTS, FONT_FAMILIES } from '@/constants';
import Icon from '@/components/icons/Icon';
import SwipeFeed from '@/components/feed/SwipeFeed';

export default function HomeScreen() {
  const params = useLocalSearchParams<{ categoryId?: string }>();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const { setSideMenuOpen, district, language } = useAppStore();
  const t = useTheme();

  useEffect(() => {
    if (params.categoryId) setSelectedCategoryId(params.categoryId);
  }, [params.categoryId]);

  const districtMeta = DISTRICTS.find((d) => d.id === district);
  const districtLabel = districtMeta
    ? (language === 'ta' ? districtMeta.nameTa : districtMeta.nameEn).toUpperCase()
    : null;

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <View style={[styles.header, { backgroundColor: t.surface, borderBottomColor: t.border }]}>
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

      <SwipeFeed categoryId={selectedCategoryId ?? undefined} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  iconBtn: { padding: 2 },
  logo: { height: 19, width: 92 },
  districtChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 20, paddingHorizontal: 9, paddingVertical: 5, maxWidth: 130,
  },
  districtDot: { width: 7, height: 7, borderRadius: 3.5 },
  districtText: { fontFamily: FONT_FAMILIES.uiSemiBold, fontSize: 9.5, letterSpacing: 0.7 },
});
