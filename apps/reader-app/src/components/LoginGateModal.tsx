// src/components/LoginGateModal.tsx

import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { COLORS, STRINGS } from '@/constants';

interface LoginGateModalProps {
  visible: boolean;
  onDismiss: () => void;
}

export default function LoginGateModal({ visible, onDismiss }: LoginGateModalProps) {
  function handleLogin() {
    onDismiss();
    router.push('/login');
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <Text style={styles.heading}>
            {STRINGS.LOGIN_GATE_HEADING_TA}
            {'\n'}
            <Text style={styles.headingEn}>{STRINGS.LOGIN_GATE_HEADING_EN}</Text>
          </Text>

          <Text style={styles.message}>
            {STRINGS.LOGIN_GATE_MSG_TA}
            {'\n'}
            {STRINGS.LOGIN_GATE_MSG_EN}
          </Text>

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>
              {STRINGS.LOGIN_WITH_PHONE_TA} / {STRINGS.LOGIN_WITH_PHONE_EN}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
            <Text style={styles.dismissText}>பிறகு / Later</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    marginBottom: 20,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 30,
  },
  headingEn: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  message: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  loginButtonText: {
    color: COLORS.surface,
    fontSize: 15,
    fontWeight: '700',
  },
  dismissButton: {
    paddingVertical: 10,
  },
  dismissText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
});
