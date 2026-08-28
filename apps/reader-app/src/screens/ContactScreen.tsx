// src/screens/ContactScreen.tsx
// Screen 2t — About & Contact: logo, version, description, then Help
// Center / Contact / Advertise / Rate Us rows and Terms/Privacy links.
// Description text, the four rows' URLs/emails, and each row's visibility
// are admin-editable (App Configuration → About / Contact Screen) — falls
// back to remoteConfig's own DEFAULT_CONFIG values if unset.

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Linking, Platform, StyleSheet } from 'react-native';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '@/store/app.store';
import { useTheme } from '@/hooks/useTheme';
import { FONT_FAMILIES, STRINGS } from '@/constants';
import Icon, { IconName } from '@/components/icons/Icon';

function Row({ icon, label, onPress, last }: { icon: IconName; label: string; onPress: () => void; last?: boolean }) {
  const t = useTheme();
  return (
    <TouchableOpacity
      style={[styles.row, !last && { borderBottomWidth: 1, borderBottomColor: t.border }]}
      onPress={onPress}
    >
      <View style={[styles.rowIcon, { backgroundColor: t.bgAlt }]}>
        <Icon name={icon} size={15} color={t.ink} />
      </View>
      <Text style={[styles.rowLabel, { color: t.ink }]}>{label}</Text>
      <Icon name="chevronRight" size={10} color={t.inkMuted} />
    </TouchableOpacity>
  );
}

export default function ContactScreen() {
  const t = useTheme();
  const { language, remoteConfig } = useAppStore();
  const cfg = remoteConfig.aboutScreen;
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const insets = useSafeAreaInsets();

  function rateUs() {
    Linking.openURL(Platform.OS === 'ios' ? cfg.appStoreUrl : cfg.playStoreUrl);
  }

  // Whichever enabled row renders last shouldn't draw a trailing divider —
  // rows can be individually hidden via App Configuration, so this can't be
  // hardcoded to always be "rate us" anymore.
  const rowOrder: Array<{ key: string; enabled: boolean }> = [
    { key: 'help', enabled: cfg.helpEnabled },
    { key: 'contact', enabled: cfg.contactEnabled },
    { key: 'advertise', enabled: cfg.advertiseEnabled },
    { key: 'rate', enabled: cfg.rateUsEnabled },
  ];
  const lastVisibleRow = [...rowOrder].reverse().find((r) => r.enabled)?.key;

  return (
    <ScrollView style={[styles.container, { backgroundColor: t.bg }]} contentContainerStyle={[styles.content, { paddingBottom: 44 + insets.bottom }]}>
      <View style={styles.logoBlock}>
        <Image
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          source={require('../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={[styles.appName, { color: t.ink }]}>{STRINGS.APP_NAME_TA} · {STRINGS.APP_NAME_EN}</Text>
        <Text style={[styles.version, { color: t.inkMuted }]}>VERSION {version}</Text>
        <Text style={[styles.desc, { color: t.inkSub }]}>
          {language === 'ta' ? cfg.descTa : cfg.descEn}
        </Text>
      </View>

      <View style={[styles.section, { backgroundColor: t.surface, borderColor: t.border }]}>
        {cfg.helpEnabled && (
          <Row icon="bookmarkNav" label={language === 'ta' ? 'உதவி மையம்' : 'Help Center'} onPress={() => Linking.openURL(cfg.helpUrl)} last={lastVisibleRow === 'help'} />
        )}
        {cfg.contactEnabled && (
          <Row icon="comment" label={language === 'ta' ? 'எங்களை தொடர்பு கொள்ள' : 'Contact Us'} onPress={() => Linking.openURL(`mailto:${cfg.contactEmail}`)} last={lastVisibleRow === 'contact'} />
        )}
        {cfg.advertiseEnabled && (
          <Row icon="reportFlag" label={language === 'ta' ? 'விளம்பரம் செய்ய' : 'Advertise With Us'} onPress={() => Linking.openURL(`mailto:${cfg.advertiseEmail}`)} last={lastVisibleRow === 'advertise'} />
        )}
        {cfg.rateUsEnabled && (
          <Row icon="like" label={language === 'ta' ? 'எங்களை மதிப்பிடுங்கள்' : 'Rate Us'} onPress={rateUs} last={lastVisibleRow === 'rate'} />
        )}
      </View>

      <View style={[styles.section, { backgroundColor: t.surface, borderColor: t.border }]}>
        <Row icon="archiveBox" label={language === 'ta' ? 'விதிமுறைகள் & தனியுரிமை' : 'Terms & Privacy'} onPress={() => router.push('/terms')} last />
      </View>

      <Text style={[styles.publisher, { color: t.inkMuted }]}>© {new Date().getFullYear()} Agnisiragu News</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 44 },
  logoBlock: { alignItems: 'center', paddingVertical: 20 },
  logo: { width: 96, height: 44 },
  appName: { fontFamily: FONT_FAMILIES.displayBold, fontSize: 16, marginTop: 12 },
  version: { fontFamily: FONT_FAMILIES.condensedBold, fontSize: 10, letterSpacing: 1, marginTop: 4 },
  desc: { fontFamily: FONT_FAMILIES.bodyRegular, fontSize: 13, lineHeight: 21, textAlign: 'center', marginTop: 12, paddingHorizontal: 16 },
  section: { borderWidth: 1, borderRadius: 12, marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 13, borderBottomWidth: 1 },
  rowIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontFamily: FONT_FAMILIES.displaySemiBold, fontSize: 14 },
  publisher: { fontFamily: FONT_FAMILIES.bodyRegular, fontSize: 11.5, textAlign: 'center', marginTop: 6 },
});
