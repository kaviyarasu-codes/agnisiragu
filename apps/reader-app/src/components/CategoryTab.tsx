// src/components/CategoryTab.tsx

import React from 'react';
import { ScrollView, TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { COLORS } from '@/constants';
import type { Category, Language } from '@/types';

interface CategoryTabProps {
  categories: Category[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  language: Language;
}

export default function CategoryTab({ categories, selectedId, onSelect, language }: CategoryTabProps) {
  return (
    <View style={styles.wrapper}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
        <TouchableOpacity style={styles.tab} onPress={() => onSelect(null)}>
          <Text style={[styles.label, !selectedId && styles.labelActive]}>
            {language === 'ta' ? 'அனைத்தும்' : 'All'}
          </Text>
          {!selectedId && <View style={styles.underline} />}
        </TouchableOpacity>
        {categories.map((cat) => {
          const isActive = selectedId === cat.id;
          const name = language === 'ta' ? cat.nameTa : cat.nameEn;
          return (
            <TouchableOpacity key={cat.id} style={styles.tab} onPress={() => onSelect(cat.id)}>
              <Text style={[styles.label, isActive && styles.labelActive]}>{name}</Text>
              {isActive && <View style={styles.underline} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  container: {
    paddingHorizontal: 14,
    flexDirection: 'row',
    gap: 4,
  },
  tab: {
    paddingHorizontal: 10,
    paddingTop: 12,
    paddingBottom: 0,
    alignItems: 'center',
    minWidth: 48,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.inkLight,
    paddingBottom: 10,
  },
  labelActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  underline: {
    height: 2.5,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    alignSelf: 'stretch',
    marginTop: -2,
  },
});
