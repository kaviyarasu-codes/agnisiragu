// src/components/ArticleNav.tsx
// Previous/Next story links shown under the article body — lets a reader
// keep moving through the feed without going back to the homepage, same
// as the prev/next story footer on most news portals.

import Link from 'next/link';
import type { Article } from '@/lib/api';

function NavCard({ article, direction }: { article: Article; direction: 'prev' | 'next' }) {
  const isPrev = direction === 'prev';
  return (
    <Link
      href={`/article/${article.id}`}
      className={`group flex flex-1 flex-col gap-1 rounded-lg border border-black/10 p-4 transition hover:border-brand-red ${
        isPrev ? 'text-left' : 'text-right sm:items-end'
      }`}
    >
      <span className="text-xs font-semibold uppercase tracking-wide text-black/40">
        {isPrev ? '← முந்தைய செய்தி' : 'அடுத்த செய்தி →'}
      </span>
      <span className="font-tamil text-sm font-bold leading-snug text-black group-hover:text-brand-red line-clamp-2">
        {article.titleTa}
      </span>
    </Link>
  );
}

export default function ArticleNav({
  prev,
  next,
}: {
  prev: Article | null;
  next: Article | null;
}) {
  if (!prev && !next) return null;

  return (
    <nav className="mt-10 flex flex-col gap-3 sm:flex-row">
      {prev ? <NavCard article={prev} direction="prev" /> : <div className="flex-1" />}
      {next ? <NavCard article={next} direction="next" /> : <div className="flex-1" />}
    </nav>
  );
}
