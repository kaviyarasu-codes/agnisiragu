// src/screens/ArchiveScreen.tsx
// Archive — reachable from the side menu. Search + category chips are wired
// to the real search/feed endpoints; the year/date-range row is UI-only
// (same caveat as SearchScreen's date range) since there's no dateFrom/
// dateTo query param on the backend yet.

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSearch } from '@/hooks/useArticles';
import { useCategories } from '@/hooks/useCategories';
import { useAppStore } from '@/store/app.store';
import { useTheme } from '@/hooks/useTheme';
import { FONT_FAMILIES } from '@/constants';
import ArticleCard from '@/components/ArticleCard';
import Chip from '@/components/ui/Chip';
import Icon from '@/components/icons/Icon';
import EmptyState from '@/components/ui/EmptyState';
import type { Article } from '@/types';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

export default function ArchiveScreen() {
  const t = useTheme();
  const { language } = useAppStore();
  const { data: categories } = useCategories();
  const [query, setQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const { data: results, isLoading } = useSearch(query, selectedCategoryId ?? undefined);

  function handlePress(article: Article) {
    router.push(`/article/${article.id}`);
  }

  const filtered = selectedYear
    ? (results ?? []).filter((a) => new Date(a.publishedAt).getFullYear() === selectedYear)
    : results;

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <View style={[styles.header, { borderBottomColor: t.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <Icon name="back" size={17} color={t.ink} />
        </TouchableOpacity>
        <Icon name="archiveBox" size={17} color={t.ink} />
        <Text style={[styles.headerTitle, { color: t.ink }]}>காப்பகம்</Text>
      </View>

      <View style={[styles.inputRow, { borderColor: t.border, backgroundColor: t.surface }]}>
        <Icon name="search" size={15} color={t.inkMuted} />
        <TextInput
          style={[styles.input, { color: t.ink }]}
          value={query}
          onChangeText={setQuery}
          placeholder={language === 'ta' ? 'காப்பகத்தில் தேடுங்கள்...' : 'Search the archive...'}
          placeholderTextColor={t.inkMuted}
          autoCorrect={false}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip label={language === 'ta' ? 'எல்லா ஆண்டு' : 'All years'} active={!selectedYear} onPress={() => setSelectedYear(null)} style={styles.chip} tamil={language === 'ta'} />
        {YEARS.map((y) => (
          <Chip key={y} label={String(y)} active={selectedYear === y} onPress={() => setSelectedYear(y)} style={styles.chip} tamil={false} />
        ))}
      </ScrollView>

      {categories && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Chip label={language === 'ta' ? 'அனைத்தும்' : 'All'} active={!selectedCategoryId} onPress={() => setSelectedCategoryId(null)} style={styles.chip} />
          {categories.map((cat) => (
            <Chip
              key={cat.id}
              label={language === 'ta' ? cat.nameTa : cat.nameEn}
              active={selectedCategoryId === cat.id}
              onPress={() => setSelectedCategoryId(cat.id)}
              style={styles.chip}
            />
          ))}
        </ScrollView>
      )}

      {isLoading ? (
        <View style={styles.center}><ActivityIndicator color={t.red} /></View>
      ) : query.length > 1 && filtered && filtered.length > 0 ? (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ArticleCard article={item} onPress={handlePress} language={language} />}
          contentContainerStyle={{ paddingVertical: 8 }}
        />
      ) : query.length > 1 ? (
        <EmptyState
          icon="archiveBox"
          title={language === 'ta' ? 'முடிவுகள் இல்லை' : 'No results'}
          description={language === 'ta' ? 'வேறு வார்த்தை அல்லது வடிகட்டியை முயற்சிக்கவும்' : 'Try a different keyword or filter'}
        />
      ) : (
        <EmptyState
          icon="archiveBox"
          title={language === 'ta' ? 'காப்பகத்தில் தேடுங்கள்' : 'Search the archive'}
          description={language === 'ta' ? 'பழைய செய்திகளை மீண்டும் காண தேடல் சொல்லை உள்ளிடவும்' : 'Enter a keyword to find older published articles'}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { height: 52, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, borderBottomWidth: 1 },
  headerTitle: { fontFamily: FONT_FAMILIES.displayBold, fontSize: 17 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 9, margin: 16, marginBottom: 10,
    borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14, height: 46,
  },
  input: { flex: 1, fontSize: 14.5, fontFamily: FONT_FAMILIES.uiRegular },
  chips: { paddingHorizontal: 16, paddingBottom: 10, gap: 8, flexDirection: 'row' },
  chip: { paddingVertical: 6 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
