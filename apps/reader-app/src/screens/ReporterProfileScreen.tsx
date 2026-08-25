// src/screens/ReporterProfileScreen.tsx
// Screen 2k — reporter profile. There's no reporter-profile or
// articles-by-reporter endpoint yet (Article only carries a free-text
// `byline`), so this screen takes a `byline` route param, filters the
// general feed client-side for matching bylines, and treats stats/follow as
// local placeholders pending the Reporter App backend module.

import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useArticles } from '@/hooks/useArticles';
import { useAppStore } from '@/store/app.store';
import { useTheme } from '@/hooks/useTheme';
import { FONT_FAMILIES } from '@/constants';
import ArticleCard from '@/components/ArticleCard';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import type { Article } from '@/types';

export default function ReporterProfileScreen() {
  const t = useTheme();
  const { language } = useAppStore();
  const params = useLocalSearchParams<{ byline?: string }>();
  const byline = params.byline ?? '';
  const [following, setFollowing] = useState(false);
  const followKey = `followed_reporter_${byline}`;

  useEffect(() => {
    if (!byline) return;
    AsyncStorage.getItem(followKey).then((v) => setFollowing(v === '1'));
  }, [byline, followKey]);

  async function toggleFollow() {
    const next = !following;
    setFollowing(next);
    // Local-only — no follow-a-reporter endpoint yet.
    await AsyncStorage.setItem(followKey, next ? '1' : '0');
  }

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useArticles();
  const articles = useMemo(
    () => (data?.pages.flatMap((p) => p.data) ?? []).filter((a) => a.byline === byline),
    [data, byline],
  );

  function handlePress(article: Article) {
    router.push(`/article/${article.id}`);
  }

  if (!byline) {
    return (
      <View style={[styles.center, { backgroundColor: t.bg }]}>
        <Text style={{ color: t.inkSub, fontFamily: FONT_FAMILIES.bodyRegular }}>
          {language === 'ta' ? 'நிருபர் தகவல் இல்லை' : 'Reporter not found'}
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      style={{ backgroundColor: t.bg }}
      data={articles}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <ArticleCard article={item} onPress={handlePress} language={language} />}
      onEndReached={() => { if (hasNextPage) fetchNextPage(); }}
      onEndReachedThreshold={0.4}
      ListHeaderComponent={
        <View style={[styles.headerCard, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Avatar name={byline} size={72} />
          <Text style={[styles.name, { color: t.ink }]}>{byline}</Text>
          <Text style={[styles.role, { color: t.inkMuted }]}>
            {language === 'ta' ? 'குடிமக்கள் நிருபர்' : 'CITIZEN REPORTER'}
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: t.ink }]}>{articles.length}</Text>
              <Text style={[styles.statLabel, { color: t.inkMuted }]}>
                {language === 'ta' ? 'செய்திகள்' : 'ARTICLES'}
              </Text>
            </View>
          </View>

          <Button
            label={following ? (language === 'ta' ? 'பின்தொடர்கிறீர்கள்' : 'Following') : (language === 'ta' ? 'பின்தொடர' : 'Follow')}
            variant={following ? 'outline' : 'dark'}
            onPress={toggleFollow}
            style={{ width: '100%', marginTop: 18 }}
          />
        </View>
      }
      ListFooterComponent={isFetchingNextPage ? <ActivityIndicator style={{ marginVertical: 16 }} color={t.red} /> : null}
      ListEmptyComponent={
        isLoading ? (
          <View style={styles.center}><ActivityIndicator color={t.red} /></View>
        ) : (
          <View style={styles.center}>
            <Text style={{ color: t.inkMuted, fontFamily: FONT_FAMILIES.bodyRegular }}>
              {language === 'ta' ? 'இன்னும் செய்திகள் இல்லை' : 'No published articles yet'}
            </Text>
          </View>
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  headerCard: { margin: 16, borderRadius: 14, borderWidth: 1, padding: 22, alignItems: 'center' },
  name: { fontFamily: FONT_FAMILIES.displayBold, fontSize: 19, marginTop: 12 },
  role: { fontFamily: FONT_FAMILIES.condensedBold, fontSize: 11, letterSpacing: 1, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 28, marginTop: 18 },
  statItem: { alignItems: 'center' },
  statValue: { fontFamily: FONT_FAMILIES.uiBold, fontSize: 20 },
  statLabel: { fontFamily: FONT_FAMILIES.condensedBold, fontSize: 10, letterSpacing: 1, marginTop: 2 },
});
