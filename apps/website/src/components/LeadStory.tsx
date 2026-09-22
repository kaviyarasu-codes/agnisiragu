// src/components/LeadStory.tsx
// Big hero slot at the top of the homepage — the single most recent/most
// prominent story, styled like the lead spot on thehindu.com / dinamani.com
// (large image, oversized headline, byline + time under it).

import Link from 'next/link';
import type { Article } from '@/lib/api';
import ImageWatermark from './ImageWatermark';
import MediaThumbnail from './MediaThumbnail';

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

export default function LeadStory({ article }: { article: Article }) {
  return (
    <Link href={`/article/${article.id}`} className="group block">
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-black/5 sm:aspect-[21/9]">
        {article.thumbnailUrl ? (
          <MediaThumbnail
            src={article.thumbnailUrl}
            alt={article.titleTa}
            priority
            player
            className="object-cover transition duration-300 group-hover:scale-105"
            sizes="(max-width: 1024px) 100vw, 720px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-black/20">அக்னிசிறகு</div>
        )}
        {article.isBreaking && (
          <span className="absolute left-3 top-3 rounded bg-brand-red px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white">
            Breaking
          </span>
        )}
        {article.thumbnailUrl && <ImageWatermark size="lg" />}
      </div>
      <div className="mt-4">
        <span className="text-xs font-semibold uppercase tracking-wide text-brand-red">
          {article.category.nameTa}
        </span>
        <h1 className="mt-1 font-tamil text-2xl font-extrabold leading-tight text-black group-hover:text-brand-red sm:text-3xl">
          {article.titleTa}
        </h1>
        {article.excerpt && (
          <p className="mt-2 font-tamil text-base text-black/60 line-clamp-2">{article.excerpt}</p>
        )}
        <div className="mt-3 flex items-center gap-2 text-xs text-black/40">
          {article.byline && <span>{article.byline}</span>}
          {article.byline && <span>·</span>}
          <span>{timeAgo(article.publishedAt)}</span>
        </div>
      </div>
    </Link>
  );
}
