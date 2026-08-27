// src/screens/LocationPermissionScreen.tsx
// Soft pre-permission screen for location, shown right after the language +
// district picker during onboarding — mirrors PermissionRequestScreen.tsx
// (the equivalent screen for notifications) so the OS location dialog only
// ever appears after the reader has already said yes here. expo-location is
// already a dependency (used by PostNewsScreen to tag a report's location);
// this is the first place it's requested proactively during setup.

import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import { useTheme } from '@/hooks/useTheme';
import { FONT_FAMILIES, STORAGE_KEYS } from '@/constants';
import Icon from '@/components/icons/Icon';
import Button from '@/components/ui/Button';

const BULLETS = [
  { label: 'உங்கள் மாவட்ட செய்திகள் தானாக தேர்வு', on: true },
  { label: 'அருகிலுள்ள நிகழ்வுகள் மற்றும் விளம்பரங்கள்', on: true },
  { label: 'எப்போது வேண்டுமானாலும் அமைப்புகளில் மாற்றலாம்', on: false },
];

export default function LocationPermissionScreen() {
  const t = useTheme();
  const [busy, setBusy] = useState(false);
  const insets = useSafeAreaInsets();

  function next() {
    router.replace('/permission');
  }

  async function grant() {
    setBusy(true);
    try {
      await Location.requestForegroundPermissionsAsync();
    } catch {
      // best-effort — an outright rejection or unsupported device shouldn't
      // block onboarding
    } finally {
      await SecureStore.setItemAsync(STORAGE_KEYS.LOCATION_PERMISSION_ASKED, '1').catch(() => {});
      setBusy(false);
      next();
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: t.surface, paddingTop: 60 + insets.top, paddingBottom: 24 + insets.bottom }]}>
      <Icon name="permissionLocation" size={46} color={t.red} />
      <Text style={[styles.title, { color: t.ink }]}>உங்கள் இருப்பிடத்தை அறிய அனுமதி தேவை</Text>
      <Text style={[styles.desc, { color: t.inkSub }]}>
        இருப்பிட அனுமதி அளித்தால், உங்கள் மாவட்ட செய்திகளை தானாக காட்டுவோம். இதை எப்போது வேண்டுமானாலும் அமைப்புகளில் மாற்றலாம்.
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
      <Text style={[styles.skip, { color: t.inkMuted }]} onPress={next}>இப்போது வேண்டாம்</Text>
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
