// src/components/BreakingTicker.tsx
// Horizontally scrolling breaking-news strip — the marquee every Tamil
// news portal (Dinamalar, Dailythanthi, Polimer) runs under the header.
// Pure CSS animation, no JS needed, so it stays a server component.

import Link from 'next/link';
import type { Article } from '@/lib/api';

export default function BreakingTicker({ articles }: { articles: Article[] }) {
  if (articles.length === 0) return null;

  // Duplicate the list so the CSS loop (-50% translate) reads seamlessly.
  const looped = [...articles, ...articles];

  return (
    <div className="flex items-center border-b border-black/10 bg-white">
      <span className="z-10 flex shrink-0 items-center gap-1.5 bg-brand-red px-3 py-2 text-xs font-bold uppercase tracking-wide text-white">
        Breaking
      </span>
      <div className="group flex-1 overflow-hidden">
        <div className="flex w-max animate-[ticker_30s_linear_infinite] gap-10 py-2 group-hover:[animation-play-state:paused]">
          {looped.map((a, i) => (
            <Link
              key={`${a.id}-${i}`}
              href={`/article/${a.id}`}
              className="whitespace-nowrap font-tamil text-sm font-semibold text-black/80 hover:text-brand-red"
            >
              {a.titleTa}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
