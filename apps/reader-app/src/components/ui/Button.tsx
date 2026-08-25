// src/components/ui/Button.tsx
// The design's three button styles: .btnp (solid red), .btnd (solid dark),
// .btno (outline). All are 50px tall with a 10px radius by default.

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { FONT_FAMILIES } from '@/constants';

type Variant = 'primary' | 'dark' | 'outline';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  height?: number;
  style?: ViewStyle;
  tamil?: boolean; // use the Tamil display font (default true — most CTAs are Tamil)
}

export default function Button({
  label, onPress, variant = 'primary', loading, disabled, height = 50, style, tamil = true,
}: ButtonProps) {
  const t = useTheme();
  const bg = variant === 'primary' ? t.red : variant === 'dark' ? t.ink900 : 'transparent';
  const borderColor = variant === 'outline' ? t.border : 'transparent';
  const textColor = variant === 'outline' ? t.ink : '#fff';

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.base,
        { height, backgroundColor: bg, borderColor, borderWidth: variant === 'outline' ? 1.5 : 0 },
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text
          style={[
            styles.label,
            { color: textColor, fontFamily: tamil ? FONT_FAMILIES.displayBold : FONT_FAMILIES.uiSemiBold },
          ]}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  disabled: { opacity: 0.55 },
  label: { fontSize: 16 },
});
