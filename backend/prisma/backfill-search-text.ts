// prisma/backfill-search-text.ts
//
// One-time backfill for Article.searchText on articles that existed before
// the Thanglish/English search feature was added (news.service.ts now
// computes this automatically on every future create/update). Run once
// after migrating:
//
//   npx prisma migrate dev
//   npx ts-node prisma/backfill-search-text.ts
//
// Safe to re-run — it just recomputes searchText for every article.

import { PrismaClient } from '@prisma/client';
import { buildArticleSearchText } from '../src/common/utils/tamil-transliterate';

const prisma = new PrismaClient();

async function main() {
  const articles = await prisma.article.findMany({
    include: { category: { select: { nameEn: true } } },
  });

  console.log(`Backfilling searchText for ${articles.length} article(s)...`);

  let done = 0;
  for (const a of articles) {
    const searchText = buildArticleSearchText({
      titleTa: a.titleTa,
      bodyTa: a.bodyTa,
      titleEn: a.titleEn,
      excerpt: a.excerpt,
      byline: a.byline,
      categoryNameEn: a.category?.nameEn,
    });
    await prisma.article.update({ where: { id: a.id }, data: { searchText } });
    done += 1;
    if (done % 50 === 0) console.log(`  ...${done}/${articles.length}`);
  }

  console.log(`✅ Done. Backfilled ${done} article(s).`);
}

main()
  .catch((err) => {
    console.error(err);
    // Re-throw instead of process.exit(1) — avoids depending on Node's
    // global types being resolved correctly in every ts-node environment.
    // An unhandled rejection still exits the process with a non-zero code.
    throw err;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
