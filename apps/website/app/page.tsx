import { Fragment, Suspense } from 'react';
import { getArticles, getCategories, getSiteConfig, getHomepagePicks } from '@/lib/api';
import type { Article, Category, WebsiteAdsConfig } from '@/lib/api';
import ArticleCard from '@/components/ArticleCard';
import CategoryTabs from '@/components/CategoryTabs';
import Sidebar from '@/components/Sidebar';
import AdSlot from '@/components/AdSlot';
import HeroCluster from '@/components/HeroCluster';
import AppPromoBanner from '@/components/AppPromoBanner';
import SectionHeading from '@/components/SectionHeading';
import CategorySection from '@/components/CategorySection';

export const revalidate = 60;

// How many stories each homepage category section shows.
const ARTICLES_PER_SECTION = 5;

function trendingFrom(articles: Article[]) {
  return [...articles]
    .sort((a, b) => b.likeCount + b.commentCount - (a.likeCount + a.commentCount))
    .slice(0, 5);
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const categoryId = searchParams.category;

  const [{ data: categories }, { data: articles }, { ads, site }, { data: picks }] = await Promise.all([
    getCategories().catch(() => ({ data: [] })),
    getArticles(categoryId).catch(() => ({ data: [] })),
    getSiteConfig(),
    // Only the default (non-category) homepage shows the curated hero.
    categoryId ? Promise.resolve({ data: [] as Article[] }) : getHomepagePicks().catch(() => ({ data: [] as Article[] })),
  ]);

  return (
    <>
      <Suspense fallback={null}>
        <CategoryTabs categories={categories} />
      </Suspense>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {articles.length === 0 ? (
          <p className="mt-16 text-center text-black/40">தற்போது செய்திகள் இல்லை.</p>
        ) : categoryId ? (
          <FilteredCategoryView articles={articles} ads={ads} />
        ) : (
          <HomepageView articles={articles} categories={categories} ads={ads} sectionCount={site.homepageSectionCount} picks={picks} />
        )}
      </div>
    </>
  );
}

// Single dense grid for a chosen category — focused browsing once someone
// picks a tab, as opposed to the sectioned overview below.
function FilteredCategoryView({ articles, ads }: { articles: Article[]; ads: WebsiteAdsConfig }) {
  const trending = trendingFrom(articles);
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
      <div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {articles.map((article, i) => (
            <Fragment key={article.id}>
              <ArticleCard article={article} />
              {(i + 1) % ads.inFeedFrequency === 0 && (
                <div className="sm:col-span-2">
                  <AdSlot type="infeed" ads={ads} />
                </div>
              )}
            </Fragment>
          ))}
        </div>
      </div>
      <Sidebar trending={trending} ads={ads} />
    </div>
  );
}

// The default homepage: hero cluster up top, then a stack of dense
// per-category sections — combines The Hindu's clean section-by-section
// organization with Dailythanthi/Dinamalar's headline density.
async function HomepageView({
  articles,
  categories,
  ads,
  sectionCount,
  picks,
}: {
  articles: Article[];
  categories: Category[];
  ads: WebsiteAdsConfig;
  sectionCount: number;
  // Admin-curated (or auto-filled) hero picks — see HomePage above and
  // NewsService.homepagePicks. Excluded from `articles` below so the same
  // article never shows twice (once in the hero, once in Recent News).
  picks: Article[];
}) {
  const pickedIds = new Set(picks.map((a) => a.id));
  const lead = picks[0];
  const secondary = picks.slice(1, 6);
  const rest = articles.filter((a) => !pickedIds.has(a.id));
  const trending = trendingFrom(articles);

  const sectionCategories = categories.slice(0, sectionCount);
  const sectionResults = await Promise.all(
    sectionCategories.map((c) =>
      getArticles(c.id)
        .then((r) => r.data.slice(0, ARTICLES_PER_SECTION))
        .catch(() => [] as Article[])
    )
  );

  return (
    <>
      {lead && <HeroCluster lead={lead} secondary={secondary} />}

      <div className="my-6">
        <AdSlot type="leaderboard" ads={ads} />
      </div>

      {/* Big, centered, impossible-to-miss app CTA — separate from the
          small corner popup and the sidebar promo card. */}
      <AppPromoBanner />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          <SectionHeading title="சமீபத்திய செய்திகள்" />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {rest.slice(0, 6).map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>

          {sectionCategories.map((category, i) => (
            <Fragment key={category.id}>
              <CategorySection category={category} articles={sectionResults[i]} />
              {i === 1 && <AdSlot type="infeed" ads={ads} />}
            </Fragment>
          ))}
        </div>

        <Sidebar trending={trending} ads={ads} />
      </div>
    </>
  );
}
