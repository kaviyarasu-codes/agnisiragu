// src/components/Footer.tsx
// Full multi-column footer — brand + blurb, category quick links, useful
// links, and an app-download block — the density real news portals
// (Dinamalar, Vikatan, The Hindu) carry at the bottom of every page.
// Social links + contact email come from App Config → Website Settings.

import Link from 'next/link';
import type { Category, WebsiteGeneralConfig } from '@/lib/api';
import Logo from './Logo';

const PLAY_STORE_URL =
  process.env.NEXT_PUBLIC_PLAY_STORE_URL ??
  'https://play.google.com/store/apps/details?id=com.agnisiragu.reader';

const SOCIAL_LABELS: { key: keyof WebsiteGeneralConfig; label: string }[] = [
  { key: 'socialFacebook', label: 'Facebook' },
  { key: 'socialInstagram', label: 'Instagram' },
  { key: 'socialTwitter', label: 'X' },
  { key: 'socialYoutube', label: 'YouTube' },
];

export default function Footer({
  categories = [],
  site,
}: {
  categories?: Category[];
  site?: WebsiteGeneralConfig;
}) {
  const socialLinks = SOCIAL_LABELS.filter((s) => site?.[s.key]);

  return (
    <footer className="mt-16 border-t-4 border-brand-red bg-brand-black text-white/70">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <Logo className="h-8" inverted />
            <p className="mt-3 text-sm leading-relaxed">Tamil news, managed with precision.</p>
            {socialLinks.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-3">
                {socialLinks.map((s) => (
                  <a
                    key={s.key}
                    href={site![s.key] as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-white/60 hover:text-white"
                  >
                    {s.label}
                  </a>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-white">பிரிவுகள்</h3>
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              {categories.slice(0, 6).map((c) => (
                <li key={c.id}>
                  <Link href={`/?category=${c.id}`} className="font-tamil hover:text-white">
                    {c.nameTa}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-white">இணைப்புகள்</h3>
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              <li>
                <Link href="/about" className="hover:text-white">எங்களை பற்றி</Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white">தொடர்பு</Link>
              </li>
              {site?.contactEmail && (
                <li>
                  <a href={`mailto:${site.contactEmail}`} className="hover:text-white">{site.contactEmail}</a>
                </li>
              )}
              <li>
                <a href={ process.env.NEXT_PUBLIC_ADMIN_URL ?? 'https://agnisiragu-admin-panel.vercel.app' } target="_blank" rel="noopener noreferrer" className="hover:text-white">
                  நிருபர்/நிர்வாகி Login
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-white">ஆப் பதிவிறக்கவும்</h3>
            <p className="mt-3 text-sm">Breaking alerts &amp; daily updates on your phone.</p>
            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block rounded-lg bg-brand-red px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Play Store
            </a>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/40 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} {site?.siteTitleEn ?? 'Agnisiragu'}. All rights reserved.</p>
          <p>agnisiragu.com · agnisiragu.in</p>
        </div>
      </div>
    </footer>
  );
}
