// src/components/StatusBadge.tsx
// The design's .st chip — small uppercase status pill with a status-specific
// bg/fg pair (approved=green, pending=amber, rejected=red).

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONT_FAMILIES, type NewsStatus } from '@/constants';

const MAP: Record<string, { bg: string; fg: string; label: string }> = {
  APPROVED: { bg: COLORS.successBg, fg: COLORS.success, label: 'approved' },
  PENDING: { bg: COLORS.pendingBg, fg: COLORS.pending, label: 'pending' },
  REJECTED: { bg: COLORS.rejectedBg, fg: COLORS.rejected, label: 'rejected' },
  BREAKING: { bg: COLORS.rejectedBg, fg: COLORS.rejected, label: 'breaking' },
  REGULAR: { bg: '#F5F1EB', fg: COLORS.inkSecondary, label: 'regular' },
};

export default function StatusBadge({ status }: { status: NewsStatus | 'BREAKING' | 'REGULAR' }) {
  const s = MAP[status] ?? MAP.PENDING;
  return (
    <View style={[styles.pill, { backgroundColor: s.bg }]}>
      <Text style={[styles.label, { color: s.fg }]}>{s.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  label: {
    fontFamily: FONT_FAMILIES.condensedBold,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
