// src/components/feed/FeedCard.tsx
// One slide in the Home swipe feed (screen 1a's card content) — a fixed
// photo pinned at the top (see FEED_IMAGE_HEIGHT_FRACTION, shared with
// SwipeFeed's swipe-down-to-refresh gesture region), with the byline,
// meta, headline, and full body text scrolling underneath it in their own
// ScrollView — so a long story can be read right inside the card without
// leaving the feed. Tapping the image, the headline, or the trailing
// "Read full story" link still opens the full immersive article screen. A
// second export renders the ad interstitial slide that SwipeFeed inserts
// every `adInFeedFrequency` articles.

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { FONT_FAMILIES } from '@/constants';
import { useLocalAds } from '@/hooks/useLocalAds';
import SponsoredFeedCard from './SponsoredFeedCard';
import Avatar from '@/components/ui/Avatar';
import MediaCarousel from './MediaCarousel';
import ActionBar, { type ActionBarProps } from './ActionBar';
import { stripHtmlToPlainText } from '@/lib/richText';
import type { Article, Language } from '@/types';

// The fraction of the card's height the fixed image occupies — exported so
// SwipeFeed can size its swipe-down-to-refresh overlay to match exactly
// (that overlay only covers the fixed image region, so it never competes
// with this card's own text ScrollView for vertical drags).
export const FEED_IMAGE_HEIGHT_FRACTION = 0.36;

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
  actionBar: ActionBarProps;
}

export function ArticleFeedCard({ article, language, index, total, width, onOpen, actionBar }: FeedCardProps) {
  const t = useTheme();
  const title = language === 'ta' ? article.titleTa : article.titleEn;
  const rawBody = language === 'ta' ? article.bodyTa : article.bodyEn;
  const body = article.excerpt ? article.excerpt : stripHtmlToPlainText(rawBody);
  const catName = language === 'ta' ? article.category.nameTa : article.category.nameEn;

  return (
    <View style={[styles.card, { width, backgroundColor: t.surface }]}>
      {/* Fixed image — no scrim/gradient, shows the photo directly. Tapping
          it opens the full immersive article screen. */}
      <TouchableOpacity activeOpacity={0.96} onPress={onOpen} style={styles.imageWrap}>
        <MediaCarousel mediaUrls={article.mediaUrls} thumbnailUrl={article.thumbnailUrl} />
      </TouchableOpacity>

      {/* Everything below the image scrolls on its own — the image above
          stays put while the reader scrolls through the full story right
          here in the feed. */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        <View style={styles.bylineRow}>
          <Avatar name={article.byline || 'Agnisiragu'} size={22} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.bylineText, { color: t.ink }]} numberOfLines={1}>
              {article.byline?.trim() ? article.byline : 'அக்னிசிறகு டெஸ்க்'}
            </Text>
            <Text style={[styles.bylineTag, { color: t.inkMuted }]}>உள்ளூர் நிருபர்</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Text style={[styles.cat, { color: t.red }]} numberOfLines={1}>{catName?.toUpperCase()}</Text>
          <View style={[styles.dot, { backgroundColor: t.border }]} />
          <Text style={[styles.time, { color: t.inkMuted }]}>{timeAgo(article.publishedAt)}</Text>
          <View style={{ flex: 1 }} />
          <Text style={[styles.page, { color: t.inkMuted }]}>{index + 1} / {total}</Text>
        </View>

        <TouchableOpacity activeOpacity={0.75} onPress={onOpen}>
          <Text style={[styles.title, { color: t.ink }]}>{title}</Text>
        </TouchableOpacity>

        <Text style={[styles.excerpt, { color: t.inkSub }]}>{body}</Text>

        <TouchableOpacity activeOpacity={0.7} onPress={onOpen} style={styles.readMore}>
          <Text style={[styles.readMoreText, { color: t.red }]}>முழு செய்தி படிக்க / Read full story →</Text>
        </TouchableOpacity>
      </ScrollView>

      <ActionBar {...actionBar} />
    </View>
  );
}

export function AdFeedCard({ width }: { width: number }) {
  const t = useTheme();
  const { data: ads } = useLocalAds();
  const ad = ads?.[0];

  if (ad) {
    return <SponsoredFeedCard ad={ad} language="ta" width={width} />;
  }

  return (
    <View style={[styles.card, styles.adCard, { width, backgroundColor: t.surface, borderColor: t.border }]}>
      <View style={styles.adFallback}>
        <Text style={[styles.adLabel, { color: t.inkMuted }]}>ADVERTISEMENT</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Edge-to-edge, no border/radius/outer margin — full device width, no
  // visible background gaps around the card (matches the Way2News-style
  // full-bleed reference).
  card: {
    height: '100%',
    overflow: 'hidden',
  },
  image: { width: '100%', height: `${FEED_IMAGE_HEIGHT_FRACTION * 100}%` },
  imageWrap: { width: '100%', height: `${FEED_IMAGE_HEIGHT_FRACTION * 100}%`, position: 'relative' },
  body: { flex: 1 },
  bodyContent: { padding: 15, paddingTop: 13, paddingBottom: 28 },
  bylineRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  bylineText: { fontFamily: FONT_FAMILIES.displaySemiBold, fontSize: 12.5 },
  bylineTag: { fontFamily: FONT_FAMILIES.uiRegular, fontSize: 10, marginTop: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  cat: { fontFamily: FONT_FAMILIES.displaySemiBold, fontSize: 11, letterSpacing: 0.5 },
  dot: { width: 3, height: 3, borderRadius: 1.5 },
  time: { fontFamily: FONT_FAMILIES.bodyRegular, fontSize: 11 },
  page: { fontFamily: FONT_FAMILIES.uiSemiBold, fontSize: 9.5, letterSpacing: 0.6 },
  title: { fontFamily: FONT_FAMILIES.displayBold, fontSize: 21, lineHeight: 27, letterSpacing: -0.2 },
  excerpt: { fontFamily: FONT_FAMILIES.bodyRegular, fontSize: 14.5, lineHeight: 25, marginTop: 9 },
  readMore: { marginTop: 16, paddingVertical: 4 },
  readMoreText: { fontFamily: FONT_FAMILIES.uiBold, fontSize: 13 },
  adCard: { justifyContent: 'center' },
  adInner: { margin: 0, borderWidth: 0, flex: 1, height: '100%', flexDirection: 'column' },
  adFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  adLabel: { fontFamily: FONT_FAMILIES.condensedBold, fontSize: 11, letterSpacing: 2 },
});
