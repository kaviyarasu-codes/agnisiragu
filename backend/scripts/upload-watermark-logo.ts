// backend/scripts/upload-watermark-logo.ts
//
// One-time setup script. Uploads the brand logo (backend/assets/
// watermark-logo.png) to Cloudinary as a fixed, reusable overlay asset —
// media.service.ts's bakeWatermark() references this same public_id to
// stamp the logo onto every new article thumbnail/media upload, baked into
// the actual file (not a page overlay), so it survives right-click-save,
// a direct Cloudinary link, or a download.
//
// Run once per Cloudinary account, on the machine/container that has the
// real CLOUDINARY_* env vars (the VPS, via Docker Compose):
//   docker compose run --rm backend npm run upload:watermark
//
// Safe to re-run — it just overwrites the same watermark asset in place.
import { v2 as cloudinary } from 'cloudinary';
import * as path from 'path';

const WATERMARK_PUBLIC_ID = 'agnisiragu/watermark-logo';

async function main() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.error(
      'Missing CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET.\n' +
        'Run this inside the backend container (docker compose run --rm backend npm run upload:watermark) ' +
        'so the real env vars are present.',
    );
    process.exit(1);
  }

  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });

  const logoPath = path.join(__dirname, '..', 'assets', 'watermark-logo.png');
  console.log(`Uploading ${logoPath} to Cloudinary as "${WATERMARK_PUBLIC_ID}"...`);

  const result = await cloudinary.uploader.upload(logoPath, {
    public_id: WATERMARK_PUBLIC_ID,
    resource_type: 'image',
    overwrite: true,
    invalidate: true,
  });

  console.log(`\nDone. Watermark asset: ${result.public_id}`);
  console.log(`Preview: ${result.secure_url}`);
  console.log('\nNew article thumbnails/media uploaded from now on will have this baked in automatically.');
}

main().catch((err) => {
  console.error('Watermark logo upload failed:', err?.message ?? err);
  process.exit(1);
});
