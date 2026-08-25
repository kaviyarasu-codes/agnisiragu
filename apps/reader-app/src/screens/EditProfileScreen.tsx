// src/screens/EditProfileScreen.tsx
// Screen 2n — edit display name. Phone is shown read-only with a link to
// the dedicated change-number flow. Saves via PATCH /users/profile — a
// best-effort endpoint name (mirrors /users/preferences, which is real);
// confirm with backend if it differs.

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { useAppStore } from '@/store/app.store';
import { useTheme } from '@/hooks/useTheme';
import { FONT_FAMILIES } from '@/constants';
import { patch } from '@/lib/api';
import TextField from '@/components/ui/TextField';
import Button from '@/components/ui/Button';
import Icon from '@/components/icons/Icon';

export default function EditProfileScreen() {
  const t = useTheme();
  const { language } = useAppStore();
  const { user, setUser } = useAuthStore();
  const [name, setName] = useState(user?.name ?? '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('பிழை', language === 'ta' ? 'பெயரை உள்ளிடவும்' : 'Please enter a name');
      return;
    }
    setSaving(true);
    try {
      await patch('/users/profile', { name: name.trim() });
      if (user) setUser({ ...user, name: name.trim() });
      router.back();
    } catch {
      Alert.alert('பிழை', language === 'ta' ? 'சேமிக்க முடியவில்லை' : 'Could not save changes');
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: t.surface }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[styles.header, { borderBottomColor: t.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <Icon name="back" size={17} color={t.ink} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: t.ink }]}>
          {language === 'ta' ? 'சுயவிவரம் திருத்த' : 'Edit Profile'}
        </Text>
      </View>

      <View style={styles.body}>
        <TextField
          caption={language === 'ta' ? 'பெயர்' : 'Name'}
          value={name}
          onChangeText={setName}
          placeholder={language === 'ta' ? 'உங்கள் பெயர்' : 'Your name'}
        />

        <View style={{ marginTop: 18 }}>
          <TextField
            caption={language === 'ta' ? 'தொலைபேசி எண்' : 'Phone number'}
            value={user?.phone ?? ''}
            editable={false}
            disabled
          />
          <TouchableOpacity onPress={() => router.push('/change-number')}>
            <Text style={[styles.changeLink, { color: t.red }]}>
              {language === 'ta' ? 'எண்ணை மாற்ற' : 'Change number'}
            </Text>
          </TouchableOpacity>
        </View>

        <Button
          label={language === 'ta' ? 'சேமி' : 'Save'}
          onPress={handleSave}
          loading={saving}
          style={{ marginTop: 28 }}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { height: 52, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, borderBottomWidth: 1 },
  headerTitle: { fontFamily: FONT_FAMILIES.displayBold, fontSize: 16 },
  body: { padding: 22 },
  changeLink: { fontFamily: FONT_FAMILIES.displaySemiBold, fontSize: 12.5, marginTop: 8 },
});
