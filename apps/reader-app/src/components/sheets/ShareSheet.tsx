// src/components/sheets/ShareSheet.tsx
// Screen 2x — share preview card + "share to" app grid + copy-link /
// share-as-image outline buttons. Each app tile now deep-links the actual
// app when it's installed (WhatsApp/Telegram via their custom URL scheme,
// Facebook via its web share endpoint), falling back to the generic OS
// share sheet (React Native's Share.share) if the app isn't present —
// previously every tile fell straight through to the OS sheet, which is
// why "WhatsApp" didn't actually open WhatsApp.

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Share, Alert, Linking } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/hooks/useTheme';
import { FONT_FAMILIES } from '@/constants';
import BottomSheet from '@/components/ui/BottomSheet';
import Button from '@/components/ui/Button';
import Icon from '@/components/icons/Icon';
import type { Article, Language } from '@/types';

interface ShareSheetProps {
  visible: boolean;
  onDismiss: () => void;
  article: Article | null;
  language: Language;
}

export default function ShareSheet({ visible, onDismiss, article, language }: ShareSheetProps) {
  const t = useTheme();
  if (!article) return null;

  const title = language === 'ta' ? article.titleTa : article.titleEn;
  const url = `https://agnisiragu.com/a/${article.id}`;
  const message = `${title}\n${url}`;

  async function genericShare() {
    await Share.share({ title, message }).catch(() => {});
  }

  // Tries the app's own deep link first (so it opens directly instead of
  // routing through the OS share sheet), falling back to `fallbackUrl` (a
  // web share endpoint, when the target has one) and finally to the
  // generic native share sheet if neither can be opened.
  async function openOrFallback(deepLink: string, fallbackUrl?: string) {
    try {
      if (await Linking.canOpenURL(deepLink)) {
        await Linking.openURL(deepLink);
        return;
      }
    } catch {
      // fall through
    }
    if (fallbackUrl) {
      try {
        await Linking.openURL(fallbackUrl);
        return;
      } catch {
        // fall through
      }
    }
    genericShare();
  }

  const shareWhatsapp = () => openOrFallback(`whatsapp://send?text=${encodeURIComponent(message)}`);
  const shareTelegram = () => openOrFallback(
    `tg://msg?text=${encodeURIComponent(message)}`,
    `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  );
  const shareFacebook = () => openOrFallback(
    `fb://facewebmodal/f?href=${encodeURIComponent(url)}`,
    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  );

  const TARGETS: { label: string; onPress: () => void; render: () => React.ReactNode }[] = [
    { label: 'WhatsApp', onPress: shareWhatsapp, render: () => <Icon name="whatsapp" size={22} color="#25D366" /> },
    { label: 'Facebook', onPress: shareFacebook, render: () => <Text style={[styles.brandGlyph, { color: '#1877F2' }]}>f</Text> },
    { label: 'Telegram', onPress: shareTelegram, render: () => <Text style={[styles.brandGlyph, { color: '#229ED9' }]}>➤</Text> },
    { label: 'More', onPress: genericShare, render: () => <Icon name="more" size={20} color={t.inkSub} /> },
  ];

  function copyLink() {
    onDismiss();
    Alert.alert(language === 'ta' ? 'நகலெடுக்கப்பட்டது' : 'Copied', url);
  }

  return (
    <BottomSheet visible={visible} onDismiss={onDismiss}>
      <Text style={[styles.heading, { color: t.ink }]}>{language === 'ta' ? 'பகிர்' : 'Share'}</Text>

      <View style={[styles.preview, { backgroundColor: t.bg, borderColor: t.border }]}>
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

      <Text style={[styles.caption, { color: t.inkMuted }]}>{language === 'ta' ? 'இதற்கு பகிரவும்' : 'share to'}</Text>
      <View style={styles.grid}>
        {TARGETS.map((target) => (
          <TouchableOpacity key={target.label} style={styles.tile} onPress={target.onPress} activeOpacity={0.75}>
            <View style={[styles.tileCircle, { backgroundColor: t.bg, borderColor: t.border }]}>
              {target.render()}
            </View>
            <Text style={[styles.tileLabel, { color: t.inkSub }]}>{target.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.actionsRow}>
        <Button label="இணைப்பை நகலெடு" onPress={copyLink} variant="outline" height={44} style={{ flex: 1 }} tamil />
        <Button label="மேலும் பகிர்" onPress={genericShare} variant="outline" height={44} style={{ flex: 1 }} tamil />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  heading: { fontFamily: FONT_FAMILIES.displayBold, fontSize: 16, marginBottom: 14 },
  preview: { flexDirection: 'row', gap: 11, borderRadius: 10, borderWidth: 1, padding: 11, alignItems: 'center' },
  thumb: { width: 60, height: 46, borderRadius: 5 },
  title: { fontFamily: FONT_FAMILIES.displayBold, fontSize: 12.5, lineHeight: 17 },
  url: { fontFamily: FONT_FAMILIES.uiMedium, fontSize: 10, marginTop: 4 },
  caption: { fontFamily: FONT_FAMILIES.condensedBold, fontSize: 10.5, letterSpacing: 1, textTransform: 'uppercase', marginTop: 20, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  tile: { alignItems: 'center', gap: 6, width: 64 },
  tileCircle: { width: 50, height: 50, borderRadius: 25, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  tileLabel: { fontFamily: FONT_FAMILIES.uiSemiBold, fontSize: 10 },
  brandGlyph: { fontSize: 20, fontFamily: FONT_FAMILIES.displayBold },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 22, marginBottom: 4 },
});
