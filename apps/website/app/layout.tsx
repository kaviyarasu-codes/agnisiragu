import type { Metadata, Viewport } from 'next';
import { Noto_Sans_Tamil, Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DownloadAppPopup from '@/components/DownloadAppPopup';
import TopBar from '@/components/TopBar';
import BreakingTicker from '@/components/BreakingTicker';
import { getBreakingNews, getCategories, getSiteConfig } from '@/lib/api';

const notoTamil = Noto_Sans_Tamil({
  subsets: ['tamil'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-tamil',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agnisiragu.com';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#CC1F2D',
};

export async function generateMetadata(): Promise<Metadata> {
  const { site } = await getSiteConfig();
  const title = `${site.siteTitleTa} — ${site.siteTitleEn} Tamil News`;

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: title,
      template: `%s — ${site.siteTitleTa}`,
    },
    description: site.metaDescription,
    keywords: ['தமிழ் செய்திகள்', 'Tamil news', site.siteTitleTa, site.siteTitleEn, 'Agnisiragu', 'அக்னிசிறகு'],
    applicationName: site.siteTitleEn,
    alternates: { canonical: '/' },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
    openGraph: {
      title,
      description: site.metaDescription,
      siteName: `${site.siteTitleTa} — ${site.siteTitleEn}`,
      url: '/',
      locale: 'ta_IN',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: site.metaDescription,
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [{ data: breaking }, { data: categories }, { ads, site }] = await Promise.all([
    getBreakingNews().catch(() => ({ data: [] })),
    getCategories().catch(() => ({ data: [] })),
    getSiteConfig(),
  ]);

  const adsenseReady = ads.enabled && Boolean(ads.adsensePublisherId);

  // Site-wide NewsMediaOrganization structured data — helps Google surface
  // the right publisher name/logo in News/Discover results. Per-article
  // NewsArticle schema lives in app/article/[id]/page.tsx.
  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'NewsMediaOrganization',
    name: `${site.siteTitleTa} — ${site.siteTitleEn}`,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    sameAs: [site.socialFacebook, site.socialInstagram, site.socialTwitter, site.socialYoutube].filter(Boolean),
  };

  return (
    <html lang="ta" className={`${notoTamil.variable} ${inter.variable}`}>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
        {/* Google AdSense loader — only injected once ads are enabled and a
            publisher ID is saved in App Config → Website Ad Placements.
            Individual <AdSlot> components (in page.tsx / Sidebar.tsx) push
            the actual ad units once this script is on the page. */}
        {adsenseReady && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ads.adsensePublisherId}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
      </head>
      <body className="min-h-screen bg-[#f4f4f5] font-sans text-black antialiased">
        <TopBar />
        <Header />
        <BreakingTicker articles={breaking} />
        <main>{children}</main>
        <Footer categories={categories} site={site} />
        <DownloadAppPopup />
      </body>
    </html>
  );
}
