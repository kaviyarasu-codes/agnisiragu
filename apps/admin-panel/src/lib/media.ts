// src/lib/media.ts
// Thumbnail/media URLs can now be a video (uploaded via the same Cloudinary
// widget as images — see ArticleFormPage.tsx) as well as a static image.
// Detected by file extension, plus Cloudinary's own /video/upload/ path
// segment as a second signal for URLs that don't carry an extension.
const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm', '.m4v', '.avi', '.mkv', '.3gp', '.m3u8', '.ogg'];

export function isVideoUrl(url?: string | null): boolean {
  if (!url) return false;
  const clean = url.split('?')[0].split('#')[0].toLowerCase();
  return VIDEO_EXTENSIONS.some((ext) => clean.endsWith(ext)) || clean.includes('/video/upload/');
}

// Bakes the brand watermark into a freshly-uploaded Cloudinary asset by
// inserting an overlay transformation directly into its delivery URL,
// rather than a separate server-side "re-upload from this URL" API call
// (the previous approach — see git history on media.service.ts's
// bakeWatermark). That approach hit Cloudinary's remote-fetch rate limit
// (HTTP 420) because fetching your own asset's URL back to re-upload it
// counts against Cloudinary's stricter "fetch" quota, and was also slow
// enough (transformation applied synchronously mid-upload) to blow past
// the admin panel's request timeout.
//
// A transformation embedded in the URL has none of those problems: this
// is Cloudinary's ordinary, unrestricted transformation delivery path —
// nothing is fetched or re-uploaded, the browser just requests a URL, and
// Cloudinary renders (and edge-caches) the watermarked pixels on first
// request. Since this becomes the actual thumbnailUrl/mediaUrls value
// stored on the article, every consumer (website, reader app, the raw API
// response, a direct right-click-save) gets the same watermarked bytes —
// no separate bake step or bake-success flag to go out of sync.
//
// Matches WATERMARK_PUBLIC_ID / the overlay params in
// backend/src/media/media.service.ts — keep both in sync if either changes.
const WATERMARK_PUBLIC_ID = 'agnisiragu:watermark-logo'; // '/' -> ':' for inline URL use

export function withBakedWatermark(secureUrl: string, resourceType: 'image' | 'video'): string {
  const width = resourceType === 'video' ? 130 : 90;
  const transform = `l_${WATERMARK_PUBLIC_ID},g_south_east,x_14,y_14,w_${width},o_75,fl_layer_apply`;
  if (!secureUrl.includes('/upload/')) return secureUrl; // unexpected shape — leave untouched
  return secureUrl.replace('/upload/', `/upload/${transform}/`);
}
