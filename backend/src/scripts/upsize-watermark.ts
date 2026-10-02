// src/scripts/upsize-watermark.ts
//
// The brand watermark baked into thumbnails/media (see admin-panel's
// withBakedWatermark) is a Cloudinary transformation string embedded
// directly in the stored URL — so bumping it in code only affects new
// uploads going forward. Every article saved before a given bump still
// has the older transform baked into its thumbnailUrl / mediaUrls.
//
// This has gone through two generations so far:
//   1. original:        w_90,o_75                  (image) / w_130,o_75  (video)
//   2. first upsize:     w_130,o_90                 (image) / w_170,o_90  (video)
//   3. current (bordered): w_130,bo_4px_solid_black,r_6,o_95 (image) /
//                          w_170,bo_4px_solid_black,r_6,o_95 (video)
// (3) added a solid dark border + rounded corners on top of (2)'s
// size/opacity bump — the logo's own white card background still blended
// into light-colored regions of busy/flyer-style article images, so a
// border gives it a contrast edge against any background.
//
// This does a straight string substitution of whichever older transform
// segment is present for the current one, across thumbnailUrl and every
// entry in mediaUrls. Cloudinary renders the new transform the next time
// the (now-different) URL is requested — no re-upload needed.
//
// Safe to re-run: only touches rows that still contain an older transform
// string, so a second run is a no-op.
//   node dist/scripts/upsize-watermark.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const NEW_IMAGE = 'w_130,bo_4px_solid_black,r_6,o_95,fl_layer_apply';
const NEW_VIDEO = 'w_170,bo_4px_solid_black,r_6,o_95,fl_layer_apply';

const OLD_IMAGE_VARIANTS = ['w_90,o_75,fl_layer_apply', 'w_130,o_90,fl_layer_apply'];
const OLD_VIDEO_VARIANTS = ['w_130,o_75,fl_layer_apply', 'w_170,o_90,fl_layer_apply'];

function upsize(url: string): string {
  let out = url;
  for (const old of OLD_IMAGE_VARIANTS) out = out.replaceAll(old, NEW_IMAGE);
  for (const old of OLD_VIDEO_VARIANTS) out = out.replaceAll(old, NEW_VIDEO);
  return out;
}

function needsUpsize(url: string): boolean {
  return [...OLD_IMAGE_VARIANTS, ...OLD_VIDEO_VARIANTS].some((v) => url.includes(v));
}

async function main() {
  const articles = await prisma.article.findMany({
    select: { id: true, titleTa: true, thumbnailUrl: true, mediaUrls: true },
  });

  console.log(`Checking ${articles.length} articles for an older watermark transform.`);

  let fixed = 0;
  for (const a of articles) {
    const data: { thumbnailUrl?: string; mediaUrls?: string[] } = {};

    if (a.thumbnailUrl && needsUpsize(a.thumbnailUrl)) {
      data.thumbnailUrl = upsize(a.thumbnailUrl);
    }
    if (a.mediaUrls?.some(needsUpsize)) {
      data.mediaUrls = a.mediaUrls.map(upsize);
    }

    if (Object.keys(data).length > 0) {
      await prisma.article.update({ where: { id: a.id }, data });
      fixed++;
      console.log(`Upsized: ${a.titleTa.slice(0, 50)}`);
    }
  }

  console.log(`\nDone. Upsized ${fixed} / ${articles.length} articles.`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
