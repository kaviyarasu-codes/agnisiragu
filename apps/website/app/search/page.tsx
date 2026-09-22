import { Suspense } from 'react';
import { getCategories, getAuthors } from '@/lib/api';
import SearchClient from '@/components/SearchClient';

export const metadata = {
  // Root layout's title template already appends " — <site name>" — a full
  // title here would double it up to "தேடல் — அக்னிசிறகு — அக்னிசிறகு".
  title: 'தேடல்',
  description: 'Search Agnisiragu news in Tamil, English or Thanglish — by keyword, category, reporter or date.',
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const [{ data: categories }, { data: authors }] = await Promise.all([
    getCategories().catch(() => ({ data: [] })),
    getAuthors(),
  ]);

  return (
    <Suspense fallback={null}>
      <SearchClient categories={categories} authors={authors} initialQuery={searchParams.q ?? ''} />
    </Suspense>
  );
}
