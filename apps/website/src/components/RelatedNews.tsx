// src/components/RelatedNews.tsx
// "More from this category" grid shown at the bottom of an article — same
// pattern as thehindu.com/dinamalar's "Related" rail. Reuses ArticleCard so
// it looks identical to the homepage grid.

import type { Article } from '@/lib/api';
import ArticleCard from './ArticleCard';

export default function RelatedNews({ articles }: { articles: Article[] }) {
  if (articles.length === 0) return null;

  return (
    <section className="mt-12 border-t border-black/10 pt-8">
      <h2 className="font-tamil text-xl font-extrabold text-black">தொடர்புடைய செய்திகள்</h2>
      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((a) => (
          <ArticleCard key={a.id} article={a} />
        ))}
      </div>
    </section>
  );
}
