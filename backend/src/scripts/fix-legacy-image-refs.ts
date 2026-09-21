// src/scripts/fix-legacy-image-refs.ts
//
// Follow-up to import-legacy-articles.ts. The images referenced by the
// recovered articles (thumbnailUrl + inline <img> tags in bodyTa/bodyEn)
// all point at the old, now-dead agnisiragu.in/.com /uploads/images/...
// paths. Confirmed via the Wayback Machine's CDX + availability APIs
// across a broad sample: none of those image files were ever archived —
// only the article HTML pages were crawled, not the uploads directory.
// The image bytes are unrecoverable.
//
// Rather than leave broken image links on the live site, this script:
//   1. Nulls out thumbnailUrl on legacy-imported articles that still
//      point at the dead domains (the site already renders a graceful
//      fallback for articles with no thumbnail).
//   2. Strips any inline <img> tag whose src points at the dead domains
//      out of bodyTa/bodyEn (a dangling broken-image icon otherwise).
//
// Safe to re-run: only touches rows where a dead-domain reference is
// still present, so a second run is a no-op.
//   node dist/scripts/fix-legacy-image-refs.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const LEGACY_BYLINE = 'அக்னிசிறகு காப்பகம்';

// Matches thumbnailUrl / img src values on the old site's dead domains,
// with or without "www.", either TLD.
const DEAD_DOMAIN = /^https?:\/\/(www\.)?agnisiragu\.(in|com)\/uploads\//i;

function stripDeadImages(html: string): string {
  // Remove <img ... src="https://(www.)agnisiragu.(in|com)/uploads/...">
  // tags entirely, whatever other attributes/whitespace surround them.
  return html.replace(
    /<img\b[^>]*\bsrc=["']https?:\/\/(www\.)?agnisiragu\.(in|com)\/uploads\/[^"']*["'][^>]*>\s*/gi,
    '',
  );
}

async function main() {
  const articles = await prisma.article.findMany({
    where: { byline: LEGACY_BYLINE },
    select: { id: true, titleTa: true, thumbnailUrl: true, bodyTa: true, bodyEn: true },
  });

  console.log(`Checking ${articles.length} legacy articles for dead image references.`);

  let fixed = 0;
  for (const a of articles) {
    const data: { thumbnailUrl?: null; bodyTa?: string; bodyEn?: string } = {};

    if (a.thumbnailUrl && DEAD_DOMAIN.test(a.thumbnailUrl)) {
      data.thumbnailUrl = null;
    }
    const newBodyTa = stripDeadImages(a.bodyTa);
    if (newBodyTa !== a.bodyTa) data.bodyTa = newBodyTa;
    const newBodyEn = stripDeadImages(a.bodyEn);
    if (newBodyEn !== a.bodyEn) data.bodyEn = newBodyEn;

    if (Object.keys(data).length > 0) {
      await prisma.article.update({ where: { id: a.id }, data });
      fixed++;
      console.log(`Fixed: ${a.titleTa.slice(0, 50)}`);
    }
  }

  console.log(`\nDone. Fixed ${fixed} / ${articles.length} articles.`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
