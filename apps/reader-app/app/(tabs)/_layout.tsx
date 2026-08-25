// app/(tabs)/_layout.tsx
// Dead layout — the (tabs) group was retired in the Aug 2026 redesign (see
// app/_layout.tsx; every child route here now just <Redirect>s to its new
// top-level path). Swapped from the old Tabs navigator to a plain Slot so
// there's no leftover tab-bar flash before the redirect fires. Safe to
// delete this whole (tabs)/ folder along with src/navigation/AppNavigator.tsx
// once you've confirmed nothing external links into it.

import { Slot } from 'expo-router';

export default function TabsLayoutRedirectShell() {
  return <Slot />;
}
