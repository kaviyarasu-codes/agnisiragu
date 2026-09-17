'use client';

// src/components/LocalAdSlot.tsx
// Renders one Local Ad (Admin Panel -> Local Ads, the same self-hosted
// system the reader-app uses) inside a website ad slot. AdSlot.tsx decides
// whether to show this or a Google AdSense unit; this component only
// handles the Local Ad's own layout + impression/click tracking.

import { useEffect } from 'react';
import type { LocalAd } from '@/lib/localAds';
import { resolveLocalAdUrl, localAdCtaLabel, trackLocalAdImpression, trackLocalAdClick } from '@/lib/localAds';

type AdType = 'leaderboard' | 'rectangle' | 'infeed';

export default function LocalAdSlot({ ad, type }: { ad: LocalAd; type: AdType }) {
  useEffect(() => {
    trackLocalAdImpression(ad.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ad.id]);

  const href = resolveLocalAdUrl(ad);
  const cta = localAdCtaLabel(ad);

  if (type === 'rectangle') {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer sponsored"
        onClick={() => trackLocalAdClick(ad.id)}
        className="relative flex h-[250px] w-full flex-col overflow-hidden rounded-lg border border-black/10 bg-white"
      >
        <span className="absolute left-2 top-2 z-10 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          விளம்பரம்
        </span>
        <div className="relative h-[150px] w-full bg-black/5">
          {ad.mediaUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={ad.mediaUrl} alt={ad.title} className="h-full w-full object-cover" />
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1.5 p-3">
          <p className="font-tamil text-sm font-bold leading-snug text-black line-clamp-2">{ad.title}</p>
          {ad.description && <p className="line-clamp-2 text-xs text-black/55">{ad.description}</p>}
          <span className="mt-auto inline-block w-fit rounded-full bg-brand-red px-3 py-1 text-xs font-semibold text-white">
            {cta}
          </span>
        </div>
      </a>
    );
  }

  // leaderboard + infeed share a horizontal card layout, just different heights
  const imgSize = type === 'leaderboard' ? 'h-full w-[90px]' : 'h-24 w-24';

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      onClick={() => trackLocalAdClick(ad.id)}
      className={`relative flex w-full items-center gap-3 overflow-hidden rounded-lg border border-black/10 bg-white ${
        type === 'leaderboard' ? 'h-[90px]' : 'h-auto min-h-[100px] p-2'
      }`}
    >
      <span className="absolute left-2 top-2 z-10 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
        AD
      </span>
      <div className={`shrink-0 bg-black/5 ${imgSize}`}>
        {ad.mediaUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ad.mediaUrl} alt={ad.title} className="h-full w-full object-cover" />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1 py-2 pr-3">
        <p className="font-tamil text-sm font-bold leading-snug text-black line-clamp-1">{ad.title}</p>
        {ad.description && <p className="line-clamp-1 text-xs text-black/55">{ad.description}</p>}
        <span className="mt-0.5 inline-block w-fit rounded-full bg-brand-red px-2.5 py-0.5 text-[11px] font-semibold text-white">
          {cta}
        </span>
      </div>
    </a>
  );
}
