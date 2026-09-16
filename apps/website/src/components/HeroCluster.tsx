// src/components/HeroCluster.tsx
// Homepage hero: one big lead story plus a short stack of secondary top
// stories beside it — magazine-style organization (clean hierarchy, not
// a wall of identical cards) while still surfacing several headlines
// above the fold, the way The Hindu/BBC Tamil balance density with calm.

import type { Article } from '@/lib/api';
import LeadStory from './LeadStory';
import SecondaryStory from './SecondaryStory';

export default function HeroCluster({ lead, secondary }: { lead: Article; secondary: Article[] }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm sm:p-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
        <LeadStory article={lead} />
        {secondary.length > 0 && (
          <div className="flex flex-col divide-y divide-black/5 lg:border-l lg:border-black/10 lg:pl-6">
            {secondary.map((a) => (
              <div key={a.id} className="py-3.5 first:pt-0 last:pb-0">
                <SecondaryStory article={a} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
