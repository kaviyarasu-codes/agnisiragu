// src/screens/BookmarksScreen.tsx
// Screen 2p — restyled with the shared EmptyState shell; list/clear-all
// logic unchanged from the original screen.

import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBookmarksStore } from '@/store/bookmarks.store';
import { useAppStore } from '@/store/app.store';
import { useTheme } from '@/hooks/useTheme';
import { FONT_FAMILIES, STRINGS } from '@/constants';
import ArticleCard from '@/components/ArticleCard';
import EmptyState from '@/components/ui/EmptyState';
import type { Article } from '@/types';

export default function BookmarksScreen() {
  const t = useTheme();
  const { bookmarks, clearAll } = useBookmarksStore();
  const { language } = useAppStore();
  const insets = useSafeAreaInsets();

  const handlePress = useCallback((article: Article) => {
    router.push(`/article/${article.id}`);
  }, []);

  function handleClearAll() {
    Alert.alert(
      language === 'ta' ? 'சேமிப்புகளை அழி' : 'Clear Bookmarks',
      language === 'ta' ? 'அனைத்து சேமிக்கப்பட்ட செய்திகளையும் அகற்றவா?' : 'Remove all saved articles?',
      [
        { text: language === 'ta' ? 'ரத்து' : 'Cancel', style: 'cancel' },
        { text: language === 'ta' ? 'அழி' : 'Clear', style: 'destructive', onPress: clearAll },
      ],
    );
  }

  if (bookmarks.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        <EmptyState
          icon="bookmarkLarge"
          title={language === 'ta' ? 'சேமிக்கப்பட்ட செய்திகள் இல்லை' : 'No saved articles yet'}
          description={
            language === 'ta'
              ? 'செய்தி அட்டையிலுள்ள சேமி பொத்தானை தொட்டு இங்கு சேர்க்கலாம்'
              : 'Tap Save on any article card to keep it here'
          }
          ctaLabel={STRINGS.HOME_TA + ' / ' + STRINGS.HOME_EN}
          onCta={() => router.replace('/')}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <FlatList
        data={bookmarks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ArticleCard article={item} onPress={handlePress} language={language} />}
        ListHeaderComponent={
          <View style={[styles.header, { backgroundColor: t.surface, borderBottomColor: t.border }]}>
            <Text style={[styles.headerCount, { color: t.ink }]}>
              {bookmarks.length} {language === 'ta' ? `செய்தி${bookmarks.length !== 1 ? 'கள்' : ''} சேமிக்கப்பட்டது` : 'saved'}
            </Text>
            <TouchableOpacity onPress={handleClearAll}>
              <Text style={[styles.clearText, { color: t.red }]}>{language === 'ta' ? 'அனைத்தையும் அழி' : 'Clear all'}</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={[styles.list, { paddingBottom: 32 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingBottom: 32 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, marginBottom: 4,
  },
  headerCount: { fontFamily: FONT_FAMILIES.displaySemiBold, fontSize: 13 },
  clearText: { fontFamily: FONT_FAMILIES.displaySemiBold, fontSize: 12 },
});
