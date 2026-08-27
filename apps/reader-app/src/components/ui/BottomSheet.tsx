// src/components/ui/BottomSheet.tsx
// Generic slide-up sheet shell used by the login gate, share sheet,
// more-actions sheet, and logout/delete confirm — a rounded-top panel over
// a dim backdrop, matching the design's recurring bottom-sheet pattern.

import React from 'react';
import { Modal, View, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';

interface BottomSheetProps {
  visible: boolean;
  onDismiss: () => void;
  children: React.ReactNode;
  style?: ViewStyle;
  showHandle?: boolean;
}

export default function BottomSheet({ visible, onDismiss, children, style, showHandle = true }: BottomSheetProps) {
  const t = useTheme();
  // Modals render outside SafeAreaProvider's normal layout flow, so the
  // sheet's bottom padding needs the inset added explicitly or it lands
  // right under (and gets partly hidden by) a 3-button nav bar.
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <Pressable style={[styles.sheet, { backgroundColor: t.surface, paddingBottom: 30 + insets.bottom }, style]}>
          {showHandle ? <View style={[styles.handle, { backgroundColor: t.border }]} /> : null}
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(28,25,23,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 16,
  },
});
