'use client';
// src/components/MediaGallery.tsx
// Website equivalent of the reader app's MediaCarousel.tsx — a swipeable
// gallery over an article's full mediaUrls (photos + videos), with a
// photo/video count badge and position dots, instead of showing only the
// single thumbnailUrl. Falls back to just the thumbnail when there's no
// extra gallery media, so every existing single-image article renders
// exactly as before.
//
// Same item-selection rule as the reader app (see MediaCarousel.tsx): when
// mediaUrls has entries, those ARE the gallery (thumbnailUrl is not also
// shown alongside them) — only falls back to [thumbnailUrl] when mediaUrls
// is empty. Kept identical on purpose so the website and app show the same
// set of media for the same article.

import { useRef, useState } from 'react';
import MediaThumbnail from './MediaThumbnail';
import ImageWatermark from './ImageWatermark';
import { isVideoUrl } from '@/lib/media';

interface Props {
  mediaUrls: string[];
  thumbnailUrl: string | null | undefined;
  alt: string;
  thumbnailWatermarked?: boolean;
}

export default function MediaGallery({ mediaUrls, thumbnailUrl, alt, thumbnailWatermarked }: Props) {
  const items = mediaUrls && mediaUrls.length > 0 ? mediaUrls : thumbnailUrl ? [thumbnailUrl] : [];
  const [index, setIndex] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);

  if (items.length === 0) return null;

  function onScroll() {
    const el = scrollerRef.current;
    if (!el || el.clientWidth === 0) return;
    const next = Math.round(el.scrollLeft / el.clientWidth);
    setIndex(Math.max(0, Math.min(next, items.length - 1)));
  }

  return (
    <div className="relative mt-6 aspect-video w-full overflow-hidden rounded-xl bg-black">
      {items.length === 1 ? (
        <>
          <MediaThumbnail src={items[0]} alt={alt} className="object-contain" priority player />
          {!thumbnailWatermarked && <ImageWatermark size="lg" />}
        </>
      ) : (
        <div
          ref={scrollerRef}
          onScroll={onScroll}
          className="flex h-full w-full snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map((url, i) => (
            <div key={`${url}-${i}`} className="relative h-full w-full flex-none snap-center">
              <MediaThumbnail src={url} alt={alt} className="object-contain" priority={i === 0} player />
            </div>
          ))}
          {!thumbnailWatermarked && <ImageWatermark size="lg" />}
        </div>
      )}

      {items.length > 1 && (
        <>
          <div className="pointer-events-none absolute left-2.5 top-2.5 z-10 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white">
            {isVideoUrl(items[index]) ? 'video' : 'photo'} · {index + 1}/{items.length}
          </div>
          <div className="pointer-events-none absolute bottom-2 left-0 right-0 z-10 flex justify-center gap-1.5">
            {items.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-1.5 rounded-full ${i === index ? 'bg-white' : 'bg-white/40'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
