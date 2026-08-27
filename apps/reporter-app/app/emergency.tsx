// app/emergency.tsx — Emergency report, one screen, no steps (design 1j)
// Phase 2 TODO: live-capture-only camera (expo-camera, no gallery picker),
// auto-attach expo-location, POST /reporters/news with priority: BREAKING
// and a fast-track flag so it skips the normal review queue.

import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { COLORS, FONT_FAMILIES, EMERGENCY_TAGS } from '@/constants';

export default function EmergencyScreen() {
  const [description, setDescription] = useState('');
  const [tag, setTag] = useState(EMERGENCY_TAGS[0].id);
  const [sending, setSending] = useState(false);

  function handleSend() {
    setSending(true);
    setTimeout(() => {
      setSending(false);
      router.replace('/(tabs)/reports');
    }, 700);
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.close}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>அவசர செய்தி</Text>
        <Text style={styles.breakingChip}>breaking</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.intro}>
          விபத்து, தீ, வெள்ளம், சாலை மறியல் — உடனடியாக ஆசிரியர் குழுவுக்குச் செல்லும். சரிபார்ப்பு 5 நிமிடத்தில்.
        </Text>

        <TouchableOpacity style={styles.captureCard} activeOpacity={0.85}>
          <View style={styles.captureIcon}>
            <View style={styles.cameraBody} />
          </View>
          <Text style={styles.captureLabel}>இப்போதே படம் / வீடியோ எடு</Text>
          <Text style={styles.captureHint}>live capture only · no gallery</Text>
        </TouchableOpacity>

        <View style={styles.rowTwo}>
          <TouchableOpacity style={styles.miniCard} activeOpacity={0.85}>
            <Text style={styles.miniIcon}>🎙</Text>
            <Text style={styles.miniLabel}>குரல் 0:15</Text>
          </TouchableOpacity>
          <View style={[styles.miniCard, { borderColor: COLORS.success }]}>
            <Text style={[styles.miniIcon, { color: COLORS.success }]}>📍</Text>
            <Text style={[styles.miniLabel, { color: COLORS.success }]}>இடம் இணைந்தது</Text>
          </View>
        </View>

        <View>
          <Text style={styles.label}>what is happening</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            multiline
            placeholder="பெருந்துறை சாலையில் லாரி கவிழ்ந்து போக்குவரத்து நிறுத்தம்"
            placeholderTextColor={COLORS.inkLight}
            style={styles.descField}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7 }}>
          {EMERGENCY_TAGS.map((t) => (
            <TouchableOpacity
              key={t.id}
              onPress={() => setTag(t.id)}
              style={[styles.tagPill, tag === t.id && styles.tagPillActive]}
            >
              <Text style={[styles.tagText, tag === t.id && styles.tagTextActive]}>{t.nameTa}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.sendBtn} onPress={handleSend} activeOpacity={0.85}>
          <Text style={styles.sendLabel}>{sending ? '...' : 'உடனே அனுப்பு'}</Text>
        </TouchableOpacity>
        <Text style={styles.warn}>தவறான அவசர செய்தி strike ஆகக் கணக்கிடப்படும்</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.surface },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingTop: 56, paddingBottom: 16, backgroundColor: COLORS.primary },
  close: { fontSize: 15, color: '#fff' },
  title: { flex: 1, fontFamily: FONT_FAMILIES.displayBold, fontSize: 16, color: '#fff' },
  breakingChip: { fontFamily: FONT_FAMILIES.condensedBold, fontSize: 9.5, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase' },
  body: { padding: 16, gap: 16 },
  intro: { fontFamily: FONT_FAMILIES.bodyRegular, fontSize: 12.5, lineHeight: 20, color: COLORS.inkSecondary },
  captureCard: { borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 12, padding: 18, alignItems: 'center', gap: 12 },
  captureIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  cameraBody: { width: 26, height: 18, borderRadius: 4, borderWidth: 1.8, borderColor: '#fff' },
  captureLabel: { fontFamily: FONT_FAMILIES.displayBold, fontSize: 15, color: COLORS.ink },
  captureHint: { fontFamily: FONT_FAMILIES.condensedBold, fontSize: 9.5, color: COLORS.inkLight, textTransform: 'uppercase' },
  rowTwo: { flexDirection: 'row', gap: 9 },
  miniCard: { flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 9, padding: 11, alignItems: 'center', gap: 6 },
  miniIcon: { fontSize: 16 },
  miniLabel: { fontFamily: FONT_FAMILIES.displaySemiBold, fontSize: 12, color: COLORS.ink },
  label: { fontFamily: FONT_FAMILIES.condensedBold, fontSize: 9.5, color: COLORS.inkLight, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 7 },
  descField: { borderWidth: 1, borderColor: COLORS.ink, borderRadius: 9, padding: 12, minHeight: 70, fontFamily: FONT_FAMILIES.displayRegular, fontSize: 14, lineHeight: 22, color: COLORS.ink, textAlignVertical: 'top' },
  tagPill: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  tagPillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tagText: { fontFamily: FONT_FAMILIES.uiSemiBold, fontSize: 12, color: COLORS.inkSecondary },
  tagTextActive: { color: '#fff', fontFamily: FONT_FAMILIES.uiBold },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: COLORS.borderLight },
  sendBtn: { height: 56, borderRadius: 10, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  sendLabel: { fontFamily: FONT_FAMILIES.displayBold, fontSize: 17, color: '#fff' },
  warn: { textAlign: 'center', fontFamily: FONT_FAMILIES.bodyRegular, fontSize: 10.5, color: COLORS.inkLight, marginTop: 9 },
});
