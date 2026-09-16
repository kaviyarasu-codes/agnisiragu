// src/components/ArticleRow.tsx
// Compact horizontal card used inside dense category sections — small
// thumbnail, headline, time. This is what gives the homepage tabloid-level
// density (many headlines per screen) without every story needing a big
// photo card, mirroring how Dailythanthi/Dinamalar pack their sections.

import Image from 'next/image';
import Link from 'next/link';
import type { Article } from '@/lib/api';

function timeAgo(iso: string | null): string {
  if (!iso) return '';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'இப்போது';
  if (mins < 60) return `${mins} நிமிடம் முன்`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} மணி நேரம் முன்`;
  const days = Math.floor(hours / 24);
  return `${days} நாட்கள் முன்`;
}

export default function ArticleRow({ article }: { article: Article }) {
  return (
    <Link href={`/article/${article.id}`} className="group flex gap-3 py-3">
      <div className="relative aspect-square w-16 shrink-0 overflow-hidden rounded-lg bg-black/5">
        {article.thumbnailUrl ? (
          <Image
            src={article.thumbnailUrl}
            alt={article.titleTa}
            fill
            className="object-cover transition duration-300 group-hover:scale-105"
            sizes="64px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[9px] text-black/20">அக்னி</div>
        )}
      </div>
      <div className="flex flex-1 flex-col justify-center gap-0.5">
        <h4 className="font-tamil text-sm font-bold leading-snug text-black group-hover:text-brand-red line-clamp-2">
          {article.titleTa}
        </h4>
        <span className="text-[11px] text-black/40">{timeAgo(article.publishedAt)}</span>
      </div>
    </Link>
  );
}
