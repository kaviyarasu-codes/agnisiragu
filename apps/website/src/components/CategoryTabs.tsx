'use client';

// src/components/CategoryTabs.tsx
// Bold full-width red category strip, styled after the nav bar on
// Dinamalar/Dailythanthi rather than a soft rounded-pill filter. Client
// component so clicking a tab can update the URL's ?category= query param
// without a full page reload; the homepage server component re-fetches
// articles for the selected category based on that param.

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { Category } from '@/lib/api';

export default function CategoryTabs({ categories }: { categories: Category[] }) {
  const searchParams = useSearchParams();
  const activeId = searchParams.get('category');

  return (
    <nav className="border-b border-black/10 bg-brand-black">
      <div className="scrollbar-hide mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4">
        <Link
          href="/"
          className={`whitespace-nowrap border-b-[3px] px-3.5 py-2.5 font-tamil text-sm font-bold transition ${
            !activeId
              ? 'border-brand-red text-white'
              : 'border-transparent text-white/55 hover:border-white/30 hover:text-white'
          }`}
        >
          அனைத்தும்
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/?category=${c.id}`}
            className={`whitespace-nowrap border-b-[3px] px-3.5 py-2.5 font-tamil text-sm font-bold transition ${
              activeId === c.id
                ? 'border-brand-red text-white'
                : 'border-transparent text-white/55 hover:border-white/30 hover:text-white'
            }`}
          >
            {c.nameTa}
          </Link>
        ))}
      </div>
    </nav>
  );
}
