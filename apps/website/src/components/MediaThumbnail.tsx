// src/components/MediaThumbnail.tsx
// Drop-in replacement for next/image's <Image fill /> pattern that also
// renders video thumbnailUrls (uploaded via the admin panel's video-capable
// upload widget). <video> has no `fill` prop equivalent, so this replicates
// it with absolute inset-0 h-full w-full to match every card's existing
// `relative` wrapper — same layout result as <Image fill>.
import Image from 'next/image';
import { isVideoUrl } from '@/lib/media';

interface Props {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}

export default function MediaThumbnail({ src, alt, className, sizes, priority }: Props) {
  if (isVideoUrl(src)) {
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
