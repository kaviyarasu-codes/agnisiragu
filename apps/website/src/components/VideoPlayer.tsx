// src/components/VideoPlayer.tsx
// Real, controllable video player — used only in the "big" spots (homepage
// lead story, article detail hero), matching the reader app's own big-spot
// player (apps/reader-app/src/components/feed/MediaCarousel.tsx's
// VideoTile): never autoplays, tap/click to play, a small persistent
// bottom-left control strip (mute, fullscreen — offset left so it never
// collides with the brand watermark chip fixed bottom-right), and the video
// is shown at object-contain (its own full frame, letterboxed if needed)
// instead of object-cover, so it's never cropped. Smaller card/list contexts
// (ArticleCard, ArticleRow, SecondaryStory) intentionally keep the quiet
// muted auto-loop preview instead — see MediaThumbnail's `player` prop.
'use client';

import { useRef, useState } from 'react';

function PlayIcon() {
  return (
    <svg width={26} height={26} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5.14v13.72c0 .8.87 1.29 1.57.87l11-6.86a1 1 0 0 0 0-1.72l-11-6.86A1 1 0 0 0 8 5.14Z" />
    </svg>
  );
}
function VolumeOnIcon() {
  return (
    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  );
}
function VolumeOffIcon() {
  return (
    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  );
}
function FullscreenIcon() {
  return (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

interface Props {
  src: string;
  poster?: string;
  className?: string;
}

type FullscreenVideo = HTMLVideoElement & { webkitEnterFullscreen?: () => void };

export default function VideoPlayer({ src, poster, className }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);

  // The homepage lead story wraps this whole component in a <Link> (it's a
  // card that navigates to the article on click) — stopPropagation +
  // preventDefault here so tapping the video to play/pause it doesn't also
  // navigate away before the reader gets to watch anything. The rest of the
  // card (title, category, etc.) is outside this component and still
  // navigates normally.
  const togglePlay = (e: React.MouseEvent | React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    if (v.paused || v.ended) v.play().catch(() => {});
    else v.pause();
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const goFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    const v = videoRef.current as FullscreenVideo | null;
    if (!v) return;
    if (v.requestFullscreen) v.requestFullscreen().catch(() => {});
    else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen();
  };

  return (
    <div className={`relative bg-black ${className ?? ''}`} onClick={togglePlay}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        playsInline
        className="h-full w-full object-contain"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />

      {!playing && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-black/55 text-white sm:h-16 sm:w-16">
            <PlayIcon />
          </span>
        </div>
      )}

      <div className="absolute bottom-2 left-2 z-10 flex gap-1.5">
        <button
          type="button"
          onClick={toggleMute}
          aria-label={muted ? 'Unmute' : 'Mute'}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white transition hover:bg-black/70"
        >
          {muted ? <VolumeOffIcon /> : <VolumeOnIcon />}
        </button>
        <button
          type="button"
          onClick={goFullscreen}
          aria-label="Fullscreen"
          className="flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white transition hover:bg-black/70"
        >
          <FullscreenIcon />
        </button>
      </div>
    </div>
  );
}
