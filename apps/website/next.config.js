/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Article thumbnails mostly come from Cloudinary, but some articles
    // carry externally-sourced image URLs (e.g. syndicated content), so a
    // fixed hostname allowlist keeps breaking on new sources. Content here
    // is always admin-authored (never user-submitted), so allowing any
    // HTTPS host is an acceptable tradeoff for this site.
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  // Mounts the admin panel (a separate Vite/React app + Vercel project) at
  // agnisiragu.com/admin/* and agnisiragu.in/admin/* instead of its own
  // vercel.app / admin.agnisiragu.com address. This is a server-side proxy
  // rewrite (Vercel/Next support rewriting to an external origin) — the
  // browser's URL bar stays on agnisiragu.com, it just transparently fetches
  // from the admin panel's deployment behind the scenes. Keep the
  // destination host in sync with wherever the admin-panel Vercel project's
  // domain actually is.
  async rewrites() {
    return [
      { source: '/admin', destination: 'https://admin.agnisiragu.com/admin' },
      { source: '/admin/:path*', destination: 'https://admin.agnisiragu.com/admin/:path*' },
    ];
  },
};

module.exports = nextConfig;
