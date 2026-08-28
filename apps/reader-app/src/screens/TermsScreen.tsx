// src/screens/TermsScreen.tsx
// Screen 2s — Terms of Service / Privacy Policy, tabbed. Copy is admin-
// editable (App Configuration → Terms & Privacy) — falls back to
// remoteConfig's own DEFAULT_CONFIG text if the backend hasn't set it.

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '@/store/app.store';
import { useTheme } from '@/hooks/useTheme';
import { FONT_FAMILIES } from '@/constants';
import Icon from '@/components/icons/Icon';

type Tab = 'terms' | 'privacy';

export default function TermsScreen() {
  const t = useTheme();
  const { language, remoteConfig } = useAppStore();
  const cfg = remoteConfig.termsScreen;
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('terms');

  const body = tab === 'terms'
    ? (language === 'ta' ? cfg.termsTa : cfg.termsEn)
    : (language === 'ta' ? cfg.privacyTa : cfg.privacyEn);

  return (
    <View style={[styles.container, { backgroundColor: t.surface }]}>
      <View style={[styles.header, { borderBottomColor: t.border, paddingTop: insets.top, paddingBottom: 8 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <Icon name="back" size={17} color={t.ink} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: t.ink }]}>
          {language === 'ta' ? 'விதிமுறைகள் & தனியுரிமை' : 'Terms & Privacy'}
        </Text>
      </View>

      <View style={[styles.tabRow, { borderBottomColor: t.border }]}>
        <TouchableOpacity style={styles.tabBtn} onPress={() => setTab('terms')}>
          <Text style={[styles.tabLabel, { color: tab === 'terms' ? t.ink : t.inkMuted }]}>
            {language === 'ta' ? 'விதிமுறைகள்' : 'Terms'}
          </Text>
          {tab === 'terms' && <View style={[styles.tabIndicator, { backgroundColor: t.red }]} />}
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabBtn} onPress={() => setTab('privacy')}>
          <Text style={[styles.tabLabel, { color: tab === 'privacy' ? t.ink : t.inkMuted }]}>
            {language === 'ta' ? 'தனியுரிமை' : 'Privacy'}
          </Text>
          {tab === 'privacy' && <View style={[styles.tabIndicator, { backgroundColor: t.red }]} />}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 48 + insets.bottom }]}>
        <Text style={[styles.body, { color: t.inkSub }]}>{body}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, borderBottomWidth: 1 },
  headerTitle: { fontFamily: FONT_FAMILIES.displayBold, fontSize: 16 },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1 },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 13 },
  tabLabel: { fontFamily: FONT_FAMILIES.displaySemiBold, fontSize: 14 },
  tabIndicator: { height: 2.5, width: 40, borderRadius: 2, marginTop: 8 },
  content: { padding: 20, paddingBottom: 48 },
  body: { fontFamily: FONT_FAMILIES.bodyRegular, fontSize: 14, lineHeight: 25 },
});
