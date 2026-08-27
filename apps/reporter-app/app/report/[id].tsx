// app/report/[id].tsx — Report detail. Rejected reports show the editor's
// note + fix checklist (design 1i); approved/pending show a simpler summary.

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import StatusBadge from '@/components/StatusBadge';
import Button from '@/components/Button';
import { COLORS, FONT_FAMILIES } from '@/constants';
import { MOCK_REPORTS } from '@/mocks/reporter';

export default function ReportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const report = MOCK_REPORTS.find((r) => r.id === id) ?? MOCK_REPORTS[0];

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{report.status === 'REJECTED' ? 'ஆசிரியர் குறிப்பு' : 'செய்தி விவரம்'}</Text>
        <StatusBadge status={report.status} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.headline}>{report.titleTa}</Text>
        <Text style={styles.meta}>
          submitted {new Date(report.submittedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toLowerCase()}
          {' · '}
          {new Date(report.submittedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
        </Text>

        {report.status === 'REJECTED' && (
          <>
            <View style={styles.noteCard}>
              <View style={styles.noteAvatar} />
              <View style={{ flex: 1 }}>
                <View style={styles.noteHead}>
                  <Text style={styles.reviewer}>{report.reviewerName ?? 'ஆசிரியர்'}</Text>
                  <Text style={styles.reviewerRole}>verification team</Text>
                </View>
                <Text style={styles.noteBody}>{report.rejectionReason}</Text>
              </View>
            </View>

            <View style={styles.notStrike}>
              <Text style={styles.notStrikeIcon}>✓</Text>
              <Text style={styles.notStrikeText}>இது strike இல்லை. திருத்தி அனுப்பலாம்.</Text>
            </View>

            {report.rejectionChecklist && report.rejectionChecklist.length > 0 && (
              <>
                <Text style={styles.label}>what to fix</Text>
                <View style={{ gap: 8 }}>
                  {report.rejectionChecklist.map((c) => (
                    <View key={c.label} style={styles.checkRow}>
                      <View style={styles.checkbox} />
                      <Text style={styles.checkLabel}>{c.label}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </>
        )}

        {report.status === 'APPROVED' && (
          <View style={styles.statsCard}>
            <View style={styles.statBlock}><Text style={styles.statValue}>{((report.views ?? 0) / 1000).toFixed(1)}K</Text><Text style={styles.statLabel}>views</Text></View>
            <View style={styles.statBlock}><Text style={styles.statValue}>{report.shares}</Text><Text style={styles.statLabel}>shares</Text></View>
            <View style={styles.statBlock}><Text style={[styles.statValue, { color: COLORS.success }]}>+{report.points}</Text><Text style={styles.statLabel}>points</Text></View>
          </View>
        )}

        {report.status === 'PENDING' && (
          <View style={styles.pendingCard}>
            <Text style={styles.pendingText}>ஆசிரியர் குழு பரிசீலிக்கிறது. பொதுவாக 24 மணி நேரத்தில் முடிவு தெரியும்.</Text>
          </View>
        )}
      </ScrollView>

      {report.status === 'REJECTED' && (
        <View style={styles.footer}>
          <Button label="திருத்தி மீண்டும் அனுப்பு" onPress={() => router.push('/upload-preview')} />
          <TouchableOpacity style={{ alignItems: 'center', marginTop: 10 }}>
            <Text style={styles.dismiss}>இந்தச் செய்தியை விடு</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.surface },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingTop: 56, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  back: { fontSize: 24, color: COLORS.ink },
  title: { flex: 1, fontFamily: FONT_FAMILIES.displayBold, fontSize: 16, color: COLORS.ink },
  body: { padding: 16 },
  headline: { fontFamily: FONT_FAMILIES.displayBold, fontSize: 17, lineHeight: 23, color: COLORS.ink },
  meta: { fontFamily: FONT_FAMILIES.condensedBold, fontSize: 9.5, color: COLORS.inkLight, marginTop: 6, textTransform: 'lowercase' },
  noteCard: { flexDirection: 'row', gap: 10, backgroundColor: COLORS.background, borderRadius: 11, padding: 13, marginTop: 16 },
  noteAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border },
  noteHead: { flexDirection: 'row', alignItems: 'baseline', gap: 7 },
  reviewer: { fontFamily: FONT_FAMILIES.displayBold, fontSize: 13, color: COLORS.ink },
  reviewerRole: { fontFamily: FONT_FAMILIES.condensedBold, fontSize: 9.5, color: COLORS.inkLight },
  noteBody: { fontFamily: FONT_FAMILIES.bodyRegular, fontSize: 13, lineHeight: 22, color: '#3f3b37', marginTop: 6 },
  notStrike: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.successBg, borderRadius: 9, padding: 11, marginTop: 12 },
  notStrikeIcon: { color: COLORS.success, fontFamily: FONT_FAMILIES.uiBold },
  notStrikeText: { flex: 1, fontFamily: FONT_FAMILIES.bodyRegular, fontSize: 11.5, lineHeight: 18, color: COLORS.inkSecondary },
  label: { fontFamily: FONT_FAMILIES.condensedBold, fontSize: 9.5, color: COLORS.inkLight, textTransform: 'uppercase', letterSpacing: 1, marginTop: 18, marginBottom: 9 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 11 },
  checkbox: { width: 16, height: 16, borderRadius: 4, borderWidth: 1.5, borderColor: COLORS.primary },
  checkLabel: { flex: 1, fontFamily: FONT_FAMILIES.displayRegular, fontSize: 13.5, color: COLORS.ink },
  statsCard: { flexDirection: 'row', gap: 24, backgroundColor: COLORS.background, borderRadius: 11, padding: 15, marginTop: 16 },
  statBlock: {},
  statValue: { fontFamily: FONT_FAMILIES.uiBold, fontSize: 18, color: COLORS.ink },
  statLabel: { fontFamily: FONT_FAMILIES.condensedBold, fontSize: 9.5, color: COLORS.inkLight, textTransform: 'uppercase' },
  pendingCard: { backgroundColor: COLORS.pendingBg, borderRadius: 11, padding: 14, marginTop: 16 },
  pendingText: { fontFamily: FONT_FAMILIES.bodyRegular, fontSize: 13, lineHeight: 21, color: '#8a6415' },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: COLORS.borderLight },
  dismiss: { fontFamily: FONT_FAMILIES.displayRegular, fontSize: 12.5, color: COLORS.inkLight },
});
