// src/screens/NotificationsScreen.tsx
// Screen 2i — notification settings: master OS-permission toggle + a
// per-category alert list. The per-category list is real (backed by
// UserPrefs.notificationCategories, already in src/types); there's no
// notification *history/inbox* endpoint yet, so this screen is settings-only
// rather than a feed of past alerts.

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Linking, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useFocusEffect } from 'expo-router';
import { useCategories } from '@/hooks/useCategories';
import { useTheme } from '@/hooks/useTheme';
import { useAppStore } from '@/store/app.store';
import { FONT_FAMILIES } from '@/constants';
import { getUserPrefs, setUserPrefs } from '@/lib/storage';
import { registerGuestPushToken, registerPushToken } from '@/lib/push';
import { useAuthStore } from '@/store/auth.store';
import Switch from '@/components/ui/Switch';
import { Caption } from '@/components/ui/Chip';
import Icon from '@/components/icons/Icon';

export default function NotificationsScreen() {
  const t = useTheme();
  const { language } = useAppStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: categories } = useCategories();
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [categoryPrefs, setCategoryPrefs] = useState<string[]>([]);

  const refreshPermission = useCallback(async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setPermissionGranted(status === 'granted');
  }, []);

  useFocusEffect(useCallback(() => { refreshPermission(); }, [refreshPermission]));

  useEffect(() => {
    getUserPrefs().then((prefs) => {
      if (prefs?.notificationCategories) setCategoryPrefs(prefs.notificationCategories);
    });
  }, []);

  async function handleMasterToggle(next: boolean) {
    if (next) {
      const { status } = await Notifications.requestPermissionsAsync();
      setPermissionGranted(status === 'granted');
      if (status === 'granted') {
        if (isAuthenticated) await registerPushToken();
        else await registerGuestPushToken();
      } else if (status === 'denied' && Platform.OS === 'ios') {
        Linking.openSettings();
      }
    } else {
      // The OS doesn't let apps revoke their own notification permission —
      // send the reader to Settings to turn it off there.
      Linking.openSettings();
    }
  }

  async function toggleCategoryAlert(categoryId: string) {
    const next = categoryPrefs.includes(categoryId)
      ? categoryPrefs.filter((id) => id !== categoryId)
      : [...categoryPrefs, categoryId];
    setCategoryPrefs(next);
    const prefs = await getUserPrefs();
    await setUserPrefs({ language: prefs?.language ?? language, notificationCategories: next });
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: t.bg }]} contentContainerStyle={styles.content}>
      <View style={[styles.masterRow, { backgroundColor: t.surface, borderColor: t.border }]}>
        <View style={styles.masterIconWrap}>
          <Icon name="bell" size={18} color={t.red} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.masterTitle, { color: t.ink }]}>
            {language === 'ta' ? 'அறிவிப்புகள்' : 'Push Notifications'}
          </Text>
          <Text style={[styles.masterSub, { color: t.inkMuted }]}>
            {permissionGranted
              ? (language === 'ta' ? 'இயக்கப்பட்டது' : 'Enabled')
              : (language === 'ta' ? 'முடக்கப்பட்டது' : 'Disabled')}
          </Text>
        </View>
        <Switch value={!!permissionGranted} onValueChange={handleMasterToggle} />
      </View>

      <Caption label={language === 'ta' ? 'பிரிவு வாரியாக அறிவிப்பு' : 'Alerts by category'} />
      <View style={[styles.list, { borderColor: t.border, backgroundColor: t.surface }]}>
        {(categories ?? []).map((cat, i) => {
          const name = language === 'ta' ? cat.nameTa : cat.nameEn;
          const on = categoryPrefs.includes(cat.id);
          return (
            <View
              key={cat.id}
              style={[
                styles.row,
                i < (categories?.length ?? 0) - 1 && { borderBottomWidth: 1, borderBottomColor: t.border },
              ]}
            >
              <Text style={[styles.rowLabel, { color: t.ink }]}>{name}</Text>
              <Switch value={on} onValueChange={() => toggleCategoryAlert(cat.id)} disabled={!permissionGranted} />
            </View>
          );
        })}
      </View>

      <Text style={[styles.footnote, { color: t.inkMuted }]}>
        {language === 'ta'
          ? 'அவசர செய்திகள் எப்போதும் அனுப்பப்படும், தேர்வு செய்யப்பட்ட பிரிவுகள் இல்லாமல் கூட.'
          : 'Breaking news alerts always go out, regardless of category selection.'}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 18, paddingBottom: 40 },
  masterRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 22,
  },
  masterIconWrap: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  masterTitle: { fontFamily: FONT_FAMILIES.displaySemiBold, fontSize: 15 },
  masterSub: { fontFamily: FONT_FAMILIES.bodyRegular, fontSize: 12, marginTop: 2 },
  list: { borderWidth: 1, borderRadius: 12, marginTop: 10 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 13 },
  rowLabel: { fontFamily: FONT_FAMILIES.displayRegular, fontSize: 14.5 },
  footnote: { fontFamily: FONT_FAMILIES.bodyRegular, fontSize: 12, lineHeight: 19, marginTop: 18 },
});
