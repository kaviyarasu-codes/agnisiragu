// src/screens/CategoriesScreen.tsx

import React from 'react';
import {
  FlatList,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCategories } from '@/hooks/useCategories';
import { useAppStore } from '@/store/app.store';
import { COLORS } from '@/constants';
import type { Category } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMNS = 2;
const CARD_SIZE = (SCREEN_WIDTH - 48) / COLUMNS;

const CATEGORY_COLORS = [
  '#1E3A5F',
  '#E63946',
  '#3B82F6',
  '#10B981',
  '#8B5CF6',
  '#F59E0B',
  '#06B6D4',
  '#EF4444',
  '#14B8A6',
  '#F97316',
];

export default function CategoriesScreen() {
  const { data: categories, isLoading, isError } = useCategories();
  const { language } = useAppStore();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (isError || !categories) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          பிரிவுகளை ஏற்ற முடியவில்லை{'\n'}Unable to load categories
        </Text>
      </View>
    );
  }

  function renderItem({ item, index }: { item: Category; index: number }) {
    const name = language === 'ta' ? item.nameTa : item.nameEn;
    const bgColor = CATEGORY_COLORS[index % CATEGORY_COLORS.length];

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: bgColor }]}
        onPress={() => router.push(`/?categoryId=${item.id}`)}
        activeOpacity={0.85}
      >
        {item.iconUrl ? (
          <Image source={{ uri: item.iconUrl }} style={styles.icon} contentFit="contain" />
        ) : (
          <Text style={styles.iconPlaceholder}>📰</Text>
        )}
        <Text style={styles.categoryName} numberOfLines={2}>
          {name}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={COLUMNS}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.row}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    padding: 24,
  },
  errorText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
  },
  list: {
    padding: 16,
    gap: 16,
  },
  row: {
    gap: 16,
  },
  card: {
    width: CARD_SIZE,
    height: CARD_SIZE * 0.85,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 10,
  },
  icon: {
    width: 48,
    height: 48,
  },
  iconPlaceholder: {
    fontSize: 36,
  },
  categoryName: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 20,
  },
});
