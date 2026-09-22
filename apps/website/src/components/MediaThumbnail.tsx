// src/components/MediaThumbnail.tsx
// Drop-in replacement for next/image's <Image fill /> pattern that also
// renders video thumbnailUrls (uploaded via the admin panel's video-capable
// upload widget). <video> has no `fill` prop equivalent, so this replicates
// it with absolute inset-0 h-full w-full to match every card's existing
// `relative` wrapper — same layout result as <Image fill>.
//
// Two video treatments, matching the reader app's own split between its
// main feed/article player and its smaller list contexts:
//   - player=false (default) — quiet muted auto-loop preview, cropped to
//     fill the card. Used for ArticleCard/ArticleRow/SecondaryStory.
//   - player=true — a real VideoPlayer (tap to play, mute/fullscreen
//     controls, not cropped). Used only for LeadStory's homepage hero and
//     the article detail page hero.
import Image from 'next/image';
import { isVideoUrl, videoPosterUrl } from '@/lib/media';
import VideoPlayer from './VideoPlayer';

interface Props {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  player?: boolean;
}

export default function MediaThumbnail({ src, alt, className, sizes, priority, player = false }: Props) {
  if (isVideoUrl(src)) {
    if (player) {
      return (
        <VideoPlayer
          src={src}
          poster={videoPosterUrl(src)}
          className={`absolute inset-0 h-full w-full ${className ?? ''}`}
        />
      );
    }
    return (
      <video
        src={src}
        muted
        loop
        playsInline
        autoPlay
        aria-label={alt}
        className={`absolute inset-0 h-full w-full ${className ?? ''}`}
      />
    );
  }
  return <Image src={src} alt={alt} fill priority={priority} sizes={sizes} className={className} />;
}
