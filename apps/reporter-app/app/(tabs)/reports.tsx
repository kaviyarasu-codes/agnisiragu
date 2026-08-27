// app/(tabs)/reports.tsx — My reports, filterable by status (design 1h)

import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { router } from 'expo-router';
import StatusBadge from '@/components/StatusBadge';
import { COLORS, FONT_FAMILIES, type NewsStatus } from '@/constants';
import { MOCK_REPORTS } from '@/mocks/reporter';

type Filter = 'ALL' | NewsStatus;

const FILTERS: { key: Filter; labelTa: string }[] = [
  { key: 'ALL', labelTa: 'அனைத்தும்' },
  { key: 'APPROVED', labelTa: 'APPROVED' },
  { key: 'PENDING', labelTa: 'PENDING' },
  { key: 'REJECTED', labelTa: 'REJECTED' },
];

export default function ReportsScreen() {
  const [filter, setFilter] = useState<Filter>('ALL');

  const counts = useMemo(() => ({
    ALL: MOCK_REPORTS.length,
    APPROVED: MOCK_REPORTS.filter((r) => r.status === 'APPROVED').length,
    PENDING: MOCK_REPORTS.filter((r) => r.status === 'PENDING').length,
    REJECTED: MOCK_REPORTS.filter((r) => r.status === 'REJECTED').length,
  }), []);

  const filtered = filter === 'ALL' ? MOCK_REPORTS : MOCK_REPORTS.filter((r) => r.status === filter);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>என் செய்திகள்</Text>
        <Text style={styles.search}>🔍</Text>
      </View>

      <View style={styles.filterRow}>
        <FlatList
          horizontal
          data={FILTERS}
          keyExtractor={(f) => f.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 7, paddingHorizontal: 12 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setFilter(item.key)}
              style={[styles.filterPill, filter === item.key && styles.filterPillActive]}
            >
              <Text style={[styles.filterText, filter === item.key && styles.filterTextActive]}>
                {item.labelTa} {counts[item.key]}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => router.push(`/report/${item.id}`)} activeOpacity={0.85}>
            <View style={styles.cardHead}>
              <StatusBadge status={item.status} />
              {item.priority === 'BREAKING' && <StatusBadge status="BREAKING" />}
              <Text style={styles.time}>
                {new Date(item.submittedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toLowerCase()}
              </Text>
            </View>
            <Text style={styles.cardTitle} numberOfLines={2}>{item.titleTa}</Text>

            {item.status === 'APPROVED' && (
              <View style={styles.statsRow}>
                <Text style={styles.statText}>{((item.views ?? 0) / 1000).toFixed(1)}K views</Text>
                <Text style={styles.statText}>{item.shares} shares</Text>
                <Text style={styles.statPoints}>+{item.points} pts</Text>
              </View>
            )}
            {item.status === 'PENDING' && (
              <Text style={styles.pendingHint}>ஆசிரியர் குழு பரிசீலிக்கிறது</Text>
            )}
            {item.status === 'REJECTED' && (
              <Text style={styles.rejectedHint}>படம் தெளிவாக இல்லை — காரணம் பார்க்க தட்டவும்</Text>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 10, backgroundColor: COLORS.background },
  title: { flex: 1, fontFamily: FONT_FAMILIES.displayBold, fontSize: 16, color: COLORS.ink },
  search: { fontSize: 15 },
  filterRow: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingVertical: 10 },
  filterPill: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  filterPillActive: { backgroundColor: COLORS.dark, borderColor: COLORS.dark },
  filterText: { fontFamily: FONT_FAMILIES.uiSemiBold, fontSize: 12, color: COLORS.inkSecondary },
  filterTextActive: { color: '#fff', fontFamily: FONT_FAMILIES.uiBold },
  list: { padding: 12, gap: 9 },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  time: { marginLeft: 'auto', fontFamily: FONT_FAMILIES.condensedBold, fontSize: 9.5, color: COLORS.inkLight },
  cardTitle: { fontFamily: FONT_FAMILIES.displayBold, fontSize: 14.5, lineHeight: 19, color: COLORS.ink, marginTop: 8 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 9, paddingTop: 9, borderTopWidth: 1, borderTopColor: COLORS.borderLight },
  statText: { fontFamily: FONT_FAMILIES.uiSemiBold, fontSize: 11, color: COLORS.inkSecondary },
  statPoints: { marginLeft: 'auto', fontFamily: FONT_FAMILIES.uiBold, fontSize: 11, color: COLORS.success },
  pendingHint: { fontFamily: FONT_FAMILIES.bodyRegular, fontSize: 11.5, color: COLORS.inkLight, marginTop: 8 },
  rejectedHint: { fontFamily: FONT_FAMILIES.bodyRegular, fontSize: 12, lineHeight: 18, color: COLORS.primary, marginTop: 7 },
});
