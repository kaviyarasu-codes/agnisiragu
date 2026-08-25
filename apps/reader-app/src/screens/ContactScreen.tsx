// src/screens/ContactScreen.tsx
// Screen 2t — About & Contact: logo, version, description, then Help
// Center / Contact / Advertise / Rate Us rows and Terms/Privacy links.
// Store URL for "Rate Us" is a placeholder until the app is actually
// published — swap PLAY_STORE_URL/APP_STORE_URL once real listings exist.

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Linking, Platform, StyleSheet } from 'react-native';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useAppStore } from '@/store/app.store';
import { useTheme } from '@/hooks/useTheme';
import { FONT_FAMILIES, STRINGS } from '@/constants';
import Icon, { IconName } from '@/components/icons/Icon';

const SUPPORT_EMAIL = 'agni360tn@gmail.com';
const ADVERTISE_EMAIL = 'ads@agnisiragu.com';
const HELP_URL = 'https://agnisiragu.com/help';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.agnisiragu.reader';
const APP_STORE_URL = 'https://apps.apple.com/app/agnisiragu';

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
  const { language } = useAppStore();
  const version = Constants.expoConfig?.version ?? '1.0.0';

  function rateUs() {
    Linking.openURL(Platform.OS === 'ios' ? APP_STORE_URL : PLAY_STORE_URL);
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: t.bg }]} contentContainerStyle={styles.content}>
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
          {language === 'ta'
            ? 'உங்கள் ஊர் செய்திகளை உங்கள் மொழியில், சரிபார்க்கப்பட்ட நிருபர்களிடமிருந்து.'
            : 'Your town\'s news, in your language, from verified reporters.'}
        </Text>
      </View>

      <View style={[styles.section, { backgroundColor: t.surface, borderColor: t.border }]}>
        <Row icon="bookmarkNav" label={language === 'ta' ? 'உதவி மையம்' : 'Help Center'} onPress={() => Linking.openURL(HELP_URL)} />
        <Row icon="comment" label={language === 'ta' ? 'எங்களை தொடர்பு கொள்ள' : 'Contact Us'} onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)} />
        <Row icon="reportFlag" label={language === 'ta' ? 'விளம்பரம் செய்ய' : 'Advertise With Us'} onPress={() => Linking.openURL(`mailto:${ADVERTISE_EMAIL}`)} />
        <Row icon="like" label={language === 'ta' ? 'எங்களை மதிப்பிடுங்கள்' : 'Rate Us'} onPress={rateUs} last />
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
