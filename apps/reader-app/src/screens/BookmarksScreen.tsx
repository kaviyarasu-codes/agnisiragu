// src/screens/BookmarksScreen.tsx

import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useBookmarksStore } from '@/store/bookmarks.store';
import { useAppStore } from '@/store/app.store';
import { COLORS } from '@/constants';
import ArticleCard from '@/components/ArticleCard';
import type { Article } from '@/types';

export default function BookmarksScreen() {
  const { bookmarks, clearAll } = useBookmarksStore();
  const { language } = useAppStore();

  const handlePress = useCallback((article: Article) => {
    router.push(`/article/${article.id}`);
  }, []);

  function handleClearAll() {
    Alert.alert(
      'சேமிப்புகளை அழி / Clear Bookmarks',
      'அனைத்து சேமிக்கப்பட்ட செய்திகளையும் அகற்றவா?\nRemove all saved articles?',
      [
        { text: 'ரத்து / Cancel', style: 'cancel' },
        {
          text: 'அழி / Clear',
          style: 'destructive',
          onPress: clearAll,
        },
      ],
    );
  }

  if (bookmarks.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🔖</Text>
        <Text style={styles.emptyTitle}>
          சேமிக்கப்பட்ட செய்திகள் இல்லை
        </Text>
        <Text style={styles.emptySubtitle}>
          No saved articles yet
        </Text>
        <Text style={styles.emptyHint}>
          செய்தி அட்டையிலுள்ள 🏷️ ஐ தொட்டு சேமிக்கலாம்{'\n'}
          Tap 🏷️ on any article card to save it here
        </Text>
        <TouchableOpacity
          style={styles.browseButton}
          onPress={() => router.replace('/')}
        >
          <Text style={styles.browseButtonText}>
            செய்திகளை படிக்க / Browse Articles
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={bookmarks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ArticleCard
            article={item}
            onPress={handlePress}
            language={language}
          />
        )}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerCount}>
              {bookmarks.length} செய்தி{bookmarks.length !== 1 ? 'கள்' : ''} சேமிக்கப்பட்டது
            </Text>
            <TouchableOpacity onPress={handleClearAll}>
              <Text style={styles.clearText}>அனைத்தையும் அழி / Clear all</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  list: {
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 4,
  },
  headerCount: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  clearText: {
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 36,
    backgroundColor: COLORS.background,
    gap: 10,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  emptyHint: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  browseButton: {
    marginTop: 12,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 12,
  },
  browseButtonText: {
    color: COLORS.surface,
    fontWeight: '700',
    fontSize: 14,
  },
});
