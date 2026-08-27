// src/screens/PermissionRequestScreen.tsx
// Screen 2z — soft pre-permission screen shown once, right after setup and
// before the OS notification prompt (so the actual system dialog only ever
// appears after the reader has already said yes here).

import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { requestPermissionsAsync } from '@/lib/notificationsCompat';
import { useAppStore } from '@/store/app.store';
import { useTheme } from '@/hooks/useTheme';
import { FONT_FAMILIES, STORAGE_KEYS } from '@/constants';
import * as SecureStore from 'expo-secure-store';
import Icon from '@/components/icons/Icon';
import Button from '@/components/ui/Button';
import { registerGuestPushToken } from '@/lib/push';

const BULLETS = [
  { label: 'அவசர செய்தி எச்சரிக்கை', on: true },
  { label: 'உங்கள் ஊர் செய்திகள்', on: true },
  { label: 'விளம்பரம் இல்லை', on: false },
];

export default function PermissionRequestScreen() {
  const t = useTheme();
  const { completeOnboarding } = useAppStore();
  const [busy, setBusy] = useState(false);
  const insets = useSafeAreaInsets();

  function finish() {
    completeOnboarding();
    router.replace('/');
  }

  async function grant() {
    setBusy(true);
    try {
      await requestPermissionsAsync();
      await registerGuestPushToken();
    } catch {
      // best-effort
    } finally {
      await SecureStore.setItemAsync(STORAGE_KEYS.NOTIF_PERMISSION_ASKED, '1').catch(() => {});
      setBusy(false);
      finish();
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: t.surface, paddingTop: 60 + insets.top, paddingBottom: 24 + insets.bottom }]}>
      <Icon name="permissionBell" size={46} color={t.red} />
      <Text style={[styles.title, { color: t.ink }]}>முக்கிய செய்திகளை உடனே அறியுங்கள்</Text>
      <Text style={[styles.desc, { color: t.inkSub }]}>
        உங்கள் மாவட்டத்தில் அவசர செய்தி வரும்போது மட்டும் அறிவிப்பு அனுப்புவோம். நாளொன்றுக்கு 2–3 மட்டுமே.
      </Text>

      <View style={styles.bullets}>
        {BULLETS.map((b) => (
          <View key={b.label} style={styles.bulletRow}>
            <View style={[styles.bulletDot, { backgroundColor: b.on ? t.red : t.border }]} />
            <Text style={[styles.bulletLabel, { color: b.on ? t.inkSub : t.inkMuted }]}>{b.label}</Text>
          </View>
        ))}
      </View>

      <Button label="அனுமதி அளி" onPress={grant} loading={busy} style={{ width: '100%', marginTop: 28 }} />
      <Text style={[styles.skip, { color: t.inkMuted }]} onPress={finish}>இப்போது வேண்டாம்</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  title: { fontFamily: FONT_FAMILIES.displayExtraBold, fontSize: 22, lineHeight: 28, marginTop: 24, letterSpacing: -0.3 },
  desc: { fontFamily: FONT_FAMILIES.bodyRegular, fontSize: 13.5, lineHeight: 24, marginTop: 10 },
  bullets: { gap: 9, marginTop: 24 },
  bulletRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bulletDot: { width: 6, height: 6, borderRadius: 3 },
  bulletLabel: { fontFamily: FONT_FAMILIES.displayRegular, fontSize: 13 },
  skip: { fontFamily: FONT_FAMILIES.bodyRegular, fontSize: 12.5, textAlign: 'center', marginTop: 14 },
});
