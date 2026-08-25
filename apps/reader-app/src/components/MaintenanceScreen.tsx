// src/components/MaintenanceScreen.tsx
// Full-screen blocking view shown when the admin enables Maintenance Mode
// via App Config → Feature Flags. Restyled onto the shared EmptyState shell.

import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import EmptyState from '@/components/ui/EmptyState';

export default function MaintenanceScreen() {
  const t = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <EmptyState
        icon="warningTriangle"
        title="பராமரிப்பு பணியில் உள்ளோம்"
        description="அக்னிசிறகு தற்போது புதுப்பிக்கப்படுகிறது. விரைவில் மீண்டும் வாருங்கள்.

Agnisiragu is being updated right now. Please check back shortly."
      />
    </View>
  );
}
