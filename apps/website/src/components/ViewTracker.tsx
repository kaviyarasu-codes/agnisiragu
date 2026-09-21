'use client';

// src/components/ViewTracker.tsx
// Records a total-view for the article once per device, ever — same
// on-device-dedup, no-server-dedup pattern as the Like/Dislike reactions
// in ArticleActions.tsx (see STORAGE_KEY there). Renders nothing; this is
// an admin-facing metric only (see backend/src/news/news.service.ts's
// incrementView), not shown to readers.

import { useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.agnisiragu.com/api/v1';
const STORAGE_KEY = 'agnisiragu_viewed_articles';
// Cap how many ids we remember client-side so localStorage can't grow
// unbounded for a heavy reader — oldest views drop off first, which just
// means a very infrequent re-visit might count again; harmless for a
// coarse admin metric.
const MAX_TRACKED = 500;

function readViewed(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function markViewed(articleId: string, viewed: string[]) {
  try {
    const next = [...viewed, articleId].slice(-MAX_TRACKED);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* best-effort */
  }
}

export default function ViewTracker({ articleId }: { articleId: string }) {
  useEffect(() => {
    const viewed = readViewed();
    if (viewed.includes(articleId)) return;

    markViewed(articleId, viewed);
    fetch(`${API_URL}/news/${articleId}/view`, { method: 'PATCH' }).catch(() => {
      // Network failure — worst case this device's view is undercounted
      // once; not worth retry complexity for a coarse admin metric.
    });
  }, [articleId]);

  return null;
}
