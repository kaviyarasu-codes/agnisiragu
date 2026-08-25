// src/screens/ReelsScreen.tsx
// Screen 2l — full-screen vertical video reels. There's no video content
// type on Article yet (thumbnailUrl is the only media field) and no reels
// endpoint, so this ships as an honest "coming soon" placeholder rather than
// a reel player with nothing to play. Swap for a real vertical FlatList +
// video player once the backend has a reels/shorts endpoint.

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useAppStore } from '@/store/app.store';
import { useTheme } from '@/hooks/useTheme';
import EmptyState from '@/components/ui/EmptyState';

export default function ReelsScreen() {
  const t = useTheme();
  const { language } = useAppStore();

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <EmptyState
        icon="play"
        title={language === 'ta' ? 'ரீல்ஸ் விரைவில்' : 'Reels coming soon'}
        description={
          language === 'ta'
            ? 'குறும்படங்கள் மற்றும் நேரலை காணொளிகளுக்கான புதிய பகுதி விரைவில் வரும்'
            : 'Short-form video news is on the way for a future update'
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
