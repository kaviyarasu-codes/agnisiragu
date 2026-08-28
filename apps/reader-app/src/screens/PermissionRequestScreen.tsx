// src/screens/PermissionRequestScreen.tsx
// Screen 2z — soft pre-permission screen shown once, right after setup and
// before the OS notification prompt (so the actual system dialog only ever
// appears after the reader has already said yes here). Copy is admin-
// editable (App Configuration → Notification Permission Screen); falls back
// to remoteConfig's own DEFAULT_CONFIG shape if the backend hasn't set it.

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

export default function PermissionRequestScreen() {
  const t = useTheme();
  const { completeOnboarding, remoteConfig, language } = useAppStore();
  const cfg = remoteConfig.notifPermissionScreen;
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
      <Text style={[styles.title, { color: t.ink }]}>{language === 'ta' ? cfg.titleTa : cfg.titleEn}</Text>
      <Text style={[styles.desc, { color: t.inkSub }]}>{language === 'ta' ? cfg.descTa : cfg.descEn}</Text>

      <View style={styles.bullets}>
        {cfg.bullets.map((b, i) => (
          <View key={i} style={styles.bulletRow}>
            <View style={[styles.bulletDot, { backgroundColor: b.on ? t.red : t.border }]} />
            <Text style={[styles.bulletLabel, { color: b.on ? t.inkSub : t.inkMuted }]}>
              {language === 'ta' ? b.labelTa : b.labelEn}
            </Text>
          </View>
        ))}
      </View>

      <Button
        label={language === 'ta' ? cfg.buttonLabelTa : cfg.buttonLabelEn}
        onPress={grant}
        loading={busy}
        style={{ width: '100%', marginTop: 28 }}
      />
      <Text style={[styles.skip, { color: t.inkMuted }]} onPress={finish}>
        {language === 'ta' ? cfg.skipLabelTa : cfg.skipLabelEn}
      </Text>
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
