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
};

module.exports = nextConfig;
