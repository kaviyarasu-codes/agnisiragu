'use client';

// src/components/AdSlot.tsx
// Ad units at the standard IAB sizes/positions real news portals
// (Dinamalar, Dailythanthi, Vikatan, etc.) use — leaderboard under the
// header, in-feed native slots between article rows, and a sidebar
// rectangle. Placement + slot IDs are admin-controlled (App Config →
// Website Ad Placements). When ads are off, or a slot has no ID saved
// yet, this falls back to the dashed placeholder box so layout spacing
// never shifts once real ads go live.

import { useEffect, useRef } from 'react';
import type { WebsiteAdsConfig } from '@/lib/api';

const SIZE_LABEL: Record<string, string> = {
  leaderboard: '728 × 90',
  rectangle: '300 × 250',
  infeed: 'Native / In-feed',
};

type AdType = 'leaderboard' | 'rectangle' | 'infeed';

function slotIdFor(type: AdType, ads: WebsiteAdsConfig | undefined): string {
  if (!ads) return '';
  if (type === 'leaderboard') return ads.leaderboardSlotId;
  if (type === 'rectangle') return ads.rectangleSlotId;
  return ads.infeedSlotId;
}

export default function AdSlot({ type = 'infeed', ads }: { type?: AdType; ads?: WebsiteAdsConfig }) {
  const heightClass = type === 'leaderboard' ? 'h-[90px]' : type === 'rectangle' ? 'h-[250px]' : 'h-[100px]';
  const slotId = slotIdFor(type, ads);
  const ready = Boolean(ads?.enabled && ads?.adsensePublisherId && slotId);
  const insRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    if (!ready) return;
    try {
      // @ts-expect-error — adsbygoogle is injected by the AdSense script tag in layout.tsx
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense script not loaded yet (e.g. blocked by an ad blocker) — the
      // <ins> tag just stays empty, no crash.
    }
  }, [ready, slotId]);

  if (!ready) {
    return (
      <div
        className={`flex w-full ${heightClass} items-center justify-center rounded-lg border border-dashed border-black/15 bg-black/[0.03] text-xs font-medium uppercase tracking-wide text-black/30`}
      >
        Advertisement · {SIZE_LABEL[type]}
      </div>
    );
  }

  return (
    <div className={`w-full ${heightClass} overflow-hidden`}>
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', height: '100%' }}
        data-ad-client={ads!.adsensePublisherId}
        data-ad-slot={slotId}
        data-ad-format={type === 'infeed' ? 'fluid' : 'auto'}
        data-full-width-responsive="true"
      />
    </div>
  );
}
