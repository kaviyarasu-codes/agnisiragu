// src/screens/SearchScreen.tsx
// Screen 2h — search with filter-type chips (word/reporter/location) and an
// optional date range. Only the free-text `q` + `categoryId` params are
// wired to a real endpoint (GET /news/search) — reporter/location/date-range
// are UI-only until the backend adds matching query params, same as the
// comments section on the article screen; they don't affect the request.

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useSearch } from '@/hooks/useArticles';
import { useCategories } from '@/hooks/useCategories';
import { useAppStore } from '@/store/app.store';
import { useTheme } from '@/hooks/useTheme';
import { STORAGE_KEYS, STRINGS, FONT_FAMILIES } from '@/constants';
import ArticleCard from '@/components/ArticleCard';
import Chip from '@/components/ui/Chip';
import Icon from '@/components/icons/Icon';
import type { Article } from '@/types';

const MAX_RECENT = 8;
const DEBOUNCE_MS = 300;

type FilterType = 'word' | 'reporter' | 'location';
const FILTER_TYPES: { key: FilterType; ta: string; en: string }[] = [
  { key: 'word', ta: 'வார்த்தை', en: 'Word' },
  { key: 'reporter', ta: 'நிருபர்', en: 'Reporter' },
  { key: 'location', ta: 'இடம்', en: 'Location' },
];

