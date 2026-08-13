// src/components/CategoryTab.tsx

import React from 'react';
import { ScrollView, TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
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
              style={[s.tab, isActive && { backgroundColor: t.red }]}
              onPress={() => onSelect(cat.id ?? null)}
              activeOpacity={0.8}
            >
              <Text style={[s.label, { color: isActive ? '#fff' : t.inkSub }]}>
                {name}
              </Text>
            </TouchableOpacity>
          );
        })}
        {showSeeAll && (
          <TouchableOpacity
            style={s.seeAll}
            onPress={() => router.push('/(tabs)/categories')}
            activeOpacity={0.8}
          >
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
  wrapper: {
    borderBottomWidth: 1,
    paddingVertical: 10,
  },
  row: {
    paddingHorizontal: 12,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
  seeAll: {
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  seeAllLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
});
