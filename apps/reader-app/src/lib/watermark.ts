// src/lib/watermark.ts
// True only when the image/video URL itself carries the baked Cloudinary
// watermark overlay (admin-panel's withBakedWatermark inserts
// `l_agnisiragu:watermark-logo,...` into the URL). Checking the URL — rather
// than trusting the article-level `thumbnailWatermarked` flag — matters
// because that flag only describes the THUMBNAIL: extra photos in a
// multi-image article, or articles saved with the flag set but an unbaked
// URL, were showing no logo at all in the app.
export function isWatermarkBaked(url?: string | null): boolean {
  return !!url && url.includes('watermark-logo');
}
