// app/(tabs)/rewards.tsx — Rewards & wallet (design 1k)

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { COLORS, FONT_FAMILIES } from '@/constants';
import { MOCK_STATS, MOCK_REWARDS } from '@/mocks/reporter';

export default function RewardsScreen() {
  const s = MOCK_STATS;
  const [claiming, setClaiming] = useState(false);

  function handleClaim() {
    // Phase 2 TODO: POST /reporters/rewards/claim, then Razorpay payout flow
    setClaiming(true);
    setTimeout(() => {
      setClaiming(false);
      Alert.alert('கோரிக்கை பதிவு செய்யப்பட்டது', 'வெகுமதி விரைவில் செலுத்தப்படும்.');
    }, 600);
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>வெகுமதிகள்</Text>
        <Text style={styles.week}>week 34 · 2026</Text>
      </View>

      <ScrollView>
        <View style={styles.walletCard}>
          <Text style={styles.walletLabel}>unclaimed points</Text>
          <View style={styles.walletAmountRow}>
            <Text style={styles.walletAmount}>{s.unclaimedPoints.toLocaleString('en-IN')}</Text>
            <Text style={styles.walletApprox}>≈ ₹{s.unclaimedPoints.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.walletFooter}>
            <Text style={styles.walletHint}>வாரம் முடிந்ததும் பெறலாம்</Text>
            <TouchableOpacity style={styles.claimBtn} onPress={handleClaim} disabled={claiming}>
              <Text style={styles.claimLabel}>{claiming ? '...' : 'பெற'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View>
            <Text style={styles.statLabel}>claimed</Text>
            <Text style={styles.statValue}>{s.claimedPoints.toLocaleString('en-IN')}</Text>
          </View>
          <View>
            <Text style={styles.statLabel}>this week</Text>
            <Text style={styles.statValue}>{s.weekPoints}</Text>
          </View>
          <View>
            <Text style={styles.statLabel}>rank</Text>
            <Text style={[styles.statValue, { color: COLORS.success }]}>#{s.rank}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>recent rewards</Text>

        <View style={styles.list}>
          {MOCK_REWARDS.map((r, i) => (
            <View key={r.id} style={[styles.row, i === MOCK_REWARDS.length - 1 && { borderBottomWidth: 0 }, r.claimed && { opacity: 0.55 }]}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.rowTitle} numberOfLines={1}>{r.newsTitleTa}</Text>
                <Text style={styles.rowMeta}>{r.category}</Text>
              </View>
              <Text style={[styles.rowPoints, r.claimed && { color: COLORS.inkLight, fontFamily: FONT_FAMILIES.uiSemiBold }]}>+{r.points}</Text>
            </View>
          ))}
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>UPI · kaviyarasu@okaxis</Text>
              <Text style={styles.rowMeta}>payout method</Text>
            </View>
            <Text style={styles.changeLink}>change</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 10 },
  title: { flex: 1, fontFamily: FONT_FAMILIES.displayBold, fontSize: 16, color: COLORS.ink },
  week: { fontFamily: FONT_FAMILIES.condensedBold, fontSize: 9.5, color: COLORS.inkLight, textTransform: 'uppercase' },
  walletCard: { backgroundColor: COLORS.dark, padding: 18 },
  walletLabel: { fontFamily: FONT_FAMILIES.condensedBold, fontSize: 9.5, color: COLORS.inkOnDark, textTransform: 'uppercase', letterSpacing: 1 },
  walletAmountRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 9, marginTop: 4 },
  walletAmount: { fontFamily: FONT_FAMILIES.uiBold, fontSize: 32, color: '#fff', lineHeight: 35 },
  walletApprox: { fontFamily: FONT_FAMILIES.displayRegular, fontSize: 13, color: COLORS.inkOnDark, paddingBottom: 5 },
  walletFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  walletHint: { flex: 1, fontFamily: FONT_FAMILIES.bodyRegular, fontSize: 11.5, color: COLORS.inkOnDark },
  claimBtn: { backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 7 },
  claimLabel: { fontFamily: FONT_FAMILIES.displayBold, fontSize: 12, color: COLORS.ink },
  statsRow: { flexDirection: 'row', gap: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: COLORS.border, padding: 13, paddingHorizontal: 16 },
  statLabel: { fontFamily: FONT_FAMILIES.condensedBold, fontSize: 9.5, color: COLORS.inkLight, textTransform: 'uppercase' },
  statValue: { fontFamily: FONT_FAMILIES.uiBold, fontSize: 15, color: COLORS.ink, marginTop: 2 },
  sectionLabel: { fontFamily: FONT_FAMILIES.condensedBold, fontSize: 9.5, color: COLORS.inkLight, textTransform: 'uppercase', letterSpacing: 1, padding: 16, paddingBottom: 7 },
  list: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: COLORS.border },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  rowTitle: { fontFamily: FONT_FAMILIES.displaySemiBold, fontSize: 13.5, color: COLORS.ink },
  rowMeta: { fontFamily: FONT_FAMILIES.condensedBold, fontSize: 9.5, color: COLORS.inkLight, marginTop: 3, textTransform: 'lowercase' },
  rowPoints: { fontFamily: FONT_FAMILIES.uiBold, fontSize: 12, color: COLORS.success },
  changeLink: { fontFamily: FONT_FAMILIES.displaySemiBold, fontSize: 12, color: COLORS.primary },
});
