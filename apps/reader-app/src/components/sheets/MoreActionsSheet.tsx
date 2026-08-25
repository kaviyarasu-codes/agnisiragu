// src/components/sheets/MoreActionsSheet.tsx
// The "more" action sheet from the swipe-feed walkthrough (1a) — report,
// save image, save video, bookmark for offline reading.

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { FONT_FAMILIES } from '@/constants';
import { useBookmarksStore } from '@/store/bookmarks.store';
import BottomSheet from '@/components/ui/BottomSheet';
import Icon, { IconName } from '@/components/icons/Icon';
import type { Article } from '@/types';

interface MoreActionsSheetProps {
  visible: boolean;
  onDismiss: () => void;
  article: Article | null;
}

function Row({ icon, title, subtitle, onPress, color }: { icon: IconName; title: string; subtitle: string; onPress: () => void; color?: string }) {
  const t = useTheme();
  return (
    <TouchableOpacity style={[styles.row, { borderTopColor: t.border }]} onPress={onPress}>
      <Icon name={icon} size={21} color={color ?? t.ink} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, { color: color ?? t.ink }]}>{title}</Text>
        <Text style={[styles.rowSubtitle, { color: t.inkMuted }]}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function MoreActionsSheet({ visible, onDismiss, article }: MoreActionsSheetProps) {
  const { isBookmarked, toggleBookmark } = useBookmarksStore();

  function handleReport() {
    onDismiss();
    if (article) router.push(`/report/${article.id}`);
  }

  function handleSaveImage() {
    onDismiss();
    Alert.alert('படத்தை சேமி', 'Download image — coming soon');
  }

  function handleSaveVideo() {
    onDismiss();
    Alert.alert('வீடியோவை சேமி', 'Download video — coming soon');
  }

  function handleBookmark() {
    if (article) toggleBookmark(article);
    onDismiss();
  }

  return (
    <BottomSheet visible={visible} onDismiss={onDismiss} style={styles.sheet}>
      <Row icon="reportFlag" title="செய்தியை புகார் செய்" subtitle="Report story" onPress={handleReport} color="#CC1F2D" />
      <Row icon="downloadImage" title="படத்தை சேமி" subtitle="Download image" onPress={handleSaveImage} />
      <Row icon="downloadVideo" title="வீடியோவை சேமி" subtitle="Download video" onPress={handleSaveVideo} />
      <Row
        icon="bookmarkNav"
        title={article && isBookmarked(article.id) ? 'சேமிப்பிலிருந்து அகற்று' : 'பின்னர் படிக்க சேமி'}
        subtitle="Bookmark — read offline"
        onPress={handleBookmark}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheet: { paddingTop: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 15, paddingVertical: 11, borderTopWidth: 1 },
  rowTitle: { fontFamily: FONT_FAMILIES.displayBold, fontSize: 14.5 },
  rowSubtitle: { fontFamily: FONT_FAMILIES.uiRegular, fontSize: 11, marginTop: 1 },
});
