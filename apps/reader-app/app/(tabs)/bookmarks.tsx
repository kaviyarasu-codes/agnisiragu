// app/(tabs)/bookmarks.tsx — dead route, see app/(tabs)/index.tsx.
import { Redirect } from 'expo-router';

export default function TabsBookmarksRedirect() {
  return <Redirect href="/bookmarks" />;
}
