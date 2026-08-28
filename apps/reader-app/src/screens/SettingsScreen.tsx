// src/screens/SettingsScreen.tsx
// Screen 2m — settings hub: appearance, language, district, notifications,
// account, and about links, reached from Profile's settings row (and the
// side menu).

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useAppStore } from '@/store/app.store';
import { useAuthStore } from '@/store/auth.store';
import { useTheme } from '@/hooks/useTheme';
import { FONT_FAMILIES, STRINGS } from '@/constants';
import { patch } from '@/lib/api';
import { Caption } from '@/components/ui/Chip';
import Icon from '@/components/icons/Icon';
import type { Language } from '@/types';

function Row({
  label, value, onPress, danger, last,
}: { label: string; value?: string; onPress: () => void; danger?: boolean; last?: boolean }) {
  const t = useTheme();
  return (
    <TouchableOpacity
      style={[styles.row, !last && { borderBottomWidth: 1, borderBottomColor: t.border }]}
      onPress={onPress}
    >
      <Text style={[styles.rowLabel, { color: danger ? t.red : t.ink }]}>{label}</Text>
      <View style={styles.rowRight}>
        {value ? <Text style={[styles.rowValue, { color: t.inkMuted }]}>{value}</Text> : null}
        <Icon name="chevronRight" size={10} color={t.inkMuted} />
      </View>
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const t = useTheme();
  const { language, setLanguage, colorScheme, setColorScheme, district, remoteConfig } = useAppStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const districtLabel = remoteConfig.districts.find((d) => d.id === district);
  const insets = useSafeAreaInsets();
  const [clearingCache, setClearingCache] = useState(false);

  async function handleClearCache() {
    setClearingCache(true);
    try {
      await Promise.all([Image.clearDiskCache(), Image.clearMemoryCache()]);
      Alert.alert(
        language === 'ta' ? 'சேமிப்பு அழிக்கப்பட்டது' : 'Cache cleared',
        language === 'ta' ? 'தற்காலிக சேமிப்பு அழிக்கப்பட்டது' : 'Temporary image cache has been cleared',
      );
    } catch {
      Alert.alert('பிழை', language === 'ta' ? 'அழிக்க முடியவில்லை' : 'Could not clear cache');
    } finally {
      setClearingCache(false);
    }
  }

  async function handleLanguageToggle(lang: Language) {
    setLanguage(lang);
    try { await patch('/users/preferences', { preferredLang: lang }); } catch { /* best-effort */ }
  }

  const themeLabel = colorScheme === 'light'
    ? (language === 'ta' ? 'வெளிச்சம்' : 'Light')
    : colorScheme === 'dark'
      ? (language === 'ta' ? 'இருள்' : 'Dark')
      : (language === 'ta' ? 'சாதனத்தை பின்பற்று' : 'System');

  function cycleTheme() {
    const order: Array<typeof colorScheme> = ['system', 'light', 'dark'];
    const next = order[(order.indexOf(colorScheme) + 1) % order.length];
    setColorScheme(next);
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: t.bg }]} contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]}>
      <Caption label={language === 'ta' ? 'தோற்றம்' : 'Appearance'} />
      <View style={[styles.section, { backgroundColor: t.surface, borderColor: t.border }]}>
        <Row label={language === 'ta' ? 'தீம்' : 'Theme'} value={themeLabel} onPress={cycleTheme} last />
      </View>

      <Caption label={language === 'ta' ? 'மொழி' : 'Language'} />
      <View style={styles.langRow}>
        <TouchableOpacity
          style={[styles.langBtn, { borderColor: language === 'ta' ? t.red : t.border, backgroundColor: language === 'ta' ? t.red : 'transparent' }]}
          onPress={() => handleLanguageToggle('ta')}
        >
          <Text style={[styles.langText, { color: language === 'ta' ? '#fff' : t.ink }]}>தமிழ்</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.langBtn, { borderColor: language === 'en' ? t.red : t.border, backgroundColor: language === 'en' ? t.red : 'transparent' }]}
          onPress={() => handleLanguageToggle('en')}
        >
          <Text style={[styles.langText, { color: language === 'en' ? '#fff' : t.ink }]}>English</Text>
        </TouchableOpacity>
      </View>

      <Caption label={language === 'ta' ? 'உள்ளடக்கம்' : 'Content'} />
      <View style={[styles.section, { backgroundColor: t.surface, borderColor: t.border }]}>
        <Row
          label={language === 'ta' ? 'மாவட்டம்' : 'District'}
          value={districtLabel?.nameTa}
          onPress={() => router.push('/language-district')}
        />
        <Row
          label={STRINGS.NOTIFICATIONS_TA + ' / ' + STRINGS.NOTIFICATIONS_EN}
          onPress={() => router.push('/notifications')}
          last
        />
      </View>

      <Caption label={language === 'ta' ? 'தரவு' : 'Data'} />
      <View style={[styles.section, { backgroundColor: t.surface, borderColor: t.border }]}>
        <Row
          label={language === 'ta' ? 'தற்காலிக சேமிப்பை அழி' : 'Clear cache'}
          value={clearingCache ? (language === 'ta' ? 'அழிக்கிறது...' : 'Clearing...') : undefined}
          onPress={handleClearCache}
          last
        />
      </View>

      {isAuthenticated && (
        <>
          <Caption label={language === 'ta' ? 'கணக்கு' : 'Account'} />
          <View style={[styles.section, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Row label={language === 'ta' ? 'சுயவிவரம் திருத்த' : 'Edit Profile'} onPress={() => router.push('/edit-profile')} />
            <Row label={language === 'ta' ? 'எண்ணை மாற்ற' : 'Change Number'} onPress={() => router.push('/change-number')} last />
          </View>
        </>
      )}

      <Caption label={language === 'ta' ? 'பற்றி' : 'About'} />
      <View style={[styles.section, { backgroundColor: t.surface, borderColor: t.border }]}>
        <Row label={language === 'ta' ? 'எங்களை பற்றி' : 'About & Contact'} onPress={() => router.push('/contact')} />
        <Row label={language === 'ta' ? 'விதிமுறைகள் & தனியுரிமை' : 'Terms & Privacy'} onPress={() => router.push('/terms')} last />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 18, paddingBottom: 40 },
  section: { borderWidth: 1, borderRadius: 12, marginTop: 8, marginBottom: 20 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 14, borderBottomWidth: 1 },
  rowLabel: { fontFamily: FONT_FAMILIES.displayRegular, fontSize: 14.5 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowValue: { fontFamily: FONT_FAMILIES.uiMedium, fontSize: 12.5 },
  langRow: { flexDirection: 'row', gap: 10, marginTop: 8, marginBottom: 20 },
  langBtn: { flex: 1, borderWidth: 1.5, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  langText: { fontFamily: FONT_FAMILIES.uiSemiBold, fontSize: 14.5 },
});
