'use client';

// src/components/SearchClient.tsx
// Interactive search UI for /search. The single text box matches Tamil,
// English AND Thanglish (Tamil typed in English letters, e.g. "chennai
// mazhai") in one go — no language toggle needed — because the backend's
// GET /news/search already runs the query against both the raw
// titleTa/titleEn/bodyTa/bodyEn text and a precomputed phonetic
// transliteration blob (searchText). See
// backend/src/common/utils/tamil-transliterate.ts and
// backend/src/news/news.service.ts#search for how that's built.
//
// Reporter + category + date-range are real, backend-enforced filters
// (GET /news/search?byline=&categoryId=&dateFrom=&dateTo=) — unlike the
// reader-app's SearchScreen, where the reporter/date filters are still
// UI-only. Any/all of them can combine with the text query.

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { searchArticles } from '@/lib/api';
import type { Article, Category } from '@/lib/api';
import ArticleCard from './ArticleCard';

const DEBOUNCE_MS = 350;

function SearchIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.59 13.41 11 3.83A2 2 0 0 0 9.59 3.24L4 3a1 1 0 0 0-1 1l.24 5.59a2 2 0 0 0 .59 1.41l9.58 9.59a2 2 0 0 0 2.83 0l4.35-4.35a2 2 0 0 0 0-2.83Z" />
      <circle cx="7.5" cy="7.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
      <path d="M16 2.5v4M8 2.5v4M3 9.5h18" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="pointer-events-none shrink-0 text-black/35">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

const selectCls =
  'peer w-full appearance-none rounded-lg border border-black/10 bg-white py-2.5 pl-9 pr-8 font-tamil text-sm text-black/80 outline-none transition focus:border-brand-red/50 focus:ring-2 focus:ring-brand-red/10';
const dateCls =
  'w-full rounded-lg border border-black/10 bg-white py-2.5 pl-9 pr-2 text-sm text-black/80 outline-none transition focus:border-brand-red/50 focus:ring-2 focus:ring-brand-red/10';

function FieldWrap({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="relative flex items-center">
      <span className="pointer-events-none absolute left-3 text-black/35">{icon}</span>
      {children}
      <span className="pointer-events-none absolute right-3">
        <ChevronIcon />
      </span>
    </div>
  );
}

