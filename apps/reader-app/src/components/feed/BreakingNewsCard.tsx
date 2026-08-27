// src/components/feed/BreakingNewsCard.tsx
// Design screen "1b" — Card B: full-bleed photo, headline over the image.
// Used for isBreaking articles automatically, and also selectable directly
// by an admin via the Card Style checkboxes in the admin panel (Article.
// cardStyle = FULL_BLEED) — see SwipeFeed.tsx's resolveCardStyle(). The
// "BREAKING" chip only shows when the article is actually flagged breaking,
// so an admin picking this layout purely for its visual drama on a non-
// breaking story doesn't get a misleading badge.

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/hooks/useTheme';
import { FONT_FAMILIES } from '@/constants';
import { stripHtmlToPlainText } from '@/lib/richText';
import type { Article, Language } from '@/types';

interface Props {
  article: Article;
  language: Language;
  width: number;
  onOpen: () => void;
}

export default function BreakingNewsCard({ article, language, width, onOpen }: Props) {
  const t = useTheme();
  const title = language === 'ta' ? article.titleTa : article.titleEn;
  const rawBody = language === 'ta' ? article.bodyTa : article.bodyEn;
  const body = article.excerpt || stripHtmlToPlainText(rawBody);

  return (
    <TouchableOpacity activeOpacity={0.96} onPress={onOpen} style={[styles.card, { width }]}>
      {article.thumbnailUrl ? (
        <Image source={{ uri: article.thumbnailUrl }} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: t.bgAlt }]} />
      )}

      {/* Stepped scrim standing in for a bottom-to-top gradient, darkest at
          the text, fading toward the top of the photo. */}
      <View style={[styles.scrimBand, { height: '30%', bottom: 0, backgroundColor: 'rgba(28,25,23,0.82)' }]} />
      <View style={[styles.scrimBand, { height: '55%', bottom: 0, backgroundColor: 'rgba(28,25,23,0.45)' }]} />
      <View style={[styles.scrimBand, { height: '78%', bottom: 0, backgroundColor: 'rgba(28,25,23,0.18)' }]} />

      {article.isBreaking && (
        <View style={styles.topRow}>
          <View style={styles.breakingChip}>
            <Text style={styles.breakingChipText}>{language === 'ta' ? 'உடனடி' : 'BREAKING'}</Text>
          </View>
        </View>
      )}

      <View style={styles.textWrap}>
        <Text style={styles.catLabel} numberOfLines={1}>
          {(language === 'ta' ? article.category.nameTa : article.category.nameEn)?.toUpperCase()}
        </Text>
        <Text style={styles.title} numberOfLines={3}>{title}</Text>
        <Text style={styles.excerpt} numberOfLines={2}>{body}</Text>
        <View style={styles.hintRow}>
          <Text style={styles.hint}>{language === 'ta' ? 'ஸ்வைப் →' : 'swipe →'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    height: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  scrimBand: { position: 'absolute', left: 0, right: 0 },
  topRow: { position: 'absolute', top: 12, left: 12 },
  breakingChip: {
    backgroundColor: '#CC1F2D',
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  breakingChipText: {
    color: '#fff',
    fontFamily: FONT_FAMILIES.condensedBold,
    fontSize: 10.5,
    letterSpacing: 1,
  },
  textWrap: { position: 'absolute', left: 16, right: 16, bottom: 16 },
  catLabel: {
    color: '#E9B84A',
    fontFamily: FONT_FAMILIES.displaySemiBold,
    fontSize: 11,
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  title: {
    color: '#fff',
    fontFamily: FONT_FAMILIES.displayBold,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.2,
  },
  excerpt: {
    color: 'rgba(255,255,255,0.78)',
    fontFamily: FONT_FAMILIES.bodyRegular,
    fontSize: 13.5,
    lineHeight: 20,
    marginTop: 8,
  },
  hintRow: { marginTop: 10 },
  hint: {
    color: 'rgba(255,255,255,0.6)',
    fontFamily: FONT_FAMILIES.uiSemiBold,
    fontSize: 10.5,
    letterSpacing: 0.5,
  },
});
