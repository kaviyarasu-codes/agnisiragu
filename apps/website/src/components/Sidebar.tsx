// src/components/Sidebar.tsx
// Right rail on the homepage — trending list, an ad rectangle, and an app
// download card, mirroring the sidebar layout of Dinamalar/Vikatan-style
// portals. `trending` is just the most recent articles sorted by
// engagement (likeCount + commentCount) since there's no separate
// analytics endpoint yet.

import Link from 'next/link';
import type { Article, WebsiteAdsConfig } from '@/lib/api';
import AdSlot from './AdSlot';

const PLAY_STORE_URL =
  process.env.NEXT_PUBLIC_PLAY_STORE_URL ??
  'https://play.google.com/store/apps/details?id=com.agnisiragu.reader';

export default function Sidebar({ trending, ads }: { trending: Article[]; ads?: WebsiteAdsConfig }) {
  return (
    <aside className="flex flex-col gap-6">
      <div className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-black/10 bg-black/[0.02] px-4 py-3">
          <span className="h-5 w-1 rounded-full bg-brand-red" />
          <h2 className="font-tamil text-base font-extrabold text-black">அதிகம் படிக்கப்பட்டவை</h2>
        </div>
        <ol className="flex flex-col divide-y divide-black/5 px-4">
          {trending.map((a, i) => (
            <li key={a.id} className="flex gap-3 py-3">
              <span className="font-tamil text-2xl font-extrabold text-brand-red/20">{i + 1}</span>
              <Link
                href={`/article/${a.id}`}
                className="font-tamil text-sm font-semibold leading-snug text-black/85 hover:text-brand-red"
              >
                {a.titleTa}
              </Link>
            </li>
          ))}
        </ol>
      </div>

      <AdSlot type="rectangle" ads={ads} />

      <div className="overflow-hidden rounded-xl bg-brand-black text-white">
        <div className="p-5">
          <p className="font-tamil text-xl font-extrabold">All Your News, One Place</p>
          <p className="mt-1 text-sm text-white/60">Daily updates, breaking alerts, your district — all in the app.</p>
          <a
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 block rounded-lg bg-brand-red py-2.5 text-center text-sm font-bold text-white hover:brightness-110"
          >
            Download on Play Store
          </a>
        </div>
      </div>
    </aside>
  );
}
