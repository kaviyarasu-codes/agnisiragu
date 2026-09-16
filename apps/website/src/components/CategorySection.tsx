// src/components/CategorySection.tsx
// One "section block" on the homepage — a category heading with a "see
// all" link, and a dense list of that category's latest stories. Several
// of these stacked is what gives the homepage its section-by-section
// organization (like The Hindu) while staying dense (like Dailythanthi).

import Link from 'next/link';
import type { Article, Category } from '@/lib/api';
import ArticleRow from './ArticleRow';

export default function CategorySection({
  category,
  articles,
}: {
  category: Category;
  articles: Article[];
}) {
  if (articles.length === 0) return null;

  return (
    <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-black/10 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="h-5 w-1.5 rounded-full bg-brand-red" />
          <h2 className="font-tamil text-lg font-extrabold text-black">{category.nameTa}</h2>
        </div>
        <Link
          href={`/?category=${category.id}`}
          className="text-xs font-semibold text-black/40 hover:text-brand-red"
        >
          மேலும் பார்க்க →
        </Link>
      </div>
      <div className="divide-y divide-black/5">
        {articles.map((a) => (
          <ArticleRow key={a.id} article={a} />
        ))}
      </div>
    </section>
  );
}
