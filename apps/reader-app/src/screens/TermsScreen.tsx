// src/screens/TermsScreen.tsx
// Screen 2s — Terms of Service / Privacy Policy, tabbed. Placeholder legal
// copy — replace with the real text from Agnisiragu's legal/compliance team
// before shipping; structure and navigation are final.

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '@/store/app.store';
import { useTheme } from '@/hooks/useTheme';
import { FONT_FAMILIES } from '@/constants';
import Icon from '@/components/icons/Icon';

type Tab = 'terms' | 'privacy';

const TERMS_TA = `இந்த செயலியை பயன்படுத்துவதன் மூலம் நீங்கள் அக்னிசிறகு பயன்பாட்டு விதிமுறைகளை ஏற்றுக்கொள்கிறீர்கள்.

1. உள்ளடக்கம்: அக்னிசிறகு மூலம் வெளியிடப்படும் அனைத்து செய்திகளும் சரிபார்ப்புக்கு உட்பட்டவை. பயனர்கள் சமர்ப்பிக்கும் செய்திகள் வெளியிடப்படுவதற்கு முன் ஆசிரியர் குழுவால் சரிபார்க்கப்படும்.

2. கணக்கு: தொலைபேசி எண் மூலம் பதிவு செய்யப்படும் கணக்குகள் அந்தந்த பயனருக்கே சொந்தமானவை. தவறான தகவல் அளிப்பது கணக்கு நிறுத்தத்திற்கு வழிவகுக்கும்.

3. நடத்தை: வெறுப்புணர்வு, வன்முறை அல்லது தவறான தகவல்களை பரப்புவது தடைசெய்யப்பட்டது.

4. மாற்றங்கள்: இந்த விதிமுறைகள் அவ்வப்போது புதுப்பிக்கப்படலாம்.`;

const TERMS_EN = `By using this app, you agree to Agnisiragu's terms of use.

1. Content: All news published through Agnisiragu is subject to editorial verification. User-submitted reports are reviewed by our editorial team before publication.

2. Accounts: Accounts registered via phone number belong to the individual user. Providing false information may result in account suspension.

3. Conduct: Hate speech, incitement to violence, or the deliberate spread of misinformation is prohibited.

4. Changes: These terms may be updated from time to time.`;

const PRIVACY_TA = `உங்கள் தனியுரிமையை நாங்கள் மதிக்கிறோம்.

1. சேகரிக்கப்படும் தகவல்கள்: தொலைபேசி எண், விருப்பமான மொழி, மாவட்டம் மற்றும் பயன்பாட்டு புள்ளிவிவரங்கள்.

2. பயன்பாடு: உங்கள் தகவல்கள் செய்திகளை தனிப்பயனாக்கவும், அறிவிப்புகள் அனுப்பவும் மட்டுமே பயன்படுத்தப்படும்.

3. பகிர்வு: உங்கள் தனிப்பட்ட தகவல்கள் மூன்றாம் தரப்பினருடன் விற்கப்படாது.

4. தொடர்பு: தனியுரிமை தொடர்பான கேள்விகளுக்கு எங்களை தொடர்பு கொள்ளுங்கள்.`;

const PRIVACY_EN = `We respect your privacy.

1. Information we collect: phone number, language preference, district, and usage analytics.

2. Use: your information is used only to personalize news and send relevant alerts.

3. Sharing: your personal information is never sold to third parties.

4. Contact: reach out to us with any privacy-related questions.`;

export default function TermsScreen() {
  const t = useTheme();
  const { language } = useAppStore();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('terms');

  const body = tab === 'terms'
    ? (language === 'ta' ? TERMS_TA : TERMS_EN)
    : (language === 'ta' ? PRIVACY_TA : PRIVACY_EN);

  return (
    <View style={[styles.container, { backgroundColor: t.surface }]}>
      <View style={[styles.header, { borderBottomColor: t.border, paddingTop: insets.top, paddingBottom: 8 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <Icon name="back" size={17} color={t.ink} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: t.ink }]}>
          {language === 'ta' ? 'விதிமுறைகள் & தனியுரிமை' : 'Terms & Privacy'}
        </Text>
      </View>

      <View style={[styles.tabRow, { borderBottomColor: t.border }]}>
        <TouchableOpacity style={styles.tabBtn} onPress={() => setTab('terms')}>
          <Text style={[styles.tabLabel, { color: tab === 'terms' ? t.ink : t.inkMuted }]}>
            {language === 'ta' ? 'விதிமுறைகள்' : 'Terms'}
          </Text>
          {tab === 'terms' && <View style={[styles.tabIndicator, { backgroundColor: t.red }]} />}
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabBtn} onPress={() => setTab('privacy')}>
          <Text style={[styles.tabLabel, { color: tab === 'privacy' ? t.ink : t.inkMuted }]}>
            {language === 'ta' ? 'தனியுரிமை' : 'Privacy'}
          </Text>
          {tab === 'privacy' && <View style={[styles.tabIndicator, { backgroundColor: t.red }]} />}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 48 + insets.bottom }]}>
        <Text style={[styles.body, { color: t.inkSub }]}>{body}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, borderBottomWidth: 1 },
  headerTitle: { fontFamily: FONT_FAMILIES.displayBold, fontSize: 16 },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1 },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 13 },
  tabLabel: { fontFamily: FONT_FAMILIES.displaySemiBold, fontSize: 14 },
  tabIndicator: { height: 2.5, width: 40, borderRadius: 2, marginTop: 8 },
  content: { padding: 20, paddingBottom: 48 },
  body: { fontFamily: FONT_FAMILIES.bodyRegular, fontSize: 14, lineHeight: 25 },
});
