// src/components/ImageWatermark.tsx
// Small brand watermark overlaid on article photos — mirrors the reader
// app's ImageWatermark.tsx (apps/reader-app/src/components/feed/
// ImageWatermark.tsx): same logo, same bottom-right-by-default placement,
// same "sits directly on the photo, drop-shadow instead of a pill chip"
// look, so a screenshot of either platform reads as the same brand.
// Purely decorative — pointer-events-none so it never blocks the card's
// own link/click area.
//
// Parent element must be `relative` (every card component below already
// wraps its <Image> in a `relative` div).
//
// Only rendered for articles where thumbnailWatermarked is false — i.e.
// ones uploaded before MediaService.bakeWatermark existed (or where the
// bake silently failed). Newer uploads already have the logo baked into
// the actual file (see media.service.ts), so drawing this on top of those
// would double the logo in the same corner — see each caller's
// `!article.thumbnailWatermarked` guard.

import Image from 'next/image';

// width/height are the desktop (sm+) intrinsic size passed to next/image;
// cls scales it down below the sm breakpoint — on a ~320-360px phone
// viewport the desktop size reads as oversized relative to the image it
// sits on, especially the "lg" hero watermark.
const SIZES = {
  xs: { width: 28, height: 13, cls: 'w-5 sm:w-7' }, // tiny thumbnails — ArticleRow, SecondaryStory
  md: { width: 50, height: 22, cls: 'w-9 sm:w-[50px]' }, // card-sized images — ArticleCard
  lg: { width: 68, height: 30, cls: 'w-11 sm:w-[68px]' }, // hero / lead images — LeadStory, article detail
} as const;

export default function ImageWatermark({
  size = 'md',
  corner = 'bottom-right',
}: {
  size?: keyof typeof SIZES;
  corner?: 'bottom-right' | 'top-right';
}) {
  const { width, height, cls } = SIZES[size];
  return (
    <div
      className={`pointer-events-none absolute z-10 opacity-90 [filter:drop-shadow(0_1px_2px_rgba(0,0,0,0.6))] ${
        corner === 'top-right' ? 'right-1.5 top-1.5' : 'bottom-1.5 right-1.5'
      }`}
    >
      <Image src="/logo.png" alt="" width={width} height={height} className={`h-auto ${cls}`} />
    </div>
  );
}
