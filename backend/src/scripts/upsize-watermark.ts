// src/scripts/upsize-watermark.ts
//
// The brand watermark baked into thumbnails/media (see admin-panel's
// withBakedWatermark) is a Cloudinary transformation string embedded
// directly in the stored URL — so bumping the size/opacity in code only
// affects new uploads going forward. Every article saved before that change
// still has the old, smaller/fainter "w_90,o_75" (image) / "w_130,o_75"
// (video) transform baked into its thumbnailUrl / mediaUrls, which is why
// the logo reads as hard to see on already-published articles.
//
// This does a straight string substitution of the old transform segment
// for the new one (w_130,o_90 / w_170,o_90) across thumbnailUrl and every
// entry in mediaUrls, for every article that has it. Cloudinary renders the
// new transform the next time the (now-different) URL is requested — no
// re-upload needed, same as the original bake.
//
// Safe to re-run: only touches rows that still contain the old transform
// string, so a second run is a no-op.
//   node dist/scripts/upsize-watermark.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const OLD_IMAGE = 'w_90,o_75,fl_layer_apply';
const NEW_IMAGE = 'w_130,o_90,fl_layer_apply';
const OLD_VIDEO = 'w_130,o_75,fl_layer_apply';
const NEW_VIDEO = 'w_170,o_90,fl_layer_apply';

function upsize(url: string): string {
  return url.replaceAll(OLD_IMAGE, NEW_IMAGE).replaceAll(OLD_VIDEO, NEW_VIDEO);
}

function needsUpsize(url: string): boolean {
  return url.includes(OLD_IMAGE) || url.includes(OLD_VIDEO);
}

async function main() {
  const articles = await prisma.article.findMany({
    select: { id: true, titleTa: true, thumbnailUrl: true, mediaUrls: true },
  });

  console.log(`Checking ${articles.length} articles for the old watermark size.`);

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
