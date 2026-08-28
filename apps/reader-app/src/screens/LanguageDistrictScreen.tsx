// src/screens/LanguageDistrictScreen.tsx
// The setup screen from the 1a walkthrough — language toggle + district
// picker, reachable again later from Settings / the side menu's district
// row ("change anytime in menu").

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '@/store/app.store';
import { useTheme } from '@/hooks/useTheme';
import { FONT_FAMILIES } from '@/constants';
import Button from '@/components/ui/Button';

export default function LanguageDistrictScreen() {
  const t = useTheme();
  const { language, setLanguage, district, setDistrict, onboardingDone, remoteConfig } = useAppStore();
  const districts = remoteConfig.districts;
  const [selectedLang, setSelectedLang] = useState(language);
  const [selectedDistrict, setSelectedDistrict] = useState(district ?? districts[0]?.id);
  // Reacts live to the language toggle right below it, not just the app's
  // current global language — a nice touch since this screen is exactly
  // where the reader is choosing between Tamil/English.
  const tagline = selectedLang === 'ta' ? remoteConfig.languageDistrictScreen.taglineTa : remoteConfig.languageDistrictScreen.taglineEn;
  const insets = useSafeAreaInsets();

  function handleStart() {
    setLanguage(selectedLang);
    setDistrict(selectedDistrict);
    router.replace(onboardingDone ? '/' : '/permission-location');
  }

  return (
    <View style={[styles.container, { backgroundColor: t.surface }]}>
      {/* Fixed header — logo, tagline, language toggle. Doesn't move when the
          district list below is scrolled, so it stays visible regardless of
          how many districts an admin has added. */}
      <View style={[styles.header, { paddingTop: 34 + insets.top }]}>
        <Image
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          source={require('../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={[styles.tagline, { color: t.inkMuted }]}>{tagline}</Text>

        <Text style={[styles.caption, { color: t.inkMuted }]}>மொழி தேர்வு / language</Text>
        <View style={styles.langGrid}>
          <TouchableOpacity
            style={[styles.langCard, { borderColor: t.red, backgroundColor: selectedLang === 'ta' ? t.red : 'transparent' }]}
            onPress={() => setSelectedLang('ta')}
          >
            <Text style={[styles.langTa, { color: selectedLang === 'ta' ? '#fff' : t.ink }]}>தமிழ்</Text>
            <Text style={[styles.langSub, { color: selectedLang === 'ta' ? 'rgba(255,255,255,0.72)' : t.inkMuted }]}>Tamil</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.langCard, { borderColor: selectedLang === 'en' ? t.red : t.border, backgroundColor: selectedLang === 'en' ? t.red : 'transparent' }]}
            onPress={() => setSelectedLang('en')}
          >
            <Text style={[styles.langEn, { color: selectedLang === 'en' ? '#fff' : t.ink }]}>English</Text>
            <Text style={[styles.langSub, { color: selectedLang === 'en' ? 'rgba(255,255,255,0.72)' : t.inkMuted }]}>ஆங்கிலம்</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.caption, { color: t.inkMuted, marginTop: 28, marginBottom: 0 }]}>உங்கள் இருப்பிடம் / district</Text>
      </View>

      {/* Only this list scrolls — an admin-added long district list can grow
          without pushing the Start button off-screen or shifting the header. */}
      <ScrollView style={styles.districtScroll} contentContainerStyle={styles.districtScrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.districtList, { borderColor: t.border }]}>
          {districts.map((d, i) => {
            const active = selectedDistrict === d.id;
            return (
              <TouchableOpacity
                key={d.id}
                style={[styles.districtRow, i < districts.length - 1 && { borderBottomColor: t.bgAlt, borderBottomWidth: 1 }]}
                onPress={() => setSelectedDistrict(d.id)}
              >
                <View style={[styles.radioDot, active ? { backgroundColor: t.red } : { borderWidth: 1.5, borderColor: t.border }]} />
                <Text style={[styles.districtName, { color: active ? t.ink : t.inkSub, fontWeight: active ? '600' : '400' }]}>
                  {d.nameTa}
                </Text>
                <Text style={[styles.districtEn, { color: t.inkMuted }]}>{d.nameEn.toUpperCase()}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: 12 + insets.bottom }]}>
        <Button label="தொடங்கு" onPress={handleStart} variant="dark" style={{ width: '100%' }} />
        <Text style={[styles.footerNote, { color: t.inkMuted }]}>CHANGE ANYTIME IN MENU</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 26, paddingTop: 34 },
  districtScroll: { flex: 1 },
  districtScrollContent: { paddingHorizontal: 26, paddingTop: 12, paddingBottom: 8 },
  logo: { width: 150, height: 68, alignSelf: 'center' },
  tagline: { fontFamily: FONT_FAMILIES.bodyRegular, fontSize: 12, textAlign: 'center', marginTop: 10 },
  caption: { fontFamily: FONT_FAMILIES.condensedBold, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginTop: 38, marginBottom: 12 },
  langGrid: { flexDirection: 'row', gap: 10 },
  langCard: { flex: 1, borderWidth: 2, borderRadius: 10, padding: 14 },
  langTa: { fontFamily: FONT_FAMILIES.displayBold, fontSize: 22 },
  langEn: { fontFamily: FONT_FAMILIES.uiBold, fontSize: 22 },
  langSub: { fontFamily: FONT_FAMILIES.bodyRegular, fontSize: 11, marginTop: 3 },
  districtList: { borderWidth: 1, borderRadius: 10 },
  districtRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  radioDot: { width: 8, height: 8, borderRadius: 4 },
  districtName: { flex: 1, fontFamily: FONT_FAMILIES.displaySemiBold, fontSize: 15 },
  districtEn: { fontFamily: FONT_FAMILIES.uiMedium, fontSize: 10, letterSpacing: 0.6 },
  footer: { padding: 24, paddingTop: 12 },
  footerNote: { fontFamily: FONT_FAMILIES.uiMedium, fontSize: 10, letterSpacing: 1, textAlign: 'center', marginTop: 12 },
});
