// src/components/sheets/LogoutConfirmSheet.tsx
// Screen 2v — bottom-sheet logout confirmation, replacing the native Alert
// ProfileScreen used before so the flow matches the design's other
// confirm/destructive sheets.

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { FONT_FAMILIES } from '@/constants';
import BottomSheet from '@/components/ui/BottomSheet';
import Button from '@/components/ui/Button';
import Icon from '@/components/icons/Icon';

interface LogoutConfirmSheetProps {
  visible: boolean;
  onDismiss: () => void;
  onConfirm: () => void;
  loading?: boolean;
  language: 'ta' | 'en';
}

export default function LogoutConfirmSheet({ visible, onDismiss, onConfirm, loading, language }: LogoutConfirmSheetProps) {
  const t = useTheme();
  return (
    <BottomSheet visible={visible} onDismiss={onDismiss}>
      <View style={styles.iconWrap}>
        <Icon name="warningTriangle" size={42} color={t.red} />
      </View>
      <Text style={[styles.title, { color: t.ink }]}>
        {language === 'ta' ? 'வெளியேற விரும்புகிறீர்களா?' : 'Log out of your account?'}
      </Text>
      <Text style={[styles.desc, { color: t.inkSub }]}>
        {language === 'ta'
          ? 'உங்கள் சேமிப்புகள் மற்றும் விருப்பங்கள் இந்த சாதனத்தில் இருக்கும்'
          : 'Your saved articles and preferences will stay on this device'}
      </Text>

      <Button
        label={language === 'ta' ? 'வெளியேறு' : 'Log Out'}
        onPress={onConfirm}
        loading={loading}
        variant="primary"
        style={{ width: '100%', marginTop: 22 }}
      />
      <TouchableOpacity onPress={onDismiss} style={styles.cancelBtn}>
        <Text style={[styles.cancelText, { color: t.inkSub }]}>{language === 'ta' ? 'ரத்து' : 'Cancel'}</Text>
      </TouchableOpacity>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  iconWrap: { alignItems: 'center', marginTop: 4 },
  title: { fontFamily: FONT_FAMILIES.displayBold, fontSize: 18, textAlign: 'center', marginTop: 16 },
  desc: { fontFamily: FONT_FAMILIES.bodyRegular, fontSize: 13, lineHeight: 21, textAlign: 'center', marginTop: 8, paddingHorizontal: 8 },
  cancelBtn: { alignItems: 'center', paddingVertical: 14 },
  cancelText: { fontFamily: FONT_FAMILIES.displaySemiBold, fontSize: 14 },
});
