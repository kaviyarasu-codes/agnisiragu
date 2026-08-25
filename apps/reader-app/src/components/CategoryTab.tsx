// src/components/CategoryTab.tsx
// Restyled to the redesign's pill chips + FONT_FAMILIES; "See All" now
// routes to the top-level /categories route (tabs group removed in Task 10).

import React from 'react';
import { ScrollView, TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { FONT_FAMILIES } from '@/constants';
import type { Category, Language } from '@/types';

interface CategoryTabProps {
  categories: Category[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  language: Language;
  showSeeAll?: boolean;
}

export default function CategoryTab({ categories, selectedId, onSelect, language, showSeeAll = true }: CategoryTabProps) {
  const t = useTheme();

  return (
    <View style={[s.wrapper, { backgroundColor: t.surface, borderBottomColor: t.border }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row}>
        {[{ id: null, nameTa: 'அனைத்தும்', nameEn: 'All', slug: '' }, ...categories].map((cat) => {
          const isActive = selectedId === cat.id;
          const name = language === 'ta' ? cat.nameTa : cat.nameEn;
          return (
            <TouchableOpacity
              key={cat.id ?? 'all'}
              style={[s.tab, { borderColor: isActive ? t.red : t.border }, isActive && { backgroundColor: t.red }]}
              onPress={() => onSelect(cat.id ?? null)}
              activeOpacity={0.8}
            >
              <Text style={[s.label, { color: isActive ? '#fff' : t.inkSub }]}>{name}</Text>
            </TouchableOpacity>
          );
        })}
        {showSeeAll && (
          <TouchableOpacity style={s.seeAll} onPress={() => router.push('/categories')} activeOpacity={0.8}>
            <Text style={[s.seeAllLabel, { color: t.red }]}>
              {language === 'ta' ? 'அனைத்தும் →' : 'See All →'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: { borderBottomWidth: 1, paddingVertical: 10 },
  row: { paddingHorizontal: 12, flexDirection: 'row', gap: 8, alignItems: 'center' },
  tab: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5 },
  label: { fontFamily: FONT_FAMILIES.displaySemiBold, fontSize: 13 },
  seeAll: { paddingHorizontal: 10, paddingVertical: 7 },
  seeAllLabel: { fontFamily: FONT_FAMILIES.displaySemiBold, fontSize: 13 },
});
