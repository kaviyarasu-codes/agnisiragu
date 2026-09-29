// prisma/backfill-watermark.ts
//
// One-time backfill for articles uploaded before the "bake watermark into
// the Cloudinary URL" feature existed (see apps/admin-panel/src/lib/media.ts
// -> withBakedWatermark, and Article.thumbnailWatermarked in schema.prisma).
// Those legacy articles (thumbnailWatermarked: false) still point at clean,
// unwatermarked Cloudinary URLs — the logo shown on the website/app for them
// is only a DOM/View overlay, so a right-click "save image as" (website) or
// long-press/share-to-save (app) currently yields an unwatermarked file for
// every one of them.
//
// This rewrites thumbnailUrl and every mediaUrls entry in place using the
// exact same URL-transform as new uploads (no re-upload, no Cloudinary
// fetch quota involved — just inserting a transformation segment into the
// existing delivery URL), then flips thumbnailWatermarked to true so the
// website/app stop drawing the redundant overlay for these articles too.
//
// Safe to re-run — skips any URL that isn't a plain Cloudinary /upload/ URL
// and any URL that already contains the watermark transform segment.
//
//   npx ts-node prisma/backfill-watermark.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Keep in sync with apps/admin-panel/src/lib/media.ts and
// backend/src/media/media.service.ts's overlay params.
const WATERMARK_PUBLIC_ID = 'agnisiragu:watermark-logo';

const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm', '.m4v', '.avi', '.mkv', '.3gp', '.m3u8', '.ogg'];

function isVideoUrl(url: string): boolean {
  const clean = url.split('?')[0].split('#')[0].toLowerCase();
  return VIDEO_EXTENSIONS.some((ext) => clean.endsWith(ext)) || clean.includes('/video/upload/');
}

function withBakedWatermark(secureUrl: string): string {
  if (!secureUrl.includes('/upload/')) return secureUrl; // not a plain Cloudinary delivery URL — leave untouched
  if (secureUrl.includes(WATERMARK_PUBLIC_ID)) return secureUrl; // already baked
  const width = isVideoUrl(secureUrl) ? 130 : 90;
  const transform = `l_${WATERMARK_PUBLIC_ID},g_south_east,x_14,y_14,w_${width},o_75,fl_layer_apply`;
  return secureUrl.replace('/upload/', `/upload/${transform}/`);
}

async function main() {
  const articles = await prisma.article.findMany({
    where: { thumbnailWatermarked: false },
    select: { id: true, thumbnailUrl: true, mediaUrls: true },
  });

  console.log(`Found ${articles.length} legacy (unwatermarked) article(s).`);

  let updated = 0;
  let skipped = 0;

  for (const a of articles) {
    const newThumbnailUrl = a.thumbnailUrl ? withBakedWatermark(a.thumbnailUrl) : a.thumbnailUrl;
    const newMediaUrls = a.mediaUrls.map(withBakedWatermark);

    // Only worth touching if we actually have a thumbnail to bake — an
    // article with neither thumbnailUrl nor mediaUrls has nothing to
    // watermark, but we still flip the flag so it's not picked up again.
    const changedThumbnail = newThumbnailUrl !== a.thumbnailUrl;
    const changedMedia = newMediaUrls.some((u, i) => u !== a.mediaUrls[i]);

    await prisma.article.update({
      where: { id: a.id },
      data: {
        thumbnailUrl: newThumbnailUrl,
        mediaUrls: newMediaUrls,
        thumbnailWatermarked: true,
      },
    });

    if (changedThumbnail || changedMedia) updated += 1;
    else skipped += 1;
  }

  console.log(`✅ Done. Rewrote URLs for ${updated} article(s); ${skipped} had nothing to bake (flag still set).`);
}

main()
  .catch((err) => {
    console.error(err);
    throw err;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
