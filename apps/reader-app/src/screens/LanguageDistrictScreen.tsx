// src/screens/LanguageDistrictScreen.tsx
// The setup screen from the 1a walkthrough — language toggle + district
// picker, reachable again later from Settings / the side menu's district
// row ("change anytime in menu").

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAppStore } from '@/store/app.store';
import { useTheme } from '@/hooks/useTheme';
import { DISTRICTS, FONT_FAMILIES } from '@/constants';
import Button from '@/components/ui/Button';

export default function LanguageDistrictScreen() {
  const t = useTheme();
  const { language, setLanguage, district, setDistrict, onboardingDone } = useAppStore();
  const [selectedLang, setSelectedLang] = useState(language);
  const [selectedDistrict, setSelectedDistrict] = useState(district ?? DISTRICTS[0].id);

  function handleStart() {
    setLanguage(selectedLang);
    setDistrict(selectedDistrict);
    router.replace(onboardingDone ? '/' : '/permission');
  }

  return (
    <View style={[styles.container, { backgroundColor: t.surface }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Image
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          source={require('../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={[styles.tagline, { color: t.inkMuted }]}>உங்கள் ஊர் செய்திகள், ஒரே இடத்தில்</Text>

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

        <Text style={[styles.caption, { color: t.inkMuted, marginTop: 28 }]}>உங்கள் இருப்பிடம் / district</Text>
        <View style={[styles.districtList, { borderColor: t.border }]}>
          {DISTRICTS.map((d, i) => {
            const active = selectedDistrict === d.id;
            return (
              <TouchableOpacity
                key={d.id}
                style={[styles.districtRow, i < DISTRICTS.length - 1 && { borderBottomColor: t.bgAlt, borderBottomWidth: 1 }]}
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

      <View style={styles.footer}>
        <Button label="தொடங்கு" onPress={handleStart} variant="dark" style={{ width: '100%' }} />
        <Text style={[styles.footerNote, { color: t.inkMuted }]}>CHANGE ANYTIME IN MENU</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 26, paddingTop: 34 },
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
