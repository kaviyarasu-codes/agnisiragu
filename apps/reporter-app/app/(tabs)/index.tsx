// app/(tabs)/index.tsx — Dashboard (design 1e)

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import StatusBadge from '@/components/StatusBadge';
import PlaceholderBox from '@/components/PlaceholderBox';
import { COLORS, FONT_FAMILIES } from '@/constants';
import { MOCK_REPORTER, MOCK_STATS, MOCK_REPORTS } from '@/mocks/reporter';

const SENIOR_THRESHOLD = 80;

export default function DashboardScreen() {
  const r = MOCK_REPORTER;
  const s = MOCK_STATS;
  const recent = MOCK_REPORTS.slice(0, 2);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.header} onPress={() => router.push('/profile')} activeOpacity={0.8}>
        <View style={styles.avatar} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.name}>{r.penName}</Text>
          <Text style={styles.verified}>verified · {r.taluk?.toLowerCase()}</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.trustCard}>
        <View style={styles.trustHead}>
          <Text style={styles.trustLabel}>trust score</Text>
          <Text style={styles.strikes}>{r.strikeCount} STRIKES</Text>
        </View>
        <View style={styles.trustScoreRow}>
          <Text style={styles.trustScore}>{r.trustScore}</Text>
          <Text style={styles.trustMax}>/ 100 · SENIOR-க்கு {SENIOR_THRESHOLD}</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${r.trustScore}%` }]} />
        </View>
        <View style={styles.trustStats}>
          <View>
            <Text style={styles.trustStatValue}>{s.approvedCount}</Text>
            <Text style={styles.trustStatLabel}>approved</Text>
          </View>
          <View>
            <Text style={[styles.trustStatValue, { color: COLORS.gold }]}>{s.pendingCount}</Text>
            <Text style={styles.trustStatLabel}>pending</Text>
          </View>
          <View>
            <Text style={styles.trustStatValue}>{s.totalPoints.toLocaleString('en-IN')}</Text>
            <Text style={styles.trustStatLabel}>points</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.emergencyCard} onPress={() => router.push('/emergency')} activeOpacity={0.85}>
        <View style={styles.emergencyIcon}>
          <View style={styles.emergencyTriangle} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.emergencyTitle}>அவசர செய்தி</Text>
          <Text style={styles.emergencyBody}>விபத்து, தீ, மழை — உடனே அனுப்பு</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>

      <View style={styles.sectionHead}>
        <Text style={styles.sectionLabel}>my reports</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/reports')}>
          <Text style={styles.seeAll}>அனைத்தும்</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.reportsCard}>
        {recent.map((item, i) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.reportRow, i === recent.length - 1 && { borderBottomWidth: 0 }]}
            onPress={() => router.push(`/report/${item.id}`)}
            activeOpacity={0.8}
          >
            <PlaceholderBox style={styles.reportThumb} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.reportTitle} numberOfLines={1}>{item.titleTa}</Text>
              <Text style={styles.reportMeta}>
                {item.points ? `+${item.points} pts · ` : ''}
                {new Date(item.submittedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toLowerCase()}
              </Text>
            </View>
            <StatusBadge status={item.status} />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 12, paddingTop: 56, gap: 11 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 4, marginBottom: 2 },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border },
  name: { fontFamily: FONT_FAMILIES.displayBold, fontSize: 14, color: COLORS.ink },
  verified: { fontFamily: FONT_FAMILIES.condensedBold, fontSize: 9, color: COLORS.success, textTransform: 'uppercase', letterSpacing: 0.6 },

  trustCard: { backgroundColor: COLORS.dark, borderRadius: 12, padding: 16 },
  trustHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  trustLabel: { flex: 1, fontFamily: FONT_FAMILIES.condensedBold, fontSize: 9.5, color: COLORS.inkOnDark, textTransform: 'uppercase', letterSpacing: 1 },
  strikes: { fontFamily: FONT_FAMILIES.uiBold, fontSize: 10, color: COLORS.inkOnDark },
  trustScoreRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 9, marginTop: 5 },
  trustScore: { fontFamily: FONT_FAMILIES.uiBold, fontSize: 30, color: '#fff', lineHeight: 32 },
  trustMax: { fontFamily: FONT_FAMILIES.displayRegular, fontSize: 12, color: COLORS.inkOnDark, paddingBottom: 4 },
  progressTrack: { height: 6, borderRadius: 4, backgroundColor: '#332e2b', overflow: 'hidden', marginTop: 12 },
  progressFill: { height: '100%', backgroundColor: COLORS.primary },
  trustStats: { flexDirection: 'row', gap: 20, marginTop: 14, paddingTop: 13, borderTopWidth: 1, borderTopColor: '#332e2b' },
  trustStatValue: { fontFamily: FONT_FAMILIES.uiBold, fontSize: 15, color: '#fff' },
  trustStatLabel: { fontFamily: FONT_FAMILIES.condensedBold, fontSize: 9.5, color: COLORS.inkOnDark, textTransform: 'uppercase' },

  emergencyCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 11, padding: 13 },
  emergencyIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  emergencyTriangle: { width: 16, height: 14, borderLeftWidth: 8, borderRightWidth: 8, borderBottomWidth: 14, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#fff' },
  emergencyTitle: { fontFamily: FONT_FAMILIES.displayBold, fontSize: 15, color: COLORS.ink },
  emergencyBody: { fontFamily: FONT_FAMILIES.bodyRegular, fontSize: 11.5, color: COLORS.inkSecondary, marginTop: 2 },
  chevron: { fontSize: 20, color: COLORS.primary },

  sectionHead: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 2 },
  sectionLabel: { flex: 1, fontFamily: FONT_FAMILIES.condensedBold, fontSize: 9.5, color: COLORS.inkLight, textTransform: 'uppercase', letterSpacing: 1 },
  seeAll: { fontFamily: FONT_FAMILIES.uiSemiBold, fontSize: 11.5, color: COLORS.primary },

  reportsCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border, borderRadius: 11, overflow: 'hidden' },
  reportRow: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 11, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  reportThumb: { width: 52, height: 40, borderRadius: 5 },
  reportTitle: { fontFamily: FONT_FAMILIES.displaySemiBold, fontSize: 13, color: COLORS.ink },
  reportMeta: { fontFamily: FONT_FAMILIES.condensedBold, fontSize: 9.5, color: COLORS.inkLight, marginTop: 3, textTransform: 'lowercase' },
});
