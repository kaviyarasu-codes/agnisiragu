'use client';

// src/components/CommentsSection.tsx
// Reading comments is public (plain fetch, no auth). Posting requires a
// logged-in reader — same PATCH-free flow as the reader-app: an
// unauthenticated visitor who tries to post is shown LoginModal instead.
// Mirrors apps/reader-app/src/screens/ArticleDetailScreen.tsx's comments
// section + apps/reader-app/src/hooks/useComments.ts.

import { useEffect, useState, useCallback } from 'react';
import { useWebsiteAuth } from '@/hooks/useWebsiteAuth';
import { authFetch } from '@/lib/authFetch';
import { fetchWithTimeout } from '@/lib/fetchWithTimeout';
import LoginModal from './LoginModal';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.agnisiragu.com/api/v1';

interface ArticleComment {
  id: string;
  body: string;
  createdAt: string;
  user: { id: string; name: string | null };
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'இப்போது';
  if (mins < 60) return `${mins} நிமிடம் முன்`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} மணி நேரம் முன்`;
  const days = Math.floor(hours / 24);
  return `${days} நாட்கள் முன்`;
}

export default function CommentsSection({ articleId }: { articleId: string }) {
  const { isAuthenticated, hydrated } = useWebsiteAuth();
  const [comments, setComments] = useState<ArticleComment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState('');
  const [showLogin, setShowLogin] = useState(false);

  const load = useCallback(async () => {
    setLoadError(false);
    try {
      const res = await fetchWithTimeout(`${API_URL}/news/${articleId}/comments?limit=50`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setComments(json.data ?? []);
      setTotal(json.meta?.total ?? json.data?.length ?? 0);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [articleId]);

  useEffect(() => {
    load();
  }, [load]);

  async function postComment() {
    const body = draft.trim();
    if (!body) return;
    if (!isAuthenticated) {
      setShowLogin(true);
      return;
    }
    setPosting(true);
    setPostError('');
    try {
      const res = await authFetch(`/news/${articleId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body }),
      });
      if (!res.ok) throw new Error();
      setDraft('');
      await load();
    } catch {
      setPostError('கருத்தை அனுப்ப முடியவில்லை. மீண்டும் முயற்சிக்கவும்.');
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="mt-8">
      <h2 className="font-tamil text-lg font-extrabold text-black">
        கருத்துகள் {hydrated && <span className="text-black/40">· {total}</span>}
      </h2>

      <div className="mt-3 flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={() => { if (hydrated && !isAuthenticated) setShowLogin(true); }}
          onKeyDown={(e) => e.key === 'Enter' && postComment()}
          placeholder={isAuthenticated ? 'கருத்து எழுதுங்கள்…' : 'கருத்து தெரிவிக்க உள்நுழையவும்…'}
          aria-label="கருத்து"
          className="flex-1 rounded-xl border border-black/15 px-3.5 py-2.5 font-tamil text-sm outline-none focus:border-brand-red/40"
        />
        <button
          type="button"
          onClick={postComment}
          disabled={posting || !draft.trim()}
          className="rounded-xl bg-brand-red px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
        >
          அனுப்பு
        </button>
      </div>

      {postError && <p className="mt-2 text-xs text-brand-red">{postError}</p>}

      <div className="mt-5 space-y-4">
        {loading ? (
          <p className="font-tamil text-sm text-black/40">ஏற்றுகிறது…</p>
        ) : loadError ? (
          <div className="flex items-center gap-2">
            <p className="font-tamil text-sm text-black/40">கருத்துகளை ஏற்ற முடியவில்லை</p>
            <button type="button" onClick={load} className="text-xs font-semibold text-brand-red">
              மீண்டும் முயற்சிக்க
            </button>
          </div>
        ) : comments.length === 0 ? (
          <p className="font-tamil text-sm text-black/40">முதலில் கருத்து தெரிவியுங்கள்</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="flex gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-red/10 font-tamil text-xs font-extrabold text-brand-red">
                {(c.user?.name?.trim()?.[0] ?? 'ப').toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold text-black/80">{c.user?.name?.trim() || 'பயனர்'}</p>
                  <span className="text-2xs text-black/35">{timeAgo(c.createdAt)}</span>
                </div>
                <p className="mt-0.5 font-tamil text-sm text-black/70">{c.body}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {showLogin && (
        <LoginModal onClose={() => setShowLogin(false)} onSuccess={() => setShowLogin(false)} />
      )}
    </div>
  );
}
