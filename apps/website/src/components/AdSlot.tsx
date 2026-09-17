'use client';

// src/components/AdSlot.tsx
// Ad units at the standard IAB sizes/positions real news portals
// (Dinamalar, Dailythanthi, Vikatan, etc.) use — leaderboard under the
// header, in-feed native slots between article rows, and a sidebar
// rectangle. Placement + slot IDs are admin-controlled (App Config →
// Website Ad Placements). When ads are off, or a slot has no ID saved
// yet, this falls back to the dashed placeholder box so layout spacing
// never shifts once real ads go live.
//
// Both ad systems are wired in: when Local Ads are enabled and at least
// one is active, that's what shows (self-hosted, no Google revenue cut).
// Otherwise this falls back to Google AdSense exactly as before. This
// mirrors the reader-app's existing Local-Ads-first / AdMob-fallback
// pattern (see AdBanner.tsx) so both platforms behave the same way.

import { useEffect, useRef, useState } from 'react';
import type { WebsiteAdsConfig } from '@/lib/api';
import { fetchLocalAds, nextRotationIndex, type LocalAd } from '@/lib/localAds';
import LocalAdSlot from './LocalAdSlot';

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
  const adsenseReady = Boolean(ads?.enabled && ads?.adsensePublisherId && slotId);
  const insRef = useRef<HTMLModElement>(null);

  const localAdsWanted = ads?.localAdsEnable !== false;
  const [localAd, setLocalAd] = useState<LocalAd | null>(null);
  const [localAdsChecked, setLocalAdsChecked] = useState(!localAdsWanted);

  useEffect(() => {
    if (!localAdsWanted) return;
    let cancelled = false;
    fetchLocalAds().then((all) => {
      if (cancelled) return;
      if (all.length > 0) {
        setLocalAd(all[nextRotationIndex() % all.length]);
      }
      setLocalAdsChecked(true);
    });
    return () => {
      cancelled = true;
    };
  }, [localAdsWanted]);

  useEffect(() => {
    if (localAd || !adsenseReady) return;
    try {
      // @ts-expect-error — adsbygoogle is injected by the AdSense script tag in layout.tsx
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense script not loaded yet (e.g. blocked by an ad blocker) — the
      // <ins> tag just stays empty, no crash.
    }
  }, [localAd, adsenseReady, slotId]);

  // Local Ads win when one's available — checked first so we don't flash
  // an AdSense unit and then swap it out once the local-ads fetch resolves.
  if (localAd) {
    return <LocalAdSlot ad={localAd} type={type} />;
  }

  // Still waiting on the local-ads fetch — hold rather than showing
  // AdSense first and then swapping to a Local Ad a moment later. All
  // <AdSlot> instances on a page share one cached fetch (see
  // lib/localAds.ts), so this only costs one round trip per page load.
  if (!localAdsChecked) {
    return (
      <div className={`w-full ${heightClass} rounded-lg border border-dashed border-black/15 bg-black/[0.03]`} />
    );
  }

  if (!adsenseReady) {
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
