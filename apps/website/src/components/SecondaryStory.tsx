// src/components/SecondaryStory.tsx
// Smaller story used beside the lead in the homepage hero cluster —
// compact image + headline, no excerpt, so two of these can sit next to
// the big lead story without competing with it. Same pattern as the
// "top stories" rail on The Hindu / BBC Tamil homepages.

import Link from 'next/link';
import type { Article } from '@/lib/api';
import ImageWatermark from './ImageWatermark';
import MediaThumbnail from './MediaThumbnail';

export default function SecondaryStory({ article }: { article: Article }) {
  return (
    <Link href={`/article/${article.id}`} className="group flex gap-3">
      <div className="relative aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-lg bg-black/5 sm:w-28">
        {article.thumbnailUrl ? (
          <>
            <MediaThumbnail
              src={article.thumbnailUrl}
              alt={article.titleTa}
              className="object-cover transition duration-300 group-hover:scale-105"
              sizes="112px"
            />
            <ImageWatermark size="xs" />
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-[10px] text-black/20">அக்னிசிறகு</div>
        )}
      </div>
      <div className="flex flex-1 flex-col justify-center py-0.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-red">
          {article.category.nameTa}
        </span>
        <h3 className="mt-0.5 font-tamil text-[15px] font-bold leading-snug text-black group-hover:text-brand-red line-clamp-3">
          {article.titleTa}
        </h3>
      </div>
    </Link>
  );
}
