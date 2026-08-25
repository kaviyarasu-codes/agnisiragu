// src/screens/CategoriesScreen.tsx
// Screen 2g — category grid. "ALL" is a permanently-tinted red card that
// clears any category filter; "தொகு" (edit) toggles a selection mode used to
// mark pinned/followed categories (stored in app.store's selectedCategories,
// which already drives home section ordering elsewhere).

import React, { useState } from 'react';
import { FlatList, View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCategories } from '@/hooks/useCategories';
import { useAppStore } from '@/store/app.store';
import { useTheme } from '@/hooks/useTheme';
import { CAT_COLORS } from '@/theme';
import { FONT_FAMILIES } from '@/constants';
import Icon from '@/components/icons/Icon';
import type { Category } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMNS = 2;
const GAP = 14;
const CARD_SIZE = (SCREEN_WIDTH - 32 - GAP) / COLUMNS;

export default function CategoriesScreen() {
  const t = useTheme();
  const { data: categories, isLoading, isError } = useCategories();
  const { language, selectedCategories, toggleCategory } = useAppStore();
  const [editMode, setEditMode] = useState(false);

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: t.bg }]}>
        <ActivityIndicator size="large" color={t.red} />
      </View>
    );
  }

  if (isError || !categories) {
    return (
      <View style={[styles.center, { backgroundColor: t.bg }]}>
        <Text style={[styles.errorText, { color: t.inkSub }]}>
          பிரிவுகளை ஏற்ற முடியவில்லை{'\n'}Unable to load categories
        </Text>
      </View>
    );
  }

  function goToCategory(categoryId?: string) {
    router.push({ pathname: '/', params: categoryId ? { categoryId } : {} });
  }

  function renderAllCard() {
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: t.red }]}
        onPress={() => (editMode ? undefined : goToCategory(undefined))}
        activeOpacity={0.85}
      >
        <Text style={styles.allIcon}>📰</Text>
        <Text style={styles.cardName} numberOfLines={2}>
          {language === 'ta' ? 'அனைத்தும்' : 'All'}
        </Text>
      </TouchableOpacity>
    );
  }

  function renderItem({ item }: { item: Category }) {
    const name = language === 'ta' ? item.nameTa : item.nameEn;
    const bg = CAT_COLORS[item.slug] ?? CAT_COLORS.default;
    const pinned = selectedCategories.includes(item.id);

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: bg }]}
        onPress={() => (editMode ? toggleCategory(item.id) : goToCategory(item.id))}
        activeOpacity={0.85}
      >
        {editMode && (
          <View style={[styles.pinBadge, pinned && { backgroundColor: '#fff' }]}>
            {pinned && <Icon name="check" size={11} color={bg} strokeWidth={2.4} />}
          </View>
        )}
        {item.iconUrl ? (
          <Image source={{ uri: item.iconUrl }} style={styles.icon} contentFit="contain" />
        ) : (
          <Text style={styles.allIcon}>📰</Text>
        )}
        <Text style={styles.cardName} numberOfLines={2}>{name}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <View style={[styles.header, { borderBottomColor: t.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <Icon name="back" size={17} color={t.ink} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: t.ink, flex: 1 }]}>பிரிவுகள்</Text>
        <TouchableOpacity onPress={() => setEditMode((v) => !v)} hitSlop={10}>
          <Text style={[styles.editLabel, { color: t.red }]}>{editMode ? 'முடிந்தது' : 'தொகு'}</Text>
        </TouchableOpacity>
      </View>

      {editMode && (
        <Text style={[styles.editHint, { color: t.inkMuted }]}>
          உங்களுக்கு பிடித்த பிரிவுகளை தேர்ந்தெடுக்கவும் — முகப்பில் முதலில் தோன்றும்
        </Text>
      )}

      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={COLUMNS}
        ListHeaderComponent={renderAllCard}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.row}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { fontFamily: FONT_FAMILIES.bodyRegular, fontSize: 14, textAlign: 'center', lineHeight: 24 },
  header: {
    height: 52, flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 18, borderBottomWidth: 1,
  },
  headerTitle: { fontFamily: FONT_FAMILIES.displayBold, fontSize: 18 },
  editLabel: { fontFamily: FONT_FAMILIES.displaySemiBold, fontSize: 13.5 },
  editHint: { fontFamily: FONT_FAMILIES.bodyRegular, fontSize: 12, lineHeight: 18, paddingHorizontal: 18, paddingTop: 12 },
  list: { padding: 16, gap: GAP },
  row: { gap: GAP },
  card: {
    width: CARD_SIZE, height: CARD_SIZE * 0.82, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', padding: 14, gap: 8,
  },
  pinBadge: {
    position: 'absolute', top: 9, right: 9, width: 18, height: 18, borderRadius: 9,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.7)', alignItems: 'center', justifyContent: 'center',
  },
  icon: { width: 40, height: 40 },
  allIcon: { fontSize: 32 },
  cardName: {
    color: '#fff', fontFamily: FONT_FAMILIES.displayBold, fontSize: 14, textAlign: 'center', lineHeight: 19,
  },
});
