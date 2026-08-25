// src/components/LoginGateModal.tsx
// Restyled per design screen 2d — bottom sheet with a free-articles
// progress bar, shown once the reader has used up FREE_ARTICLE_LIMIT.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/auth.store';
import { useAppStore } from '@/store/app.store';
import { FREE_ARTICLE_LIMIT, FONT_FAMILIES } from '@/constants';
import BottomSheet from '@/components/ui/BottomSheet';
import Button from '@/components/ui/Button';

interface LoginGateModalProps {
  visible: boolean;
  onDismiss: () => void;
}

export default function LoginGateModal({ visible, onDismiss }: LoginGateModalProps) {
  const t = useTheme();
  const { articleReadCount } = useAuthStore();
  const { remoteConfig } = useAppStore();
  const limit = remoteConfig.loginGate ? (remoteConfig.freeArticleLimit || FREE_ARTICLE_LIMIT) : FREE_ARTICLE_LIMIT;
  const used = Math.min(articleReadCount, limit);

  function handleLogin() {
    onDismiss();
    router.push('/login');
  }

  return (
    <BottomSheet visible={visible} onDismiss={onDismiss}>
      <Text style={[styles.heading, { color: t.ink }]}>படிக்கத் தொடரவும்</Text>
      <Text style={[styles.message, { color: t.inkSub }]}>
        {limit} செய்திகள் இலவசம். மேலும் படிக்க உள்நுழையவும்.
      </Text>

      <View style={styles.progressRow}>
        <View style={[styles.progressTrack, { backgroundColor: t.bgAlt }]}>
          <View style={[styles.progressFill, { backgroundColor: t.red, width: `${(used / limit) * 100}%` }]} />
        </View>
        <Text style={[styles.progressLabel, { color: t.red }]}>{used} / {limit}</Text>
      </View>

      <Button label="தொலைபேசியில் உள்நுழைய" onPress={handleLogin} style={styles.loginBtn} />
      <Text style={[styles.later, { color: t.inkMuted }]} onPress={onDismiss}>பின்னர் பார்க்கிறேன்</Text>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  heading: { fontFamily: FONT_FAMILIES.displayExtraBold, fontSize: 21, letterSpacing: -0.3 },
  message: { fontFamily: FONT_FAMILIES.bodyRegular, fontSize: 13.5, lineHeight: 22, marginTop: 7 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, marginBottom: 18 },
  progressTrack: { flex: 1, height: 5, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressLabel: { fontFamily: FONT_FAMILIES.uiBold, fontSize: 11 },
  loginBtn: { width: '100%' },
  later: { fontFamily: FONT_FAMILIES.bodyRegular, fontSize: 12.5, textAlign: 'center', marginTop: 14 },
});
