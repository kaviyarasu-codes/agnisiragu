// app/(tabs)/profile.tsx — dead route, see app/(tabs)/index.tsx.
import { Redirect } from 'expo-router';

export default function TabsProfileRedirect() {
  return <Redirect href="/profile" />;
}
