import { notFound } from 'next/navigation';
import Image from 'next/image';
import type { Metadata } from 'next';
import { getArticle, getCategoryArticles, getSiteConfig } from '@/lib/api';
import RelatedNews from '@/components/RelatedNews';
import ArticleNav from '@/components/ArticleNav';
import AdSlot from '@/components/AdSlot';
import AuthorCard from '@/components/AuthorCard';
import ArticleActions from '@/components/ArticleActions';
import ImageWatermark from '@/components/ImageWatermark';
import CommentsSection from '@/components/CommentsSection';

export const revalidate = 60;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agnisiragu.com';

async function loadArticle(id: string) {
  const result = await getArticle(id);
  if (!result?.data) return null;
  return result.data;
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const article = await loadArticle(params.id);
  if (!article) return { title: 'Agnisiragu' };

  const description = article.excerpt ?? article.titleEn ?? undefined;
  const url = `/article/${article.id}`;

  return {
    title: article.titleTa,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: article.titleTa,
      description,
      url,
      type: 'article',
      publishedTime: article.publishedAt ?? undefined,
      authors: article.byline ? [article.byline] : undefined,
      images: article.thumbnailUrl
        ? [{ url: article.thumbnailUrl, width: 1200, height: 630, alt: article.titleTa }]
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.titleTa,
      description,
      images: article.thumbnailUrl ? [article.thumbnailUrl] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: { params: { id: string } }) {
  const article = await loadArticle(params.id);
  if (!article) notFound();

  // Related + prev/next are derived from the same-category list since
  // there's no dedicated related-articles endpoint on the backend yet.
  const [categoryArticles, { ads }] = await Promise.all([
    getCategoryArticles(article.categoryId),
    getSiteConfig(),
  ]);
  const currentIndex = categoryArticles.findIndex((a) => a.id === article.id);

  const prev = currentIndex >= 0 ? categoryArticles[currentIndex + 1] ?? null : null;
  const next = currentIndex > 0 ? categoryArticles[currentIndex - 1] ?? null : null;

  const related = categoryArticles.filter((a) => a.id !== article.id).slice(0, 6);

  // NewsArticle structured data — Google News/Discover eligibility and
  // rich-result headline/image/date treatment in search.
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.titleTa,
    image: article.thumbnailUrl ? [article.thumbnailUrl] : undefined,
    datePublished: article.publishedAt ?? undefined,
    dateModified: article.publishedAt ?? undefined,
    author: article.byline ? [{ '@type': 'Person', name: article.byline }] : undefined,
    publisher: {
      '@type': 'Organization',
      name: 'அக்னிசிறகு',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/article/${article.id}` },
  };

  return (
    <article className="mx-auto max-w-3xl px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <span className="text-xs font-semibold uppercase tracking-wide text-brand-red">
        {article.category.nameTa}
      </span>
      <h1 className="mt-2 font-tamil text-3xl font-extrabold leading-tight text-black">
        {article.titleTa}
      </h1>
      <AuthorCard byline={article.byline} publishedAt={article.publishedAt} />

      <ArticleActions
        articleId={article.id}
        title={article.titleTa}
        likeCount={article.likeCount}
        dislikeCount={article.dislikeCount}
        commentCount={article.commentCount}
      />

      {article.thumbnailUrl && (
        <div className="relative mt-6 aspect-video w-full overflow-hidden rounded-xl bg-black/5">
          <Image src={article.thumbnailUrl} alt={article.titleTa} fill className="object-cover" priority />
          <ImageWatermark size="lg" />
        </div>
      )}

      {/* bodyTa is rich text authored in the admin panel (Tiptap editor) —
          trusted CMS content, not user input, so rendering it as HTML here
          mirrors how the admin panel itself displays it. */}
      <div
        className="article-body mt-8 font-tamil text-[17px] leading-8 text-black/85"
        dangerouslySetInnerHTML={{ __html: article.bodyTa }}
      />

      <div className="mt-8">
        <AdSlot type="rectangle" ads={ads} />
      </div>

      <CommentsSection articleId={article.id} />

      <ArticleNav prev={prev} next={next} />
      <RelatedNews articles={related} />
    </article>
  );
}
