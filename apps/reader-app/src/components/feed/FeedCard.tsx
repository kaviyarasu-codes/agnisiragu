// src/components/feed/FeedCard.tsx
// One slide in the Home swipe feed (screen 1a's card content) — a fixed
// photo pinned at the top (see FEED_IMAGE_HEIGHT_FRACTION, shared with
// SwipeFeed's swipe-down-to-refresh gesture region), with the byline,
// meta, headline, and full body text scrolling underneath it in their own
// ScrollView. There is no separate "Full Story" screen reachable from
// here anymore — this card IS the full story; the reader gets the whole
// article by scrolling right here in the feed. (Comments still live on a
// dedicated screen, reached only via the ActionBar's comment icon — there's
// no comment UI inline in the feed.) A second export renders the ad
// interstitial slide that SwipeFeed inserts every `adInFeedFrequency`
// articles.

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

// Relative time ("12 நிமிடம் முன்") for anything published within the last
// 24 hours; a plain date beyond that — matching how most news apps avoid
// vague-forever "3 நாள் முன் / 3 days ago" labels for older stories.
function formatPublished(dateString: string, language: Language): string {
  const published = new Date(dateString);
  const minutes = Math.floor((Date.now() - published.getTime()) / 60000);

  if (minutes < 1440) {
    if (minutes < 1) return language === 'ta' ? 'இப்போது' : 'Just now';
    if (minutes < 60) return language === 'ta' ? `${minutes} நிமிடம் முன்` : `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return language === 'ta' ? `${hours} மணி முன்` : `${hours}h ago`;
  }

  const sameYear = published.getFullYear() === new Date().getFullYear();
  return published.toLocaleDateString(language === 'ta' ? 'ta-IN' : 'en-IN', {
    day: 'numeric',
    month: 'short',
    year: sameYear ? undefined : 'numeric',
  });
}

interface FeedCardProps {
  article: Article;
  language: Language;
  index: number;
  total: number;
  width: number;
  actionBar: ActionBarProps;
}

export function ArticleFeedCard({ article, language, index, total, width, actionBar }: FeedCardProps) {
  const t = useTheme();
  const title = language === 'ta' ? article.titleTa : article.titleEn;
  const rawBody = language === 'ta' ? article.bodyTa : article.bodyEn;
  const body = article.excerpt ? article.excerpt : stripHtmlToPlainText(rawBody);
  const catName = language === 'ta' ? article.category.nameTa : article.category.nameEn;
  const byline = article.byline?.trim() || 'அக்னிசிறகு டெஸ்க்';

  // Follow status — same AsyncStorage key ArticleDetailScreen and
  // ReporterProfileScreen use, so following a reporter stays in sync
  // wherever their byline shows up. Local-only for now; no
  // follow-a-reporter backend endpoint yet.
  const [following, setFollowing] = useState(false);
  const followKey = `followed_reporter_${byline}`;
  useEffect(() => {
    AsyncStorage.getItem(followKey).then((v) => setFollowing(v === '1'));
  }, [followKey]);

  async function toggleFollow() {
    const next = !following;
    setFollowing(next);
    await AsyncStorage.setItem(followKey, next ? '1' : '0');
  }

  return (
    <View style={[styles.card, { width, backgroundColor: t.surface }]}>
      {/* Fixed image — no scrim/gradient, shows the photo directly. No
          longer tappable to "open" anything; the gallery's own tap-zones
          (left/right halves, see MediaCarousel) still work for stories with
          more than one photo/video. */}
      <View style={styles.imageWrap}>
        <MediaCarousel mediaUrls={article.mediaUrls} thumbnailUrl={article.thumbnailUrl} />
      </View>

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
          <Avatar name={byline} size={22} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.bylineText, { color: t.ink }]} numberOfLines={1}>{byline}</Text>
            <Text style={[styles.bylineTag, { color: t.inkMuted }]}>உள்ளூர் நிருபர்</Text>
          </View>
          <TouchableOpacity
            onPress={toggleFollow}
            hitSlop={6}
            style={[styles.followBtn, { borderColor: t.red, backgroundColor: following ? t.red : 'transparent' }]}
          >
            <Text style={[styles.followText, { color: following ? '#fff' : t.red }]}>
              {following ? 'பின்தொடர்கிறீர்கள்' : 'பின்தொடர்'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.metaRow}>
          <Text style={[styles.cat, { color: t.red }]} numberOfLines={1}>{catName?.toUpperCase()}</Text>
          <View style={[styles.dot, { backgroundColor: t.border }]} />
          <Text style={[styles.time, { color: t.inkMuted }]}>{formatPublished(article.publishedAt, language)}</Text>
          <View style={{ flex: 1 }} />
          <Text style={[styles.page, { color: t.inkMuted }]}>{index + 1} / {total}</Text>
        </View>

        <Text style={[styles.title, { color: t.ink }]}>{title}</Text>

        <Text style={[styles.excerpt, { color: t.inkSub }]}>{body}</Text>
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
  followBtn: { borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  followText: { fontFamily: FONT_FAMILIES.displayBold, fontSize: 11.5 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  cat: { fontFamily: FONT_FAMILIES.displaySemiBold, fontSize: 11, letterSpacing: 0.5 },
  dot: { width: 3, height: 3, borderRadius: 1.5 },
  time: { fontFamily: FONT_FAMILIES.bodyRegular, fontSize: 11 },
  page: { fontFamily: FONT_FAMILIES.uiSemiBold, fontSize: 9.5, letterSpacing: 0.6 },
  title: { fontFamily: FONT_FAMILIES.displayBold, fontSize: 21, lineHeight: 27, letterSpacing: -0.2 },
  excerpt: { fontFamily: FONT_FAMILIES.bodyRegular, fontSize: 14.5, lineHeight: 25, marginTop: 9 },
  adCard: { justifyContent: 'center' },
  adInner: { margin: 0, borderWidth: 0, flex: 1, height: '100%', flexDirection: 'column' },
  adFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  adLabel: { fontFamily: FONT_FAMILIES.condensedBold, fontSize: 11, letterSpacing: 2 },
});
