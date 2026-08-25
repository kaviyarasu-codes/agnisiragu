// src/components/ui/TextField.tsx
// The design's `.fld` input shell: 1px border, 9px radius, 11/12 padding.
// Renders a labeled "chip" caption above the field (the design's small
// uppercase `.chip` label — "current", "new number", "from", "to", etc.)

import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { FONT_FAMILIES } from '@/constants';

interface TextFieldProps extends TextInputProps {
  caption?: string;
  focused?: boolean;
  disabled?: boolean;
  /** Spacing around the whole caption+field group (e.g. marginTop to the previous field). `style` targets the input itself (minHeight, paddingTop, etc.) — keep the two separate so margin doesn't land between the caption and the box. */
  containerStyle?: ViewStyle;
}

export default function TextField({ caption, focused, disabled, style, containerStyle, ...rest }: TextFieldProps) {
  const t = useTheme();
  return (
    <View style={containerStyle}>
      {caption ? (
        <Text style={[styles.caption, { color: t.inkMuted }]}>{caption}</Text>
      ) : null}
      <TextInput
        placeholderTextColor={t.inkMuted}
        style={[
          styles.field,
          {
            borderColor: focused ? t.ink : t.border,
            color: t.ink,
            backgroundColor: disabled ? t.bgAlt : t.surface,
            fontFamily: FONT_FAMILIES.uiSemiBold,
          },
          style,
        ]}
        editable={!disabled}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  caption: {
    fontFamily: FONT_FAMILIES.condensedBold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 7,
  },
  field: {
    borderWidth: 1,
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
  },
});
