// src/screens/ForceUpdateScreen.tsx
// Screen 2u — blocking update screen, shown when the running app's version
// is below remoteConfig.minSupportedVersion. This screen only renders the
// UI; the actual version check + navigation gate belongs in app/_layout.tsx
// (Task 10) since it has to run before any other route mounts.

import React from 'react';
import { View, Text, Image, Linking, Platform, StyleSheet } from 'react-native';
import Constants from 'expo-constants';
import { useAppStore } from '@/store/app.store';
import { useTheme } from '@/hooks/useTheme';
import { FONT_FAMILIES } from '@/constants';
import Button from '@/components/ui/Button';

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.agnisiragu.reader';
const APP_STORE_URL = 'https://apps.apple.com/app/agnisiragu';

export default function ForceUpdateScreen() {
  const t = useTheme();
  const { language, remoteConfig } = useAppStore();
  const currentVersion = Constants.expoConfig?.version ?? '1.0.0';

  function handleUpdate() {
    Linking.openURL(Platform.OS === 'ios' ? APP_STORE_URL : PLAY_STORE_URL);
  }

  return (
    <View style={[styles.container, { backgroundColor: t.surface }]}>
      <Image
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        source={require('../../assets/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={[styles.title, { color: t.ink }]}>
        {language === 'ta' ? 'புதுப்பிப்பு தேவை' : 'Update Required'}
      </Text>
      <Text style={[styles.desc, { color: t.inkSub }]}>
        {language === 'ta'
          ? 'தொடர அப்ளிகேஷனின் புதிய பதிப்பை பதிவிறக்கவும்.'
          : 'A newer version of the app is required to continue.'}
      </Text>
      <Text style={[styles.versionMeta, { color: t.inkMuted }]}>
        {language === 'ta' ? 'தற்போதைய பதிப்பு' : 'Current version'}: {currentVersion}
        {remoteConfig.minSupportedVersion ? ` · ${language === 'ta' ? 'தேவை' : 'Required'}: ${remoteConfig.minSupportedVersion}+` : ''}
      </Text>

      <Button
        label={language === 'ta' ? 'இப்போது புதுப்பிக்க' : 'Update Now'}
        onPress={handleUpdate}
        style={{ width: '100%', marginTop: 28 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  logo: { width: 80, height: 36, marginBottom: 26 },
  title: { fontFamily: FONT_FAMILIES.displayExtraBold, fontSize: 22, letterSpacing: -0.3 },
  desc: { fontFamily: FONT_FAMILIES.bodyRegular, fontSize: 14, lineHeight: 23, textAlign: 'center', marginTop: 10 },
  versionMeta: { fontFamily: FONT_FAMILIES.uiRegular, fontSize: 11.5, marginTop: 16 },
});
