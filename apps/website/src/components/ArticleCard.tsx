// src/components/ArticleCard.tsx

import Image from 'next/image';
import Link from 'next/link';
import type { Article } from '@/lib/api';
import ImageWatermark from './ImageWatermark';

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

export default function ArticleCard({ article }: { article: Article }) {
  return (
    <Link
      href={`/article/${article.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-brand-red/30 hover:shadow-lg"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-black/5">
        {article.thumbnailUrl ? (
          <Image
            src={article.thumbnailUrl}
            alt={article.titleTa}
            fill
            className="object-cover transition duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-tamil text-lg font-bold text-black/15">
            அக்னிசிறகு
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
        <span className="absolute left-2.5 top-2.5 rounded bg-brand-red/95 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm">
          {article.category.nameTa}
        </span>
        {article.isBreaking && (
          <span className="absolute right-2.5 top-2.5 rounded bg-black/80 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
            Breaking
          </span>
        )}
        {article.thumbnailUrl && <ImageWatermark size="md" />}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-tamil text-lg font-bold leading-snug text-black group-hover:text-brand-red">
          {article.titleTa}
        </h3>
        {article.excerpt && (
          <p className="line-clamp-2 font-tamil text-sm text-black/55">{article.excerpt}</p>
        )}
        <div className="mt-auto flex items-center justify-between border-t border-black/5 pt-2.5">
          <span className="text-xs text-black/40">{timeAgo(article.publishedAt)}</span>
          {article.commentCount > 0 && (
            <span className="text-xs text-black/40">{article.commentCount} கருத்துகள்</span>
          )}
        </div>
      </div>
    </Link>
  );
}