export default function SearchClient({
  categories,
  authors,
  initialQuery,
}: {
  categories: Category[];
  authors: string[];
  initialQuery: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [categoryId, setCategoryId] = useState(searchParams.get('category') ?? '');
  const [byline, setByline] = useState(searchParams.get('reporter') ?? '');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [results, setResults] = useState<Article[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searched, setSearched] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  // Debounce free-text typing only — filter dropdowns/dates apply instantly.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(query.trim()), DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const hasActiveSearch = debouncedQuery.length > 0 || !!categoryId || !!byline || !!dateFrom || !!dateTo;

  const runSearch = useCallback(async () => {
    if (!hasActiveSearch) {
      setResults([]);
      setSearched(false);
      return;
    }
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setSearched(true);
    try {
      const { data, meta } = await searchArticles({
        q: debouncedQuery || undefined,
        categoryId: categoryId || undefined,
        byline: byline || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      if (requestId !== requestIdRef.current) return; // a newer search superseded this one
      setResults(data);
      setCursor(meta?.nextCursor ?? null);
      setHasMore(!!meta?.hasMore);
    } catch {
      if (requestId !== requestIdRef.current) return;
      setResults([]);
      setHasMore(false);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
    // Keep the URL shareable/bookmarkable without a full navigation.
    const qs = new URLSearchParams();
    if (debouncedQuery) qs.set('q', debouncedQuery);
    if (categoryId) qs.set('category', categoryId);
    if (byline) qs.set('reporter', byline);
    router.replace(qs.toString() ? `/search?${qs.toString()}` : '/search', { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, categoryId, byline, dateFrom, dateTo, hasActiveSearch]);

  useEffect(() => {
    runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, categoryId, byline, dateFrom, dateTo]);

  async function loadMore() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const { data, meta } = await searchArticles({
        q: debouncedQuery || undefined,
        categoryId: categoryId || undefined,
        byline: byline || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        cursor,
      });
      setResults((prev) => [...prev, ...data]);
      setCursor(meta?.nextCursor ?? null);
      setHasMore(!!meta?.hasMore);
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }

  const categoryName = categories.find((c) => c.id === categoryId)?.nameTa;

  const activeFilters = [
    categoryId && { key: 'category', label: categoryName ?? '', clear: () => setCategoryId('') },
    byline && { key: 'byline', label: byline, clear: () => setByline('') },
    dateFrom && { key: 'from', label: `${dateFrom} முதல்`, clear: () => setDateFrom('') },
    dateTo && { key: 'to', label: `${dateTo} வரை`, clear: () => setDateTo('') },
  ].filter(Boolean) as { key: string; label: string; clear: () => void }[];

  return (
    <div>
      {/* Hero search band */}
      <div className="border-b border-black/5 bg-gradient-to-b from-black/[0.025] to-transparent">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
          <div className="mb-2 flex items-center justify-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-red/10 text-brand-red">
              <SearchIcon size={17} />
            </span>
            <h1 className="font-tamil text-2xl font-extrabold text-black">செய்தி தேடல்</h1>
          </div>
          <p className="mb-6 text-center font-tamil text-sm text-black/45">
            தமிழில், ஆங்கிலத்தில் அல்லது Thanglish-இல் தேடலாம் — எ.கா. &quot;chennai mazhai&quot;
          </p>

          {/* Text box */}
          <div className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3.5 shadow-sm ring-1 ring-black/[0.02] transition focus-within:border-brand-red/40 focus-within:shadow-md">
            <span className="text-black/30">
              <SearchIcon size={19} />
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="செய்தி, தலைப்பு தேடுங்கள்..."
              className="w-full font-tamil text-[15px] outline-none placeholder:text-black/35"
              autoFocus
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-black/35 transition hover:bg-black/5 hover:text-black/60"
                aria-label="அழி"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <FieldWrap icon={<TagIcon />}>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={selectCls}>
                <option value="">அனைத்து பிரிவுகள்</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nameTa}
                  </option>
                ))}
              </select>
            </FieldWrap>

            <FieldWrap icon={<UserIcon />}>
              <select value={byline} onChange={(e) => setByline(e.target.value)} className={selectCls}>
                <option value="">அனைத்து நிருபர்கள்</option>
                {authors.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </FieldWrap>

            <div className="relative flex items-center">
              <span className="pointer-events-none absolute left-3 text-black/35">
                <CalendarIcon />
              </span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className={dateCls}
                aria-label="இருந்து தேதி"
                max={dateTo || undefined}
              />
            </div>

            <div className="relative flex items-center">
              <span className="pointer-events-none absolute left-3 text-black/35">
                <CalendarIcon />
              </span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className={dateCls}
                aria-label="வரை தேதி"
                min={dateFrom || undefined}
              />
            </div>
          </div>

          {/* Active filter chips */}
          {activeFilters.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {activeFilters.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={f.clear}
                  className="flex items-center gap-1.5 rounded-full bg-brand-red/10 py-1 pl-3 pr-2 font-tamil text-xs font-semibold text-brand-red transition hover:bg-brand-red/15"
                >
                  {f.label}
                  <span className="flex h-3.5 w-3.5 items-center justify-center text-[10px]">✕</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="mx-auto max-w-6xl px-4 py-8">
        {!searched ? (
          <div className="flex flex-col items-center py-16 text-center">
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-black/[0.03] text-black/20">
              <SearchIcon size={24} />
            </span>
            <p className="mb-5 font-tamil text-black/40">தேட ஒரு வார்த்தையை உள்ளிடவும் அல்லது கீழே ஒரு பிரிவைத் தேர்ந்தெடுக்கவும்</p>
            <div className="flex flex-wrap justify-center gap-2 px-4">
              {categories.slice(0, 8).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoryId(c.id)}
                  className="rounded-full border border-black/10 bg-white px-3.5 py-1.5 font-tamil text-xs font-semibold text-black/60 transition hover:border-brand-red/30 hover:text-brand-red"
                >
                  {c.nameTa}
                </button>
              ))}
            </div>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-xl bg-black/5" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-black/[0.03] text-black/20">
              <SearchIcon size={24} />
            </span>
            <p className="font-tamil text-black/40">முடிவுகள் இல்லை. வேறு வார்த்தையில் அல்லது வடிகட்டியில் முயற்சிக்கவும்.</p>
          </div>
        ) : (
          <>
            <p className="mb-4 font-tamil text-sm text-black/45">
              <span className="font-bold text-black/70">{results.length}</span> முடிவுகள்{hasMore ? '+' : ''}
            </p>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
            {hasMore && (
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="rounded-full border border-black/15 bg-white px-6 py-2.5 text-sm font-semibold text-black/70 shadow-sm transition hover:border-brand-red/30 hover:text-brand-red disabled:opacity-50"
                >
                  {loadingMore ? 'ஏற்றுகிறது...' : 'மேலும் காட்டு'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