export default function SearchScreen() {
  const t = useTheme();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('word');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [showDateRange, setShowDateRange] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { language } = useAppStore();
  const { data: categories } = useCategories();
  const { data: results, isLoading } = useSearch(debouncedQuery, selectedCategoryId ?? undefined);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.RECENT_SEARCHES).then((raw) => {
      if (raw) setRecentSearches(JSON.parse(raw) as string[]);
    });
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const saveRecentSearch = useCallback(async (term: string) => {
    setRecentSearches((prev) => {
      const updated = [term, ...prev.filter((s) => s !== term)].slice(0, MAX_RECENT);
      AsyncStorage.setItem(STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  function handleArticlePress(article: Article) {
    saveRecentSearch(debouncedQuery);
    router.push(`/article/${article.id}`);
  }

  function applyRecent(term: string) {
    setQuery(term);
    setDebouncedQuery(term);
  }

  async function clearRecent() {
    setRecentSearches([]);
    await AsyncStorage.removeItem(STORAGE_KEYS.RECENT_SEARCHES);
  }

  const placeholder =
    filterType === 'reporter'
      ? (language === 'ta' ? 'நிருபர் பெயரால் தேடுங்கள்...' : 'Search by reporter...')
      : filterType === 'location'
        ? (language === 'ta' ? 'இடம் / மாவட்டத்தால் தேடுங்கள்...' : 'Search by location...')
        : (language === 'ta' ? 'செய்திகளை தேடுங்கள்...' : 'Search news...');

  const showResults = debouncedQuery.length > 1;
  const showRecent = !showResults && recentSearches.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <View style={[styles.inputRow, { borderColor: t.border, backgroundColor: t.surface }]}>
        <Icon name="search" size={16} color={t.inkMuted} />
        <TextInput
          style={[styles.input, { color: t.ink }]}
          value={query}
          onChangeText={setQuery}
          placeholder={placeholder}
          placeholderTextColor={t.inkMuted}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); setDebouncedQuery(''); }} style={styles.clearBtn} hitSlop={8}>
            <Icon name="close" size={12} color={t.inkMuted} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterTypeRow}>
        {FILTER_TYPES.map((f) => (
          <Chip
            key={f.key}
            label={language === 'ta' ? f.ta : f.en}
            active={filterType === f.key}
            activeStyle="outline"
            onPress={() => setFilterType(f.key)}
            style={styles.filterChip}
          />
        ))}
        <TouchableOpacity
          style={[styles.dateToggle, { borderColor: showDateRange ? t.ink900 : t.border }]}
          onPress={() => setShowDateRange((v) => !v)}
        >
          <Icon name="calendar" size={13} color={showDateRange ? t.ink : t.inkMuted} />
        </TouchableOpacity>
      </View>

      {showDateRange && (
        <View style={styles.dateRow}>
          <TextInput
            style={[styles.dateField, { borderColor: t.border, color: t.ink }]}
            value={dateFrom}
            onChangeText={setDateFrom}
            placeholder={language === 'ta' ? 'இருந்து (DD/MM/YYYY)' : 'From (DD/MM/YYYY)'}
            placeholderTextColor={t.inkMuted}
          />
          <TextInput
            style={[styles.dateField, { borderColor: t.border, color: t.ink }]}
            value={dateTo}
            onChangeText={setDateTo}
            placeholder={language === 'ta' ? 'வரை (DD/MM/YYYY)' : 'To (DD/MM/YYYY)'}
            placeholderTextColor={t.inkMuted}
          />
        </View>
      )}

      {showResults && categories && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Chip
            label={language === 'ta' ? 'அனைத்தும்' : 'All'}
            active={!selectedCategoryId}
            onPress={() => setSelectedCategoryId(null)}
            style={styles.catChip}
          />
          {categories.map((cat) => (
            <Chip
              key={cat.id}
              label={language === 'ta' ? cat.nameTa : cat.nameEn}
              active={selectedCategoryId === cat.id}
              onPress={() => setSelectedCategoryId(cat.id)}
              style={styles.catChip}
            />
          ))}
        </ScrollView>
      )}

      {showRecent && (
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={[styles.recentTitle, { color: t.ink }]}>
              {language === 'ta' ? 'சமீபத்திய தேடல்கள்' : 'Recent Searches'}
            </Text>
            <TouchableOpacity onPress={clearRecent}>
              <Text style={[styles.clearAllText, { color: t.red }]}>{language === 'ta' ? 'அழி' : 'Clear'}</Text>
            </TouchableOpacity>
          </View>
          {recentSearches.map((term) => (
            <TouchableOpacity key={term} style={[styles.recentItem, { borderBottomColor: t.border }]} onPress={() => applyRecent(term)}>
              <Text style={[styles.recentItemText, { color: t.inkSub }]}>{term}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {showResults && (
        <>
          {isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator color={t.red} />
            </View>
          ) : results && results.length > 0 ? (
            <FlatList
              data={results}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <ArticleCard article={item} onPress={handleArticlePress} language={language} />
              )}
              contentContainerStyle={{ paddingVertical: 8 }}
            />
          ) : (
            <View style={styles.center}>
              <Text style={[styles.emptyText, { color: t.inkSub }]}>
                {STRINGS.NO_RESULTS_TA}{'\n'}{STRINGS.NO_RESULTS_EN}
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 9, margin: 16, marginBottom: 12,
    borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14,
  },
  input: { flex: 1, height: 46, fontSize: 15, fontFamily: FONT_FAMILIES.uiRegular },
  clearBtn: { padding: 4 },
  filterTypeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingBottom: 10 },
  filterChip: { paddingVertical: 6 },
  dateToggle: {
    marginLeft: 'auto', width: 32, height: 32, borderRadius: 16, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  dateRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingBottom: 12 },
  dateField: {
    flex: 1, height: 40, borderWidth: 1, borderRadius: 9, paddingHorizontal: 12,
    fontSize: 12.5, fontFamily: FONT_FAMILIES.uiRegular,
  },
  chips: { paddingHorizontal: 12, paddingBottom: 10, gap: 8, flexDirection: 'row' },
  catChip: { paddingVertical: 6 },
  recentSection: { padding: 16 },
  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  recentTitle: { fontSize: 14, fontFamily: FONT_FAMILIES.displaySemiBold },
  clearAllText: { fontSize: 13, fontFamily: FONT_FAMILIES.displaySemiBold },
  recentItem: { paddingVertical: 10, borderBottomWidth: 1 },
  recentItemText: { fontSize: 14, fontFamily: FONT_FAMILIES.bodyRegular },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyText: { fontSize: 15, textAlign: 'center', lineHeight: 26, fontFamily: FONT_FAMILIES.bodyRegular },
});
