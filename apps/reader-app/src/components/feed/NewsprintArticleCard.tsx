// src/components/feed/NewsprintArticleCard.tsx
// Design screen "1c" — headline-first newsprint order (headline, photo,
// body, byline pinned bottom). Previously this layout only existed as
// SponsoredFeedCard (bound to the LocalAd shape, for sponsored slots). This
// is the same visual treatment adapted for a real Article, selectable by an
// admin via the Card Style checkboxes (Article.cardStyle = NEWSPRINT) — see
// SwipeFeed.tsx's resolveCardStyle().

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/hooks/useTheme';
import { FONT_FAMILIES } from '@/constants';
import ImageWatermark from './ImageWatermark';
import ActionBar, { type ActionBarProps } from './ActionBar';
import { stripHtmlToPlainText } from '@/lib/richText';
import type { Article, Language } from '@/types';

interface Props {
  article: Article;
  language: Language;
  width: number;
  onOpen: () => void;
  actionBar: ActionBarProps;
}

export default function NewsprintArticleCard({ article, language, width, onOpen, actionBar }: Props) {
  const t = useTheme();
  const title = language === 'ta' ? article.titleTa : article.titleEn;
  const body = article.excerpt || stripHtmlToPlainText(language === 'ta' ? article.bodyTa : article.bodyEn);
  const catLabel = (language === 'ta' ? article.category?.nameTa : article.category?.nameEn) ?? '';

  return (
    <TouchableOpacity
      activeOpacity={0.96}
      onPress={onOpen}
      style={[styles.card, { width, backgroundColor: t.bg, borderColor: t.border }]}
    >
      <View style={styles.inner}>
        <Text style={[styles.catLabel, { color: t.inkMuted }]} numberOfLines={1}>
          {catLabel.toUpperCase()}
        </Text>
        <Text style={[styles.title, { color: t.ink }]} numberOfLines={3}>{title}</Text>

        <View style={styles.imageWrap}>
          {article.thumbnailUrl ? (
            <Image source={{ uri: article.thumbnailUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: t.bgAlt }]} />
          )}
          <ImageWatermark />
        </View>

        <Text style={[styles.desc, { color: t.inkSub }]} numberOfLines={5}>{body}</Text>

        <View style={{ flex: 1 }} />

        <View style={[styles.footer, { borderTopColor: t.border }]}>
          <Text style={[styles.byline, { color: t.inkMuted }]} numberOfLines={1}>
            {article.byline || 'Agnisiragu'}
          </Text>
        </View>
      </View>
      <ActionBar {...actionBar} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    height: '100%',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  inner: { flex: 1, padding: 15 },
  catLabel: {
    fontFamily: FONT_FAMILIES.condensedBold,
    fontSize: 10.5,
    letterSpacing: 1,
    marginBottom: 6,
  },
  title: {
    fontFamily: FONT_FAMILIES.displayBold,
    fontSize: 21,
    lineHeight: 27,
    letterSpacing: -0.2,
  },
  image: { width: '100%', height: 130, borderRadius: 8, marginTop: 12 },
  imageWrap: {
    width: '100%', height: 130, borderRadius: 8, marginTop: 12,
    position: 'relative', overflow: 'hidden',
  },
  desc: {
    fontFamily: FONT_FAMILIES.bodyRegular,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 10,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 10,
  },
  byline: { flex: 1, fontFamily: FONT_FAMILIES.displaySemiBold, fontSize: 12 },
});
