// app/profile.tsx — Profile & press ID card (design 1l)

import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { COLORS, FONT_FAMILIES } from '@/constants';
import { MOCK_REPORTER } from '@/mocks/reporter';

const PROGRAM_DAYS = 30;

export default function ProfileScreen() {
  const r = MOCK_REPORTER;
  const dayIndex = 22; // TODO Phase 2: derive from r.programStartedAt vs. today
  const approvedInProgram = 21;
  const daysLeft = PROGRAM_DAYS - dayIndex;
  const progressPct = Math.round((dayIndex / PROGRAM_DAYS) * 100);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>சுயவிவரம்</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)')}>
          <Text style={styles.settingsIcon}>⚙</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.card}>
          <Image source={require('../assets/wing.png')} style={styles.cardWing} />
          <View style={styles.cardTop}>
            <Image source={require('../assets/logo.png')} style={styles.cardLogo} />
            <View style={{ flex: 1 }} />
            <Text style={styles.pressIdChip}>press id</Text>
          </View>
          <View style={styles.cardMain}>
            <View style={styles.photo} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.penName}>{r.penName}</Text>
              <Text style={styles.realName}>{r.realName}</Text>
              <View style={{ marginTop: 9, gap: 3 }}>
                <Text style={styles.idLine}>ID · {r.pressIdNumber}</Text>
                <Text style={styles.idLine}>{r.taluk?.toUpperCase()} · {r.district}</Text>
                <Text style={styles.idLine}>VALID TILL {r.pressIdValidTill}</Text>
              </View>
            </View>
            <View style={styles.qr}>
              {Array.from({ length: 16 }).map((_, i) => (
                <View key={i} style={{ backgroundColor: [0, 2, 3, 5, 7, 8, 10, 12, 13, 15].includes(i) ? COLORS.dark : 'transparent' }} />
              ))}
            </View>
          </View>
        </View>

        <View style={styles.programCard}>
          <View style={styles.programHead}>
            <Text style={styles.programLabel}>30-day press id program</Text>
            <Text style={styles.programDay}>DAY {dayIndex} / {PROGRAM_DAYS}</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
          </View>
          <Text style={styles.programHint}>
            {daysLeft} நாட்களில் நிரந்தர அடையாள அட்டை. இதுவரை {approvedInProgram} செய்திகள் ஒப்புதல்.
          </Text>
        </View>

        <View style={styles.settingsCard}>
          <View style={styles.statsRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.miniLabel}>status</Text>
              <Text style={[styles.miniValue, { color: COLORS.success }]}>{r.status}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.miniLabel}>trust score</Text>
              <Text style={styles.miniValue}>{r.trustScore} / 100</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.miniLabel}>strikes</Text>
              <Text style={styles.miniValue}>{r.strikeCount}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.listRow}><Text style={styles.listLabel}>பொது சுயவிவரம் திருத்து</Text><Text style={styles.chevron}>›</Text></TouchableOpacity>
          <View style={styles.listRow}>
            <Text style={styles.listLabel}>புனைபெயரில் வெளியிடு</Text>
            <View style={[styles.toggle, r.usePenName && styles.toggleOn]}>
              <View style={[styles.toggleKnob, r.usePenName && styles.toggleKnobOn]} />
            </View>
          </View>
          <View style={styles.listRow}>
            <Text style={styles.listLabel}>அடையாள ஆவணங்கள்</Text>
            <Text style={styles.verifiedTag}>verified</Text>
          </View>
          <TouchableOpacity style={[styles.listRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.listLabel}>அட்டையைப் பதிவிறக்கு</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 10 },
  title: { flex: 1, fontFamily: FONT_FAMILIES.displayBold, fontSize: 16, color: COLORS.ink },
  settingsIcon: { fontSize: 16, color: COLORS.inkSecondary },
  body: { padding: 12, gap: 11 },
  card: { backgroundColor: COLORS.dark, borderRadius: 12, padding: 15, overflow: 'hidden' },
  cardWing: { position: 'absolute', right: -10, bottom: -14, height: 104, width: 90, opacity: 0.13, resizeMode: 'contain' },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  cardLogo: { height: 15, width: 70, resizeMode: 'contain', tintColor: '#fff' },
  pressIdChip: { fontFamily: FONT_FAMILIES.condensedBold, fontSize: 9.5, color: COLORS.gold, textTransform: 'uppercase', letterSpacing: 1 },
  cardMain: { flexDirection: 'row', gap: 13, marginTop: 14 },
  photo: { width: 64, height: 78, borderRadius: 5, backgroundColor: '#332e2b' },
  penName: { fontFamily: FONT_FAMILIES.displayBold, fontSize: 18, color: '#fff' },
  realName: { fontFamily: FONT_FAMILIES.bodyRegular, fontSize: 11, color: COLORS.inkOnDark, marginTop: 2 },
  idLine: { fontFamily: 'ui-monospace', fontSize: 10, color: COLORS.inkOnDark },
  qr: { width: 44, height: 44, backgroundColor: '#fff', display: 'grid' as any, flexDirection: 'row', flexWrap: 'wrap', padding: 3 } as any,
  programCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border, borderRadius: 11, padding: 13 },
  programHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  programLabel: { flex: 1, fontFamily: FONT_FAMILIES.condensedBold, fontSize: 9.5, color: COLORS.inkLight, textTransform: 'uppercase', letterSpacing: 1 },
  programDay: { fontFamily: 'ui-monospace', fontSize: 11, fontWeight: '700', color: COLORS.primary },
  progressTrack: { height: 7, borderRadius: 4, backgroundColor: COLORS.borderLight, overflow: 'hidden', marginTop: 9 },
  progressFill: { height: '100%', backgroundColor: COLORS.primary },
  programHint: { fontFamily: FONT_FAMILIES.bodyRegular, fontSize: 11.5, lineHeight: 18, color: COLORS.inkSecondary, marginTop: 9 },
  settingsCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border, borderRadius: 11, overflow: 'hidden' },
  statsRow: { flexDirection: 'row', gap: 12, padding: 13, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  miniLabel: { fontFamily: FONT_FAMILIES.condensedBold, fontSize: 9.5, color: COLORS.inkLight, textTransform: 'uppercase' },
  miniValue: { fontFamily: 'ui-monospace', fontSize: 12, fontWeight: '700', color: COLORS.ink, marginTop: 3 },
  listRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  listLabel: { flex: 1, fontFamily: FONT_FAMILIES.displayRegular, fontSize: 14, color: COLORS.ink },
  chevron: { fontSize: 16, color: COLORS.inkLight },
  verifiedTag: { fontFamily: FONT_FAMILIES.condensedBold, fontSize: 9.5, color: COLORS.success, textTransform: 'uppercase' },
  toggle: { width: 36, height: 20, borderRadius: 12, backgroundColor: COLORS.border, justifyContent: 'center' },
  toggleOn: { backgroundColor: COLORS.primary },
  toggleKnob: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#fff', marginLeft: 2 },
  toggleKnobOn: { marginLeft: 18 },
});
