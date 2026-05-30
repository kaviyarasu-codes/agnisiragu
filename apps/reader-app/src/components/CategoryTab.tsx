// src/components/CategoryTab.tsx

import React from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
} from 'react-native';
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
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        <TouchableOpacity
          style={[styles.tab, !selectedId && styles.activeTab]}
          onPress={() => onSelect(null)}
        >
          <Text style={[styles.tabText, !selectedId && styles.activeTabText]}>
            {language === 'ta' ? 'அனைத்தும்' : 'All'}
          </Text>
        </TouchableOpacity>

        {categories.map((cat) => {
          const isActive = selectedId === cat.id;
          const name = language === 'ta' ? cat.nameTa : cat.nameEn;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[styles.tab, isActive && styles.activeTab]}
              onPress={() => onSelect(cat.id)}
            >
              <Text style={[styles.tabText, isActive && styles.activeTabText]}>{name}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  container: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    flexDirection: 'row',
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: COLORS.surface,
    fontWeight: '600',
  },
});
