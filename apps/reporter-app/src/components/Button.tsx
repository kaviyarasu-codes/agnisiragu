// src/components/Button.tsx
// Matches the design's .btnp (primary red), .btnd (dark), .btno (outline) —
// all 50px tall pills with a bold 700-weight label.

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { COLORS, FONT_FAMILIES } from '@/constants';

type Variant = 'primary' | 'dark' | 'outline';

interface Props {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  height?: number;
}

export default function Button({ label, onPress, variant = 'primary', disabled, loading, style, height = 50 }: Props) {
  const bg = variant === 'primary' ? COLORS.primary : variant === 'dark' ? COLORS.dark : 'transparent';
  const textColor = variant === 'outline' ? COLORS.ink : '#fff';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[
        styles.base,
        { backgroundColor: bg, height, opacity: disabled ? 0.55 : 1 },
        variant === 'outline' && styles.outline,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outline: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  label: {
    fontFamily: FONT_FAMILIES.displayBold,
    fontSize: 16,
  },
});
