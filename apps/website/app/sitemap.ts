// app/sitemap.ts
// Next.js file convention — auto-serves this at /sitemap.xml. Combines the
// static pages with live categories + recent articles from the API so it
// stays current without a manual step.
import type { MetadataRoute } from 'next';
import { getArticles, getCategories } from '@/lib/api';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agnisiragu.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ data: articles }, { data: categories }] = await Promise.all([
    getArticles().catch(() => ({ data: [] })),
    getCategories().catch(() => ({ data: [] })),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: 'hourly', priority: 1 },
    { url: `${SITE_URL}/about`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${SITE_URL}/contact`, changeFrequency: 'monthly', priority: 0.3 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${SITE_URL}/?category=${c.id}`,
    changeFrequency: 'hourly',
    priority: 0.6,
  }));

  const articleRoutes: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${SITE_URL}/article/${a.id}`,
    lastModified: a.publishedAt ? new Date(a.publishedAt) : undefined,
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  return [...staticRoutes, ...categoryRoutes, ...articleRoutes];
}
