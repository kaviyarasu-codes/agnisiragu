// src/components/ui/Chip.tsx
// Pill chip used for category tabs, district/search filters, and the small
// uppercase "chip" labels (.chip class) scattered through the design.

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { FONT_FAMILIES } from '@/constants';

interface ChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
  tamil?: boolean;
  style?: ViewStyle;
  /** 'solid' = filled dark pill when active (category tabs); 'outline' = bordered pill (filters) */
  activeStyle?: 'solid' | 'outline';
}

export default function Chip({ label, active, onPress, tamil = true, style, activeStyle = 'solid' }: ChipProps) {
  const t = useTheme();
  const activeBg = activeStyle === 'solid' ? t.red : t.ink900;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? activeBg : 'transparent',
          borderColor: active ? activeBg : t.border,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            color: active ? '#fff' : t.inkSub,
            fontFamily: tamil ? FONT_FAMILIES.displaySemiBold : FONT_FAMILIES.uiSemiBold,
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/** The small uppercase caption used above fields/sections ("current", "from", "share to"…) */
export function Caption({ label, color }: { label: string; color?: string }) {
  const t = useTheme();
  return (
    <Text style={[styles.caption, { color: color ?? t.inkMuted }]}>{label}</Text>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  label: { fontSize: 13 },
  caption: {
    fontFamily: FONT_FAMILIES.condensedBold,
    fontSize: 10.5,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
