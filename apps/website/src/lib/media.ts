// src/lib/media.ts
// thumbnailUrl can now be a video (uploaded via the admin panel's
// video-capable upload widget) as well as a static image. Detected by file
// extension, plus Cloudinary's own /video/upload/ path segment as a second
// signal for URLs that don't carry an extension. Mirrors
// apps/admin-panel/src/lib/media.ts.
const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm', '.m4v', '.avi', '.mkv', '.3gp', '.m3u8', '.ogg'];

export function isVideoUrl(url?: string | null): boolean {
  if (!url) return false;
  const clean = url.split('?')[0].split('#')[0].toLowerCase();
  return VIDEO_EXTENSIONS.some((ext) => clean.endsWith(ext)) || clean.includes('/video/upload/');
}

// Cloudinary can generate a static poster frame from a video URL by simply
// swapping the file extension to .jpg on the same /video/upload/ path — used
// as <video poster> so the player shows a real frame instead of a black box
// before the reader taps play. Mirrors apps/reader-app/src/lib/media.ts.
export function videoPosterUrl(url: string): string | undefined {
  if (!url.includes('/video/upload/')) return undefined;
  const clean = url.split('?')[0].split('#')[0];
  return clean.replace(/\.[a-zA-Z0-9]+$/, '.jpg');
}
