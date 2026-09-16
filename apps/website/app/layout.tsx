import type { Metadata } from 'next';
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

export async function generateMetadata(): Promise<Metadata> {
  const { site } = await getSiteConfig();
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: `${site.siteTitleTa} — ${site.siteTitleEn} Tamil News`,
      template: `%s — ${site.siteTitleTa}`,
    },
    description: site.metaDescription,
    openGraph: {
      siteName: `${site.siteTitleTa} — ${site.siteTitleEn}`,
      locale: 'ta_IN',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
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

  return (
    <html lang="ta" className={`${notoTamil.variable} ${inter.variable}`}>
      <head>
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
