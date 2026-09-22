// src/lib/media.ts
// Shared helpers for thumbnailUrl values that may be a video (uploaded via
// the admin panel's video-capable upload widget) as well as a static image.
// Mirrors apps/admin-panel/src/lib/media.ts and apps/website/src/lib/media.ts.
//
// Note: MediaCarousel.tsx has its own narrower isVideoUrl() (extension-only,
// no /video/upload/ fallback) used for the main feed card + article detail
// hero, where a live <VideoTile> player is rendered — left as-is since it
// already works and touching it isn't needed for this change. This file is
// for the smaller/list contexts below, where a live player would be
// inappropriate (autoplay/audio surprise, performance) and a static poster
// frame is used instead.
const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm', '.m4v', '.avi', '.mkv', '.3gp', '.m3u8', '.ogg'];

export function isVideoUrl(url?: string | null): boolean {
  if (!url) return false;
  const clean = url.split('?')[0].split('#')[0].toLowerCase();
  return VIDEO_EXTENSIONS.some((ext) => clean.endsWith(ext)) || clean.includes('/video/upload/');
}

// Cloudinary can generate a static poster frame from a video URL by simply
// swapping the file extension to .jpg on the same /video/upload/ path.
// Only works for Cloudinary-hosted video URLs (all current uploads go
// through Cloudinary) — for anything else this returns the URL unchanged.
export function videoPosterUrl(url: string): string {
  if (!url.includes('/video/upload/')) return url;
  const clean = url.split('?')[0].split('#')[0];
  return clean.replace(/\.[a-zA-Z0-9]+$/, '.jpg');
}

// Resolves whatever should actually be handed to an <Image> in a small/list
// context — the video's poster frame when it's a video, or the URL itself
// when it's already a static image.
export function posterOrImage(url?: string | null): string | undefined {
  if (!url) return undefined;
  return isVideoUrl(url) ? videoPosterUrl(url) : url;
}
