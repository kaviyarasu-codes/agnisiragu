// src/components/ui/EmptyState.tsx
// Shared shell for the design's empty/error/offline states (2o offline,
// 2p empty bookmarks, 2q error) — icon, title, description, optional CTA.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { FONT_FAMILIES } from '@/constants';
import Button from './Button';
import Icon, { IconName } from '../icons/Icon';

interface EmptyStateProps {
  icon: IconName;
  title: string;
  description?: string;
  meta?: string; // small mono caption, e.g. "ERR 500 · REQ 8f21c4"
  ctaLabel?: string;
  onCta?: () => void;
  ctaVariant?: 'primary' | 'dark' | 'outline';
  secondaryLabel?: string;
  onSecondary?: () => void;
}

export default function EmptyState({
  icon, title, description, meta, ctaLabel, onCta, ctaVariant = 'dark', secondaryLabel, onSecondary,
}: EmptyStateProps) {
  const t = useTheme();
  return (
    <View style={styles.container}>
      <Icon name={icon} size={icon === 'warningTriangle' ? 52 : 54} color={t.red} />
      <Text style={[styles.title, { color: t.ink }]}>{title}</Text>
      {description ? (
        <Text style={[styles.desc, { color: t.inkSub }]}>{description}</Text>
      ) : null}
      {meta ? <Text style={[styles.meta, { color: t.inkMuted }]}>{meta}</Text> : null}
      {ctaLabel ? (
        <Button label={ctaLabel} onPress={onCta} variant={ctaVariant} style={styles.cta} />
      ) : null}
      {secondaryLabel ? (
        <Text style={[styles.secondary, { color: t.red }]} onPress={onSecondary}>
          {secondaryLabel}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 34 },
  title: { fontFamily: FONT_FAMILIES.displayBold, fontSize: 20, marginTop: 22, textAlign: 'center' },
  desc: { fontFamily: FONT_FAMILIES.bodyRegular, fontSize: 13.5, lineHeight: 23, marginTop: 9, textAlign: 'center' },
  meta: { fontFamily: 'ui-monospace', fontSize: 10, marginTop: 14, letterSpacing: 0.5 },
  cta: { width: '100%', marginTop: 24 },
  secondary: { fontFamily: FONT_FAMILIES.displaySemiBold, fontSize: 12.5, marginTop: 16 },
});
