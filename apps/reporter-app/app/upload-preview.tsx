// app/upload-preview.tsx — Upload step 3–4: AI text preview, category, submit (design 1g)
// Phase 1: headline/body are pre-filled with placeholder "AI transcript" text,
// fully editable. Phase 2 TODO: receive the real Whisper transcript from the
// upload screen (route param or shared store) and POST /reporters/news on submit.

import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import Button from '@/components/Button';
import { COLORS, FONT_FAMILIES, CATEGORIES, type NewsPriority } from '@/constants';

const PRIORITIES: NewsPriority[] = ['BREAKING', 'REGULAR', 'LOW'];

export default function UploadPreviewScreen() {
  const [headline, setHeadline] = useState('நகராட்சி கூட்டத்தில் போக்குவரத்து திட்டம் ஒப்புதல்');
  const [body, setBody] = useState(
    'நகராட்சி மாதாந்திர கூட்டத்தில் புதிய போக்குவரத்து திட்டத்திற்கு ஒப்புதல் அளிக்கப்பட்டது. மூன்று வழித்தடங்களில் சிறு பேருந்துகள் இயக்கப்படும் என்று தலைவர் தெரிவித்தார். எதிர்க்கட்சி உறுப்பினர்கள் கட்டண விவரம் கேட்டனர்.',
  );
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [priority, setPriority] = useState<NewsPriority>('REGULAR');
  const [showCategories, setShowCategories] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit() {
    setSubmitting(true);
    // Phase 2 TODO: POST /reporters/news { titleTa: headline, bodyTa: body, category: category.id, priority, location, mediaUrls }
    setTimeout(() => {
      setSubmitting(false);
      router.replace('/(tabs)/reports');
    }, 700);
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>எழுத்து முன்னோட்டம்</Text>
        <Text style={styles.step}>step 4 / 4</Text>
      </View>
      <View style={styles.progressTrack}><View style={styles.progressFill} /></View>

      <ScrollView style={styles.body} contentContainerStyle={{ gap: 14 }}>
        <View style={styles.sourceRow}>
          <Text style={styles.sourceIcon}>✦</Text>
          <Text style={styles.sourceText}>உங்கள் குரலில் இருந்து தயாரானது · 0:42</Text>
          <Text style={styles.replay}>replay</Text>
        </View>

        <View>
          <View style={styles.labelRow}>
            <Text style={styles.label}>headline · edit freely</Text>
            <Text style={styles.editedChip}>edited</Text>
          </View>
          <TextInput
            value={headline}
            onChangeText={setHeadline}
            multiline
            style={styles.headline}
          />
        </View>

        <View style={{ flex: 1, minHeight: 120 }}>
          <Text style={styles.label}>body</Text>
          <View style={styles.bodyField}>
            <TextInput value={body} onChangeText={setBody} multiline style={styles.bodyInput} />
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={[styles.field, { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
            <View style={styles.gpsDot} />
            <Text style={styles.fieldText}>மொப்பிரிபாளையம்</Text>
            <Text style={styles.gpsLabel}>gps</Text>
          </View>
          <TouchableOpacity style={[styles.field, { flexDirection: 'row', alignItems: 'center', gap: 7 }]} onPress={() => setShowCategories((v) => !v)}>
            <Text style={styles.fieldText}>{category.nameTa}</Text>
            <Text style={styles.caret}>▾</Text>
          </TouchableOpacity>
        </View>
        {showCategories && (
          <View style={styles.dropdown}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity key={c.id} style={styles.dropdownRow} onPress={() => { setCategory(c); setShowCategories(false); }}>
                <Text style={styles.dropdownText}>{c.nameTa}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7 }}>
          {PRIORITIES.map((p) => (
            <TouchableOpacity
              key={p}
              onPress={() => setPriority(p)}
              style={[styles.priorityPill, priority === p && styles.priorityPillActive]}
            >
              <Text style={[styles.priorityText, priority === p && styles.priorityTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.warnRow}>
          <Text style={styles.warnIcon}>▲</Text>
          <Text style={styles.warnText}>தவறான தகவல் அனுப்பினால் strike பெறும்.</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.draftBtn}>
          <Text style={styles.draftLabel}>வரைவு</Text>
        </TouchableOpacity>
        <Button label="அனுப்பு" onPress={handleSubmit} loading={submitting} style={{ flex: 1 }} height={50} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.surface },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingTop: 56, paddingBottom: 12 },
  back: { fontSize: 24, color: COLORS.ink, marginRight: 2 },
  title: { flex: 1, fontFamily: FONT_FAMILIES.displayBold, fontSize: 16, color: COLORS.ink },
  step: { fontFamily: FONT_FAMILIES.condensedBold, fontSize: 9.5, color: COLORS.inkLight, letterSpacing: 1 },
  progressTrack: { height: 3, backgroundColor: COLORS.borderLight },
  progressFill: { height: '100%', width: '100%', backgroundColor: COLORS.primary },
  body: { flex: 1, padding: 16 },
  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.background, borderRadius: 9, padding: 11 },
  sourceIcon: { color: COLORS.primary },
  sourceText: { flex: 1, fontFamily: FONT_FAMILIES.bodyRegular, fontSize: 11.5, color: COLORS.inkSecondary },
  replay: { fontFamily: FONT_FAMILIES.condensedBold, fontSize: 9.5, color: COLORS.primary, textTransform: 'uppercase' },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 7 },
  label: { flex: 1, fontFamily: FONT_FAMILIES.condensedBold, fontSize: 9.5, color: COLORS.inkLight, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 7 },
  editedChip: { fontFamily: FONT_FAMILIES.condensedBold, fontSize: 9.5, color: COLORS.primary, textTransform: 'uppercase' },
  headline: { fontFamily: FONT_FAMILIES.displayBold, fontSize: 17, lineHeight: 24, color: COLORS.ink, borderBottomWidth: 2, borderBottomColor: COLORS.ink, paddingBottom: 8 },
  bodyField: { flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 9, padding: 11 },
  bodyInput: { fontFamily: FONT_FAMILIES.bodyRegular, fontSize: 13.5, lineHeight: 23, color: '#3f3b37', minHeight: 100, textAlignVertical: 'top' },
  field: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 9, padding: 11 },
  fieldText: { flex: 1, fontFamily: FONT_FAMILIES.displayRegular, fontSize: 12.5, color: COLORS.ink },
  gpsDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.primary },
  gpsLabel: { fontFamily: FONT_FAMILIES.condensedBold, fontSize: 9.5, color: COLORS.inkLight, textTransform: 'uppercase' },
  caret: { color: COLORS.inkSecondary, fontSize: 10 },
  dropdown: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 9, overflow: 'hidden' },
  dropdownRow: { paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  dropdownText: { fontFamily: FONT_FAMILIES.displayRegular, fontSize: 13, color: COLORS.ink },
  priorityPill: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  priorityPillActive: { backgroundColor: COLORS.dark, borderColor: COLORS.dark },
  priorityText: { fontFamily: FONT_FAMILIES.uiSemiBold, fontSize: 12, color: COLORS.inkSecondary },
  priorityTextActive: { color: '#fff', fontFamily: FONT_FAMILIES.uiBold },
  warnRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.rejectedBg, borderRadius: 8, padding: 11 },
  warnIcon: { color: COLORS.primary, fontSize: 12 },
  warnText: { flex: 1, fontFamily: FONT_FAMILIES.bodyRegular, fontSize: 11.5, lineHeight: 18, color: COLORS.inkSecondary },
  footer: { flexDirection: 'row', gap: 9, padding: 16, borderTopWidth: 1, borderTopColor: COLORS.borderLight },
  draftBtn: { width: 104, height: 50, borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  draftLabel: { fontFamily: FONT_FAMILIES.displayBold, fontSize: 14, color: COLORS.ink },
});
