// src/components/MediaThumbnail.tsx
// Renders a thumbnail/media URL as <video> when it's a video (see
// lib/media.ts) and <img> otherwise — used everywhere thumbnailUrl or a
// mediaUrls[] entry is shown, now that the upload widgets accept video too.
import { isVideoUrl } from '../lib/media';

interface Props {
  url?: string | null;
  alt?: string;
  className?: string;
}

export default function MediaThumbnail({ url, alt = '', className }: Props) {
  if (!url) return null;
  if (isVideoUrl(url)) {
    return <video src={url} className={className} muted loop playsInline autoPlay />;
  }
  return <img src={url} alt={alt} className={className} />;
}
