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
// existing delivery URL), then flips thumbnailWatermarked to true ONLY for
// articles where the thumbnail is now actually protected (baked, already
// contained the watermark, or there's no thumbnailUrl at all to protect).
//
// An earlier version of this script set thumbnailWatermarked: true for
// EVERY legacy article regardless of whether thumbnailUrl was actually a
// bakeable Cloudinary /upload/ URL — for an article whose thumbnailUrl
// isn't Cloudinary-hosted (or is some other unrecognized shape), that left
// it with neither a baked watermark NOR the on-screen ImageWatermark
// overlay (which is gated by !thumbnailWatermarked), i.e. completely
// unprotected. This version checks every article (not just
// thumbnailWatermarked: false ones) so a re-run also repairs any article
// that got wrongly flagged by that earlier run.
//
// Safe to re-run.
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
  // Check every article, not just thumbnailWatermarked: false ones, so a
  // re-run also repairs any article an earlier buggy run mis-flagged.
  const articles = await prisma.article.findMany({
    select: { id: true, thumbnailUrl: true, mediaUrls: true, thumbnailWatermarked: true },
  });

  console.log(`Checking ${articles.length} article(s).`);

  let baked = 0;
  let repaired = 0;
  let untouched = 0;

  for (const a of articles) {
    const newThumbnailUrl = a.thumbnailUrl ? withBakedWatermark(a.thumbnailUrl) : a.thumbnailUrl;
    const newMediaUrls = a.mediaUrls.map(withBakedWatermark);

    const changedThumbnail = newThumbnailUrl !== a.thumbnailUrl;
    const changedMedia = newMediaUrls.some((u, i) => u !== a.mediaUrls[i]);

    // Actually protected once baked — either there's no thumbnail at all
    // (nothing to protect, overlay wouldn't render anyway), or the
    // thumbnail's URL (after the attempted bake above) does contain the
    // watermark transform. If it's some other URL shape that couldn't be
    // baked, this stays false so the fallback on-screen overlay keeps
    // showing instead of leaving the image unprotected either way.
    const isProtected = !newThumbnailUrl || newThumbnailUrl.includes(WATERMARK_PUBLIC_ID);

    const flagNeedsFix = a.thumbnailWatermarked !== isProtected;

    if (!changedThumbnail && !changedMedia && !flagNeedsFix) {
      untouched += 1;
      continue;
    }

    await prisma.article.update({
      where: { id: a.id },
      data: {
        thumbnailUrl: newThumbnailUrl,
        mediaUrls: newMediaUrls,
        thumbnailWatermarked: isProtected,
      },
    });

    if (changedThumbnail || changedMedia) baked += 1;
    else repaired += 1;
  }

  console.log(`✅ Done. Baked ${baked} article(s); repaired the flag on ${repaired} more; ${untouched} needed nothing.`);
}

main()
  .catch((err) => {
    console.error(err);
    throw err;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
