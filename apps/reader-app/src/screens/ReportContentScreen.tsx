// src/screens/ReportContentScreen.tsx
// Screen 2w — report an article, reached from MoreActionsSheet's report row
// (/report/[id]). Submits to POST /reports/content — a best-effort endpoint
// name (no content-moderation-report route was visible in this build's
// backend view); confirm with backend and update submitReport() if it
// differs.

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAppStore } from '@/store/app.store';
import { useTheme } from '@/hooks/useTheme';
import { FONT_FAMILIES } from '@/constants';
import { post } from '@/lib/api';
import TextField from '@/components/ui/TextField';
import Button from '@/components/ui/Button';
import Icon from '@/components/icons/Icon';

const REASONS_TA = ['தவறான தகவல்', 'வெறுப்புணர்வு', 'பொருத்தமற்றது', 'ஸ்பேம்', 'மற்றவை'];
const REASONS_EN = ['Misinformation', 'Hate speech', 'Inappropriate', 'Spam', 'Other'];

async function submitReport(articleId: string, reason: string, detail: string): Promise<void> {
  await post('/reports/content', { articleId, reason, detail });
}

export default function ReportContentScreen() {
  const t = useTheme();
  const { language } = useAppStore();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [reasonIndex, setReasonIndex] = useState<number | null>(null);
  const [detail, setDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reasons = language === 'ta' ? REASONS_TA : REASONS_EN;

  async function handleSubmit() {
    if (reasonIndex === null) {
      Alert.alert('பிழை', language === 'ta' ? 'காரணத்தை தேர்ந்தெடுக்கவும்' : 'Please select a reason');
      return;
    }
    setSubmitting(true);
    try {
      await submitReport(id, REASONS_EN[reasonIndex], detail.trim());
      Alert.alert(
        language === 'ta' ? 'அறிக்கை அனுப்பப்பட்டது' : 'Report submitted',
        language === 'ta' ? 'எங்கள் குழு விரைவில் ஆய்வு செய்யும்' : 'Our team will review this shortly',
        [{ text: 'சரி', onPress: () => router.back() }],
      );
    } catch {
      Alert.alert('பிழை', language === 'ta' ? 'அனுப்ப முடியவில்லை' : 'Could not submit report');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: t.surface }]}>
      <View style={[styles.header, { borderBottomColor: t.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <Icon name="back" size={17} color={t.ink} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: t.ink }]}>
          {language === 'ta' ? 'செய்தியை புகாரளி' : 'Report Article'}
        </Text>
      </View>

      <View style={styles.body}>
        <Text style={[styles.h1, { color: t.ink }]}>
          {language === 'ta' ? 'ஏன் இதை புகாரளிக்கிறீர்கள்?' : 'Why are you reporting this?'}
        </Text>

        <View style={styles.reasonList}>
          {reasons.map((r, i) => {
            const active = reasonIndex === i;
            return (
              <TouchableOpacity
                key={r}
                style={[
                  styles.reasonRow,
                  { borderColor: active ? t.red : t.border, backgroundColor: active ? t.redSoft : t.surface },
                ]}
                onPress={() => setReasonIndex(i)}
              >
                <View style={[styles.radioDot, active ? { backgroundColor: t.red } : { borderWidth: 1.5, borderColor: t.border }]} />
                <Text style={[styles.reasonText, { color: active ? t.ink : t.inkSub }]}>{r}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TextField
          caption={language === 'ta' ? 'கூடுதல் விவரம் (விருப்பம்)' : 'Additional detail (optional)'}
          value={detail}
          onChangeText={setDetail}
          placeholder={language === 'ta' ? 'மேலும் ஏதேனும் சொல்ல விரும்புகிறீர்களா...' : 'Anything else you want to add...'}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          containerStyle={{ marginTop: 20 }}
          style={{ minHeight: 90, paddingTop: 11 }}
        />

        <Button
          label={language === 'ta' ? 'அனுப்பு' : 'Submit Report'}
          onPress={handleSubmit}
          loading={submitting}
          style={{ marginTop: 24 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { height: 52, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, borderBottomWidth: 1 },
  headerTitle: { fontFamily: FONT_FAMILIES.displayBold, fontSize: 16 },
  body: { padding: 22 },
  h1: { fontFamily: FONT_FAMILIES.displayBold, fontSize: 18, marginBottom: 16 },
  reasonList: { gap: 10 },
  reasonRow: { flexDirection: 'row', alignItems: 'center', gap: 11, borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13 },
  radioDot: { width: 9, height: 9, borderRadius: 4.5 },
  reasonText: { fontFamily: FONT_FAMILIES.displaySemiBold, fontSize: 14 },
});
