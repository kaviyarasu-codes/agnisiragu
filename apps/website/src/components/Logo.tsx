// src/components/Logo.tsx
// The real Agnisiragu logo — same file used across reader-app/admin-panel
// (apps/reader-app/assets/logo.png, copied into apps/website/public/logo.png).
// `inverted` uses a CSS filter to render the red mark as white on dark
// backgrounds (footer, promo banner) without needing a second asset.

import Image from 'next/image';

export default function Logo({ className = '', inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <Image
      src="/logo.png"
      alt="அக்னிசிறகு"
      width={220}
      height={66}
      priority
      className={`w-auto object-contain ${inverted ? 'brightness-0 invert' : ''} ${className}`}
    />
  );
}
