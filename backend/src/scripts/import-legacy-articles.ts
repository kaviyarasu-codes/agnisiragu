// src/scripts/import-legacy-articles.ts
//
// One-off data-recovery script: imports articles recovered from the Wayback
// Machine for the pre-migration agnisiragu.in site (old CodeIgniter CMS,
// database lost — see backend/src/scripts/data/legacy-articles.jsonl for
// provenance notes). Run once via:
//   node dist/scripts/import-legacy-articles.js
// Safe to re-run: skips any legacy article whose exact titleTa already
// exists (tagged via the byline so re-runs don't duplicate).
import { PrismaClient } from '@prisma/client';
import { buildArticleSearchText } from '../common/utils/tamil-transliterate';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const LEGACY_BYLINE = 'அக்னிசிறகு காப்பகம்'; // "Agnisiragu Archive" — marks these as recovered, not authored by the current admin

// Old site category label -> new site category slug. Falls back to 'local'
// for anything unmapped (the old site's generic "News" bucket, mostly).
const CATEGORY_MAP: Record<string, string> = {
  'news': 'local',
  'politics': 'politics',
  'entertainment': 'entertainment',
  'temple': 'local',
  'sports': 'sports',
  'halth & tips': 'health',
  'health & tips': 'health',
  'cinema': 'cinema',
  'happiness': 'entertainment',
  'live tv': 'local',
  'business': 'business',
};

interface LegacyRecord {
  sourceUrl: string;
  archiveTimestamp: string;
  title: string;
  category: string | null;
  publishedAt: string;
  thumbnailUrl: string | null;
  bodyHtml: string;
}

// Strips the duplicate title/category-label/summary markup that the old
// template embeds at the top of .post-content — the new article page
// already renders title/category/excerpt from their own fields, so leaving
// these in would show the title twice.
function cleanBody(bodyHtml: string): { body: string; excerpt: string } {
  let body = bodyHtml;
  body = body.replace(/<p class="m-0">\s*<a[^>]*>\s*<label class="category-label"[\s\S]*?<\/label>\s*<\/a>\s*<\/p>/i, '');
  body = body.replace(/<h1 class="title">[\s\S]*?<\/h1>/i, '');
  // Dead "Click Here To See More" button(s) pointing at the old (now-unreachable) site, and the trailing SEO tag-link list — neither is useful on the new site.
  // The old template wraps each block in its own "Optional Url Button" comment, so strip those independently rather than assuming one comment maps to one div.
  body = body.replace(/<!--\s*Optional Url Button\s*-->\s*/gi, '');
  body = body.replace(/<div class="optional-url-cnt">[\s\S]*?<\/div>\s*/gi, '');
  body = body.replace(/<div class="post-tags">[\s\S]*?<\/div>\s*<\/div>/i, '</div>');

  let excerpt = '';
  const summaryMatch = body.match(/<div class="post-summary">([\s\S]*?)<\/div>/i);
  if (summaryMatch) {
    excerpt = summaryMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300);
    body = body.replace(/<div class="post-summary">[\s\S]*?<\/div>\s*/i, '');
  }
  return { body: body.trim(), excerpt };
}

async function main() {
  const dataPath = path.join(__dirname, '..', '..', 'src', 'scripts', 'data', 'legacy-articles.jsonl');
  const raw = fs.readFileSync(dataPath, 'utf-8');
  const records: LegacyRecord[] = raw
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => JSON.parse(l));

  console.log(`Loaded ${records.length} legacy articles to import.`);

  const categories = await prisma.category.findMany();
  const catBySlug = new Map(categories.map((c) => [c.slug, c]));
  const fallbackCategory = catBySlug.get('local');
  if (!fallbackCategory) throw new Error('No "local" category found — cannot import without a fallback category.');

  const admin = await prisma.admin.findFirst({ where: { adminRole: 'SUPER_ADMIN' }, orderBy: { createdAt: 'asc' } });
  if (!admin) throw new Error('No SUPER_ADMIN account found — cannot import without a valid adminId.');

  let created = 0, skipped = 0, failed = 0;

  for (const rec of records) {
    try {
      // Old site's junk/test bucket — not real published news, skip entirely.
      if ((rec.category ?? '').trim().toLowerCase() === 'trash') { skipped++; continue; }

      const existing = await prisma.article.findFirst({ where: { titleTa: rec.title, byline: LEGACY_BYLINE } });
      if (existing) { skipped++; continue; }

      const catKey = (rec.category ?? '').trim().toLowerCase();
      const category = catBySlug.get(CATEGORY_MAP[catKey] ?? '') ?? fallbackCategory;

      const { body, excerpt } = cleanBody(rec.bodyHtml);
      const publishedAt = new Date(rec.publishedAt);

      const searchText = buildArticleSearchText({
        titleTa: rec.title,
        bodyTa: body.replace(/<[^>]+>/g, ' '),
        titleEn: rec.title,
        excerpt,
        byline: LEGACY_BYLINE,
        categoryNameEn: category.nameEn,
      });

      await prisma.article.create({
        data: {
          titleTa: rec.title,
          titleEn: rec.title,
          bodyTa: body,
          bodyEn: body,
          excerpt: excerpt || undefined,
          thumbnailUrl: rec.thumbnailUrl ?? undefined,
          byline: LEGACY_BYLINE,
          categoryId: category.id,
          adminId: admin.id,
          status: 'PUBLISHED',
          isBreaking: false,
          cardStyle: 'STANDARD',
          publishedAt,
          createdAt: publishedAt,
          searchText,
        },
      });
      created++;
      console.log(`[${created + skipped + failed}/${records.length}] Imported: ${rec.title.slice(0, 50)} (${rec.publishedAt})`);
    } catch (e: any) {
      failed++;
      console.error(`FAILED: ${rec.title?.slice(0, 50)} — ${e.message}`);
    }
  }

  console.log(`\nDone. Created ${created}, skipped ${skipped} (already imported), failed ${failed}.`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
