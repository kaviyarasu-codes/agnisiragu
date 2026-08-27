// app/account-status.tsx — Account path (design 1d)
// Shown right after registration: TEMPORARY → VERIFIED → SENIOR → PRESS_ID.
// A freshly registered reporter always starts at TEMPORARY, independent of
// the mock dashboard data (which represents an already-established account).

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import Button from '@/components/Button';
import { COLORS, FONT_FAMILIES } from '@/constants';

const STEPS = [
  { key: 'TEMPORARY', titleTa: 'செய்தி அனுப்பலாம். ஒவ்வொன்றும் சரிபார்க்கப்படும்.' },
  { key: 'VERIFIED', titleTa: 'அடையாளம் சரிபார்ப்பு + 5 ஒப்புதல் பெற்ற செய்திகள்.' },
  { key: 'SENIOR', titleTa: 'நம்பிக்கை மதிப்பு 80+ · அதிக ஊக்கப் புள்ளிகள்.' },
  { key: 'PRESS_ID', titleTa: '30 நாள் திட்டத்தை முடித்தால் அதிகாரப்பூர்வ அடையாள அட்டை.' },
];

const CURRENT = 'TEMPORARY';

export default function AccountStatusScreen() {
  const currentIndex = STEPS.findIndex((s) => s.key === CURRENT);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>உங்கள் நிலை</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>temporary</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.intro}>
          இப்போது தற்காலிக நிருபர். செய்தி அனுப்பத் தொடங்கலாம் — ஒவ்வொரு ஒப்புதலும் அடுத்த நிலைக்கு நெருக்கமாக்கும்.
        </Text>

        <View style={{ marginTop: 18 }}>
          {STEPS.map((step, i) => {
            const isCurrent = i === currentIndex;
            const isPast = i < currentIndex;
            const isLast = i === STEPS.length - 1;
            return (
              <View key={step.key} style={styles.row}>
                <View style={styles.rail}>
                  <View style={[styles.node, (isCurrent || isPast) && styles.nodeActive]} />
                  {!isLast && <View style={styles.line} />}
                </View>
                <View style={styles.rowBody}>
                  <View style={styles.rowHead}>
                    <Text style={[styles.stepKey, (isCurrent || isPast) && styles.stepKeyActive]}>{step.key}</Text>
                    {isCurrent && (
                      <View style={styles.hereChip}>
                        <Text style={styles.hereChipText}>you are here</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.stepBody}>{step.titleTa}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button label="முதல் செய்தியை அனுப்பு" onPress={() => router.replace('/(tabs)')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.surface },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingTop: 56, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  title: { flex: 1, fontFamily: FONT_FAMILIES.displayBold, fontSize: 16, color: COLORS.ink },
  badge: { backgroundColor: '#FFF8E8', borderRadius: 4, paddingHorizontal: 7, paddingVertical: 3 },
  badgeText: { fontFamily: FONT_FAMILIES.condensedBold, fontSize: 9, color: COLORS.pending, textTransform: 'uppercase', letterSpacing: 1 },
  content: { padding: 18 },
  intro: { fontFamily: FONT_FAMILIES.bodyRegular, fontSize: 13, lineHeight: 22, color: COLORS.inkSecondary },
  row: { flexDirection: 'row', gap: 13 },
  rail: { width: 20, alignItems: 'center' },
  node: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: COLORS.border },
  nodeActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  line: { width: 2, flex: 1, minHeight: 44, backgroundColor: COLORS.borderLight },
  rowBody: { flex: 1, paddingBottom: 20 },
  rowHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepKey: { fontFamily: FONT_FAMILIES.uiBold, fontSize: 11, color: COLORS.inkSecondary },
  stepKeyActive: { color: COLORS.primary },
  hereChip: { backgroundColor: '#FDF4F4', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  hereChipText: { fontFamily: FONT_FAMILIES.condensedBold, fontSize: 9, color: COLORS.primary, textTransform: 'uppercase' },
  stepBody: { fontFamily: FONT_FAMILIES.bodyRegular, fontSize: 12.5, lineHeight: 20, color: COLORS.inkSecondary, marginTop: 4 },
  footer: { padding: 18, borderTopWidth: 1, borderTopColor: COLORS.borderLight },
});
