// app/(tabs)/search.tsx — dead route, see app/(tabs)/index.tsx.
import { Redirect } from 'expo-router';

export default function TabsSearchRedirect() {
  return <Redirect href="/search" />;
}
