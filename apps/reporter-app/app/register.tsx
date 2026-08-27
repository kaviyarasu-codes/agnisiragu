// app/register.tsx — Registration, two-name system (design 1c)
// realName (private) + penName (public byline) + usePenName toggle + phone
// (read-only here — OTP-verified earlier in the real flow, Phase 2) + taluk.
// Phase 1: submits into local state and pushes to /account-status; Phase 2
// TODO: POST /reporters (realName, penName, usePenName, taluk) then route
// based on the returned status.

import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import Button from '@/components/Button';
import { COLORS, FONT_FAMILIES, TALUKS } from '@/constants';

export default function RegisterScreen() {
  const [realName, setRealName] = useState('');
  const [penName, setPenName] = useState('');
  const [usePenName, setUsePenName] = useState(true);
  const [taluk, setTaluk] = useState('');
  const [showTaluks, setShowTaluks] = useState(false);

  const canSubmit = realName.trim().length > 1 && penName.trim().length > 1 && taluk.length > 0;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>பதிவு செய்</Text>
        <Text style={styles.step}>step 1 / 2</Text>
      </View>

      <Text style={styles.label}>real name · private</Text>
      <View style={styles.field}>
        <TextInput
          value={realName}
          onChangeText={setRealName}
          placeholder="உங்கள் பெயர்"
          placeholderTextColor={COLORS.inkLight}
          style={styles.input}
        />
      </View>
      <Text style={styles.hint}>ஆசிரியர் குழு மட்டுமே பார்க்கும். வாசகர்களுக்குத் தெரியாது.</Text>

      <Text style={[styles.label, { marginTop: 16 }]}>pen name · public byline</Text>
      <View style={styles.field}>
        <TextInput
          value={penName}
          onChangeText={setPenName}
          placeholder="புனைப்பெயர்"
          placeholderTextColor={COLORS.inkLight}
          style={styles.input}
        />
      </View>

      <TouchableOpacity style={styles.toggleRow} onPress={() => setUsePenName((v) => !v)} activeOpacity={0.8}>
        <View style={[styles.checkbox, usePenName && styles.checkboxChecked]}>
          {usePenName && <View style={styles.checkmark} />}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.toggleTitle}>புனைபெயரில் வெளியிடு</Text>
          <Text style={styles.toggleBody}>
            செய்தியின் கீழே "{penName || 'புனைபெயர்'}" என்று வரும்.
          </Text>
        </View>
      </TouchableOpacity>

      <Text style={[styles.label, { marginTop: 18 }]}>taluk you cover</Text>
      <TouchableOpacity style={styles.field} onPress={() => setShowTaluks((v) => !v)} activeOpacity={0.8}>
        <Text style={[styles.input, !taluk && { color: COLORS.inkLight }]}>{taluk || 'தேர்வு செய்யவும்'}</Text>
      </TouchableOpacity>
      {showTaluks && (
        <View style={styles.dropdown}>
          {TALUKS.map((t) => (
            <TouchableOpacity key={t} style={styles.dropdownRow} onPress={() => { setTaluk(t); setShowTaluks(false); }}>
              <Text style={styles.dropdownText}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={{ flex: 1, minHeight: 24 }} />
      <Button
        label="அடுத்து"
        variant="dark"
        disabled={!canSubmit}
        onPress={() => router.replace('/account-status')}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.surface },
  content: { padding: 20, paddingTop: 56, flexGrow: 1 },
  header: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 18 },
  title: { flex: 1, fontFamily: FONT_FAMILIES.displayBold, fontSize: 16, color: COLORS.ink },
  step: { fontFamily: FONT_FAMILIES.condensedBold, fontSize: 9.5, color: COLORS.inkLight, letterSpacing: 1 },
  label: { fontFamily: FONT_FAMILIES.condensedBold, fontSize: 9.5, color: COLORS.inkLight, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 7 },
  field: { borderWidth: 1, borderColor: COLORS.ink, borderRadius: 9, padding: 11 },
  input: { fontFamily: FONT_FAMILIES.displayRegular, fontSize: 15, color: COLORS.ink },
  hint: { fontFamily: FONT_FAMILIES.bodyRegular, fontSize: 11.5, lineHeight: 17, color: COLORS.inkLight, marginTop: 6 },
  toggleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, backgroundColor: COLORS.background, borderRadius: 9, padding: 12, marginTop: 14 },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  checkmark: { width: 8, height: 5, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: '#fff', transform: [{ rotate: '-45deg' }, { translateY: -1 }] },
  toggleTitle: { fontFamily: FONT_FAMILIES.displayBold, fontSize: 13.5, color: COLORS.ink },
  toggleBody: { fontFamily: FONT_FAMILIES.bodyRegular, fontSize: 11.5, lineHeight: 17, color: COLORS.inkSecondary, marginTop: 3 },
  dropdown: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 9, marginTop: 6, overflow: 'hidden' },
  dropdownRow: { paddingHorizontal: 12, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  dropdownText: { fontFamily: FONT_FAMILIES.displayRegular, fontSize: 14, color: COLORS.ink },
});
