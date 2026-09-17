'use client';

// src/components/ArticleActions.tsx
// Share row + Like/Dislike/Comment-count bar under the article headline.
// Reactions mirror the reader-app's exact pattern (see
// apps/reader-app/src/store/reactions.store.ts): guests can react, no
// server-side dedup, one reaction per article per device tracked in
// localStorage instead so a re-tap toggles it off / switching reaction
// types swaps it in one round trip.

import { useEffect, useState } from 'react';

// Small inline icons instead of a lucide-react dependency — the website
// package doesn't have that library installed and this session can't run
// npm install (no shell access), so plain SVG keeps this dependency-free.
function ShareIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <line x1="8.6" y1="10.5" x2="15.4" y2="6.5" /><line x1="8.6" y1="13.5" x2="15.4" y2="17.5" />
    </svg>
  );
}
function CommentIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}
function LinkIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.5 1.5" />
      <path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.5-1.5" />
    </svg>
  );
}
function CheckIcon({ size = 15, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.agnisiragu.com/api/v1';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agnisiragu.com';
const STORAGE_KEY = 'agnisiragu_article_reactions';

type Reaction = 'LIKE' | 'DISLIKE';

function readReactions(): Record<string, Reaction> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, Reaction>) : {};
  } catch {
    return {};
  }
}

function writeReactions(next: Record<string, Reaction>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* best-effort */
  }
}

async function sendReact(articleId: string, type: Reaction, delta: number) {
  try {
    await fetch(`${API_URL}/news/${articleId}/react`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, delta }),
    });
  } catch {
    // Network failure — the on-device intent still reflects correctly, and
    // the server count reconciles next time this article is fetched.
  }
}

const WHATSAPP_ICON = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
    <path d="M17.5 14.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.1.2-.3.2-.6.1-.3-.1-1.2-.4-2.2-1.4-.8-.7-1.4-1.6-1.5-1.9-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.1.2-.3.2-.4.1-.2 0-.3 0-.4-.1-.1-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.3-.8.8-.8 1.9s.8 2.2.9 2.4c.1.2 1.6 2.4 3.9 3.4.5.2 1 .4 1.3.5.5.2 1 .1 1.4.1.4-.1 1.3-.5 1.5-1.1.2-.5.2-1 .1-1.1-.1-.1-.2-.2-.4-.3z" />
    <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm0 18.3a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3.1.8.8-3-.2-.3a8.3 8.3 0 1 1 7 3.8z" />
  </svg>
);

export default function ArticleActions({
  articleId,
  title,
  likeCount,
  dislikeCount,
  commentCount,
}: {
  articleId: string;
  title: string;
  likeCount: number;
  dislikeCount: number;
  commentCount: number;
}) {
  const [reaction, setReaction] = useState<Reaction | undefined>(undefined);
  const [likes, setLikes] = useState(likeCount);
  const [dislikes, setDislikes] = useState(dislikeCount);
  const [copied, setCopied] = useState(false);
  const url = `${SITE_URL}/article/${articleId}`;

  useEffect(() => {
    setReaction(readReactions()[articleId]);
  }, [articleId]);

  const react = (type: Reaction) => {
    const current = reaction;
    const stored = readReactions();

    let likeDelta = 0;
    let dislikeDelta = 0;

    if (current === type) {
      delete stored[articleId];
      if (type === 'LIKE') likeDelta = -1;
      else dislikeDelta = -1;
    } else {
      if (current === 'LIKE') likeDelta -= 1;
      if (current === 'DISLIKE') dislikeDelta -= 1;
      if (type === 'LIKE') likeDelta += 1;
      else dislikeDelta += 1;
      stored[articleId] = type;
    }

    writeReactions(stored);
    setReaction(stored[articleId]);
    // Clamp at 0 client-side too (mirrors the server's Math.max(0, ...) in
    // news.service.ts) — protects against stale localStorage state (e.g. a
    // device that "reacted" during an earlier broken deploy) implying a
    // dislike/like that was never actually recorded server-side, which
    // would otherwise show a negative count here.
    setLikes((n) => Math.max(0, n + likeDelta));
    setDislikes((n) => Math.max(0, n + dislikeDelta));

    if (likeDelta !== 0) sendReact(articleId, 'LIKE', likeDelta);
    if (dislikeDelta !== 0) sendReact(articleId, 'DISLIKE', dislikeDelta);
  };

  const shareVia = (platform: 'whatsapp' | 'facebook' | 'x') => {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    const shareUrls: Record<typeof platform, string> = {
      whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      x: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    };
    window.open(shareUrls[platform], '_blank', 'noopener,noreferrer,width=600,height=500');
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // user cancelled or share failed — fall through to copy
      }
    }
    copyLink();
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — nothing else we can do here */
    }
  };

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-y border-black/10 py-3">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => react('LIKE')}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
            reaction === 'LIKE'
              ? 'border-brand-red bg-brand-red/10 text-brand-red'
              : 'border-black/10 text-black/60 hover:border-black/20'
          }`}
        >
          👍 {likes}
        </button>
        <button
          type="button"
          onClick={() => react('DISLIKE')}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
            reaction === 'DISLIKE'
              ? 'border-black/40 bg-black/5 text-black/70'
              : 'border-black/10 text-black/60 hover:border-black/20'
          }`}
        >
          👎 {dislikes}
        </button>
        <span className="flex items-center gap-1 px-2 text-xs text-black/40">
          <CommentIcon size={13} /> {commentCount}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="hidden text-xs text-black/40 sm:inline">பகிர்</span>
        <button
          type="button"
          onClick={() => shareVia('whatsapp')}
          aria-label="Share on WhatsApp"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-black/[0.04] text-black/60 transition hover:bg-black/10"
        >
          {WHATSAPP_ICON}
        </button>
        <button
          type="button"
          onClick={() => shareVia('facebook')}
          aria-label="Share on Facebook"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-black/[0.04] text-black/60 transition hover:bg-black/10"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => shareVia('x')}
          aria-label="Share on X"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-black/[0.04] text-black/60 transition hover:bg-black/10"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
            <path d="M18.9 2H22l-7.4 8.4L23 22h-6.8l-5.3-6.9L4.8 22H1.6l7.9-9L1 2h7l4.8 6.3L18.9 2zm-1.2 18h1.7L7.4 3.9H5.6L17.7 20z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={copyLink}
          aria-label="Copy link"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-black/[0.04] text-black/60 transition hover:bg-black/10"
        >
          {copied ? <CheckIcon size={15} className="text-green-600" /> : <LinkIcon size={15} />}
        </button>
        <button
          type="button"
          onClick={nativeShare}
          className="flex items-center gap-1.5 rounded-full bg-brand-red px-3 py-1.5 text-xs font-semibold text-white transition hover:brightness-110 sm:hidden"
        >
          <ShareIcon size={13} /> பகிர்
        </button>
      </div>
    </div>
  );
}
