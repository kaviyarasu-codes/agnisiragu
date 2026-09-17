// app/manifest.ts
// Next.js file convention — auto-serves this at /manifest.webmanifest and
// links it in <head>. Lets mobile visitors "Add to Home Screen" the site
// itself (separate from, and a lighter ask than, the Play Store app promo).
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'அக்னிசிறகு — Agnisiragu Tamil News',
    short_name: 'அக்னிசிறகு',
    description: 'Latest Tamil news — politics, cinema, sports, local and more.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#CC1F2D',
    icons: [
      { src: '/icon', sizes: '32x32', type: 'image/png' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  };
}
