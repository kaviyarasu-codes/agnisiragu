// src/components/ui/Avatar.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/hooks/useTheme';
import { FONT_FAMILIES } from '@/constants';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
}

export default function Avatar({ uri, name, size = 44 }: AvatarProps) {
  const t = useTheme();
  const initial = name?.trim()?.[0]?.toUpperCase();

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: t.bgAlt }}
        contentFit="cover"
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: t.bgAlt, borderColor: t.border },
      ]}
    >
      {initial ? (
        <Text style={[styles.initial, { color: t.inkSub, fontSize: size * 0.4 }]}>{initial}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  initial: { fontFamily: FONT_FAMILIES.displayBold },
});
