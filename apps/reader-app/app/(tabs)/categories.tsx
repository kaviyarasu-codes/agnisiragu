// app/(tabs)/categories.tsx — dead route, see app/(tabs)/index.tsx.
import { Redirect } from 'expo-router';

export default function TabsCategoriesRedirect() {
  return <Redirect href="/categories" />;
}
