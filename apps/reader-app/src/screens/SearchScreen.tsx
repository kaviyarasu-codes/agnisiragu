// src/screens/SearchScreen.tsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useSearch } from '@/hooks/useArticles';
import { useCategories } from '@/hooks/useCategories';
import { useAppStore } from '@/store/app.store';
import { COLORS, STORAGE_KEYS, STRINGS } from '@/constants';
import ArticleCard from '@/components/ArticleCard';
import type { Article } from '@/types';

const MAX_RECENT = 8;
const DEBOUNCE_MS = 300;

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
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

  async function saveRecentSearch(term: string) {
    const updated = [term, ...recentSearches.filter((s) => s !== term)].slice(0, MAX_RECENT);
    setRecentSearches(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify(updated));
  }

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

  const showResults = debouncedQuery.length > 1;
  const showRecent = !showResults && recentSearches.length > 0;

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder={language === 'ta' ? 'செய்திகளை தேடுங்கள்...' : 'Search news...'}
          placeholderTextColor={COLORS.textSecondary}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); setDebouncedQuery(''); }} style={styles.clearBtn}>
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Category chips */}
      {showResults && categories && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          <TouchableOpacity
            style={[styles.chip, !selectedCategoryId && styles.activeChip]}
            onPress={() => setSelectedCategoryId(null)}
          >
            <Text style={[styles.chipText, !selectedCategoryId && styles.activeChipText]}>
              {language === 'ta' ? 'அனைத்தும்' : 'All'}
            </Text>
          </TouchableOpacity>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.chip, selectedCategoryId === cat.id && styles.activeChip]}
              onPress={() => setSelectedCategoryId(cat.id)}
            >
              <Text style={[styles.chipText, selectedCategoryId === cat.id && styles.activeChipText]}>
                {language === 'ta' ? cat.nameTa : cat.nameEn}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Recent Searches */}
      {showRecent && (
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>
              {language === 'ta' ? 'சமீபத்திய தேடல்கள்' : 'Recent Searches'}
            </Text>
            <TouchableOpacity onPress={clearRecent}>
              <Text style={styles.clearAllText}>
                {language === 'ta' ? 'அழி' : 'Clear'}
              </Text>
            </TouchableOpacity>
          </View>
          {recentSearches.map((term) => (
            <TouchableOpacity
              key={term}
              style={styles.recentItem}
              onPress={() => applyRecent(term)}
            >
              <Text style={styles.recentItemText}>{term}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Results */}
      {showResults && (
        <>
          {isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator color={COLORS.primary} />
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
              <Text style={styles.emptyText}>
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
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    height: 46,
    color: COLORS.text,
    fontSize: 15,
  },
  clearBtn: {
    padding: 4,
  },
  clearText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  chips: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    gap: 8,
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  activeChipText: {
    color: COLORS.surface,
    fontWeight: '600',
  },
  recentSection: {
    padding: 16,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  clearAllText: {
    fontSize: 13,
    color: COLORS.accent,
    fontWeight: '600',
  },
  recentItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  recentItemText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 26,
  },
});
