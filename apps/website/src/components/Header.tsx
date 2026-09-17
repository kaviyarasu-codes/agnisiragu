// src/components/Header.tsx
// Site header — real logo on the left, reader account menu + a "Get App"
// Play Store CTA on the right. Admin/staff sign-in lives separately in the
// TopBar next to Contact — AccountMenu here is for readers (phone-OTP),
// same session used to gate posting comments.

import Link from 'next/link';
import Logo from './Logo';
import AccountMenu from './AccountMenu';

const PLAY_STORE_URL =
  process.env.NEXT_PUBLIC_PLAY_STORE_URL ??
  'https://play.google.com/store/apps/details?id=com.agnisiragu.reader';

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b-4 border-brand-red bg-white shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5">
        <Link href="/" className="flex items-center">
          <Logo className="h-9 sm:h-10" />
        </Link>

        <div className="flex items-center gap-3">
          <AccountMenu />
          <a
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-brand-red px-5 py-2 text-sm font-semibold text-white transition hover:brightness-110"
          >
            Get App
          </a>
        </div>
      </div>
    </header>
  );
}
