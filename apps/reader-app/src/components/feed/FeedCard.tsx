// src/components/feed/FeedCard.tsx
// One slide in the Home swipe feed (screen 1a's card content) — photo top,
// category/time meta, headline, a body preview, and a byline row. A second
// export renders the ad interstitial slide that SwipeFeed inserts every
// `adInFeedFrequency` articles.

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/hooks/useTheme';
import { FONT_FAMILIES } from '@/constants';
import { useLocalAds } from '@/hooks/useLocalAds';
import LocalAdCard from '@/components/LocalAdCard';
import Avatar from '@/components/ui/Avatar';
import type { Article, Language } from '@/types';

function timeAgo(dateString: string): string {
  const m = Math.floor((Date.now() - new Date(dateString).getTime()) / 60000);
  if (m < 1) return 'இப்போது';
  if (m < 60) return `${m} நிமிடம் முன்`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} மணி முன்`;
  return `${Math.floor(h / 24)} நாள் முன்`;
}

interface FeedCardProps {
  article: Article;
  language: Language;
  index: number;
  total: number;
  width: number;
  onOpen: () => void;
}

export function ArticleFeedCard({ article, language, index, total, width, onOpen }: FeedCardProps) {
  const t = useTheme();
  const title = language === 'ta' ? article.titleTa : article.titleEn;
  const body = language === 'ta' ? article.bodyTa : article.bodyEn;
  const catName = language === 'ta' ? article.category.nameTa : article.category.nameEn;

  return (
    <TouchableOpacity
      activeOpacity={0.96}
      onPress={onOpen}
      style={[styles.card, { width, backgroundColor: t.surface, borderColor: t.border }]}
    >
      {article.thumbnailUrl ? (
        <Image source={{ uri: article.thumbnailUrl }} style={styles.image} contentFit="cover" transition={250} />
      ) : (
        <View style={[styles.image, { backgroundColor: t.bgAlt }]} />
      )}
      <View style={styles.body}>
        <View style={styles.metaRow}>
          <Text style={[styles.cat, { color: t.red }]} numberOfLines={1}>{catName?.toUpperCase()}</Text>
          <View style={[styles.dot, { backgroundColor: t.border }]} />
          <Text style={[styles.time, { color: t.inkMuted }]}>{timeAgo(article.publishedAt)}</Text>
          <View style={{ flex: 1 }} />
          <Text style={[styles.page, { color: t.inkMuted }]}>{index + 1} / {total}</Text>
        </View>
        <Text style={[styles.title, { color: t.ink }]} numberOfLines={3}>{title}</Text>
        <Text style={[styles.excerpt, { color: t.inkSub }]} numberOfLines={4}>{body}</Text>
        <View style={{ flex: 1 }} />
        <View style={[styles.byline, { borderTopColor: t.border }]}>
          <Avatar name={article.byline || 'Agnisiragu'} size={22} />
          <Text style={[styles.bylineText, { color: t.inkSub }]} numberOfLines={1}>
            {article.byline?.trim() ? article.byline : 'அக்னிசிறகு டெஸ்க்'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function AdFeedCard({ width }: { width: number }) {
  const t = useTheme();
  const { data: ads } = useLocalAds();
  const ad = ads?.[0];

  return (
    <View style={[styles.card, styles.adCard, { width, backgroundColor: t.surface, borderColor: t.border }]}>
      {ad ? (
        <LocalAdCard ad={ad} language="ta" style={styles.adInner} />
      ) : (
        <View style={styles.adFallback}>
          <Text style={[styles.adLabel, { color: t.inkMuted }]}>ADVERTISEMENT</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: '100%',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  image: { width: '100%', height: '42%' },
  body: { flex: 1, padding: 15, paddingTop: 13 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  cat: { fontFamily: FONT_FAMILIES.displaySemiBold, fontSize: 11, letterSpacing: 0.5 },
  dot: { width: 3, height: 3, borderRadius: 1.5 },
  time: { fontFamily: FONT_FAMILIES.bodyRegular, fontSize: 11 },
  page: { fontFamily: FONT_FAMILIES.uiSemiBold, fontSize: 9.5, letterSpacing: 0.6 },
  title: { fontFamily: FONT_FAMILIES.displayBold, fontSize: 21, lineHeight: 27, letterSpacing: -0.2 },
  excerpt: { fontFamily: FONT_FAMILIES.bodyRegular, fontSize: 14.5, lineHeight: 25, marginTop: 9 },
  byline: {
    flexDirection: 'row', alignItems: 'center', gap: 9,
    borderTopWidth: 1, paddingTop: 10, marginTop: 10,
  },
  bylineText: { fontFamily: FONT_FAMILIES.displaySemiBold, fontSize: 12.5, flex: 1 },
  adCard: { justifyContent: 'center' },
  adInner: { margin: 0, borderWidth: 0, flex: 1, height: '100%', flexDirection: 'column' },
  adFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  adLabel: { fontFamily: FONT_FAMILIES.condensedBold, fontSize: 11, letterSpacing: 2 },
});
