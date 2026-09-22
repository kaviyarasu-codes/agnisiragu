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
