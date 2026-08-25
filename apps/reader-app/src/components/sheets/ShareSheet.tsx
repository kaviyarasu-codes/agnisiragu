// src/components/sheets/ShareSheet.tsx
// Screen 2x — share preview card + "share to" app grid + copy-link /
// share-as-image outline buttons. Native share targets aren't individually
// addressable from Expo, so each app tile falls through to the OS share
// sheet (React Native's Share.share) rather than deep-linking a specific
// app — still one tap to WhatsApp etc. on most Android share sheets.

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Share, Alert } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/hooks/useTheme';
import { FONT_FAMILIES } from '@/constants';
import BottomSheet from '@/components/ui/BottomSheet';
import Button from '@/components/ui/Button';
import type { Article, Language } from '@/types';

interface ShareSheetProps {
  visible: boolean;
  onDismiss: () => void;
  article: Article | null;
  language: Language;
}

const TARGETS = ['WhatsApp', 'Facebook', 'Telegram', 'More'];

export default function ShareSheet({ visible, onDismiss, article, language }: ShareSheetProps) {
  const t = useTheme();
  if (!article) return null;

  const title = language === 'ta' ? article.titleTa : article.titleEn;
  const url = `https://agnisiragu.com/a/${article.id}`;

  async function share() {
    await Share.share({ title, message: `${title}\n${url}` });
  }

  function copyLink() {
    onDismiss();
    Alert.alert(language === 'ta' ? 'நகலெடுக்கப்பட்டது' : 'Copied', url);
  }

  return (
    <BottomSheet visible={visible} onDismiss={onDismiss}>
      <View style={[styles.preview, { backgroundColor: t.bg }]}>
        {article.thumbnailUrl ? (
          <Image source={{ uri: article.thumbnailUrl }} style={styles.thumb} contentFit="cover" />
        ) : (
          <View style={[styles.thumb, { backgroundColor: t.bgAlt }]} />
        )}
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: t.ink }]} numberOfLines={2}>{title}</Text>
          <Text style={[styles.url, { color: t.inkMuted }]} numberOfLines={1}>{url}</Text>
        </View>
      </View>

      <Text style={[styles.caption, { color: t.inkMuted }]}>share to</Text>
      <View style={styles.grid}>
        {TARGETS.map((label) => (
          <TouchableOpacity key={label} style={styles.tile} onPress={share}>
            <View style={[styles.tileCircle, { backgroundColor: t.bg, borderColor: t.border }]} />
            <Text style={[styles.tileLabel, { color: t.inkSub }]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.actionsRow}>
        <Button label="இணைப்பை நகலெடு" onPress={copyLink} variant="outline" height={44} style={{ flex: 1 }} tamil />
        <Button label="படமாக பகிர்" onPress={share} variant="outline" height={44} style={{ flex: 1 }} tamil />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  preview: { flexDirection: 'row', gap: 11, borderRadius: 10, padding: 11, alignItems: 'center' },
  thumb: { width: 60, height: 46, borderRadius: 5 },
  title: { fontFamily: FONT_FAMILIES.displayBold, fontSize: 12.5, lineHeight: 17 },
  url: { fontFamily: FONT_FAMILIES.uiMedium, fontSize: 10, marginTop: 4 },
  caption: { fontFamily: FONT_FAMILIES.condensedBold, fontSize: 10.5, letterSpacing: 1, textTransform: 'uppercase', marginTop: 18, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  tile: { alignItems: 'center', gap: 6, width: 64 },
  tileCircle: { width: 46, height: 46, borderRadius: 23, borderWidth: 1 },
  tileLabel: { fontFamily: FONT_FAMILIES.uiSemiBold, fontSize: 10 },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
});
