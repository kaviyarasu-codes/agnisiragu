// app/(tabs)/index.tsx
// Dead route — the (tabs) group was retired in the Aug 2026 redesign (no
// bottom tab bar; see app/_layout.tsx). Kept only as a redirect since this
// file can't be deleted from here; safe to delete this whole (tabs)/
// folder once you've confirmed nothing external links into it.

import { Redirect } from 'expo-router';

export default function TabsIndexRedirect() {
  return <Redirect href="/" />;
}
