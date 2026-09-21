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

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

const inputCls =
  'w-full rounded-xl border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-brand-red/50';

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

  function clearFilters() {
    setCategoryId('');
    setByline('');
    setDateFrom('');
    setDateTo('');
  }

  const activeFilterCount = [categoryId, byline, dateFrom, dateTo].filter(Boolean).length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-1 flex items-center gap-2.5">
        <span className="h-6 w-1.5 rounded-full bg-brand-red" />
        <h1 className="font-tamil text-xl font-extrabold text-black">தேடல்</h1>
      </div>
      <p className="mb-5 font-tamil text-sm text-black/45">
        தமிழில், ஆங்கிலத்தில் அல்லது Thanglish-இல் தேடலாம் — எ.கா. &quot;chennai mazhai&quot;
      </p>

      {/* Text box */}
      <div className="flex items-center gap-2.5 rounded-xl border border-black/15 bg-white px-3.5 py-3 shadow-sm focus-within:border-brand-red/50">
        <span className="text-black/35">
          <SearchIcon />
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="செய்தி, தலைப்பு தேடுங்கள்... (Tamil / English / Thanglish)"
          className="w-full font-tamil text-[15px] outline-none placeholder:text-black/35"
          autoFocus
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="rounded-full p-1 text-black/35 hover:bg-black/5"
            aria-label="அழி"
          >
            ✕
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="mt-3 flex flex-wrap items-center gap-2.5">
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={`${inputCls} font-tamil w-auto min-w-[140px]`}>
          <option value="">அனைத்து பிரிவுகள்</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nameTa}
            </option>
          ))}
        </select>

        <select value={byline} onChange={(e) => setByline(e.target.value)} className={`${inputCls} font-tamil w-auto min-w-[140px]`}>
          <option value="">அனைத்து நிருபர்கள்</option>
          {authors.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className={`${inputCls} w-auto`}
            aria-label="இருந்து தேதி"
            max={dateTo || undefined}
          />
          <span className="text-xs text-black/40">முதல்</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className={`${inputCls} w-auto`}
            aria-label="வரை தேதி"
            min={dateFrom || undefined}
          />
        </div>

        {activeFilterCount > 0 && (
          <button type="button" onClick={clearFilters} className="text-xs font-semibold text-brand-red hover:underline">
            வடிகட்டிகளை அழி ({activeFilterCount})
          </button>
        )}
      </div>

      {/* Results */}
      <div className="mt-6">
        {!searched ? (
          <p className="py-16 text-center font-tamil text-black/35">தேட ஒரு வார்த்தையை உள்ளிடவும் அல்லது வடிகட்டி தேர்ந்தெடுக்கவும்.</p>
        ) : loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-xl bg-black/5" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <p className="py-16 text-center font-tamil text-black/35">முடிவுகள் இல்லை. வேறு வார்த்தையில் முயற்சிக்கவும்.</p>
        ) : (
          <>
            <p className="mb-4 font-tamil text-sm text-black/45">{results.length} முடிவுகள்{hasMore ? '+' : ''}</p>
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
                  className="rounded-full border border-black/15 px-6 py-2.5 text-sm font-semibold text-black/70 transition hover:border-brand-red/30 hover:text-brand-red disabled:opacity-50"
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
