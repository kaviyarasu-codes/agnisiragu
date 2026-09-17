// src/components/TopBar.tsx
// The thin utility strip above the main header that Tamil news portals
// (Dinamalar, Dailythanthi, Hindu Tamil) all carry — today's date plus a
// couple of quick links. Purely presentational, server-rendered.

const PLAY_STORE_URL =
  process.env.NEXT_PUBLIC_PLAY_STORE_URL ??
  'https://play.google.com/store/apps/details?id=com.agnisiragu.reader';

const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL ?? 'https://agnisiragu-admin-panel.vercel.app';

export default function TopBar() {
  // Full date for desktop; a short "17 செப்", "17 Sep"-style date for
  // mobile so the strip never has to wrap — wrapping here is what caused
  // the garbled multi-line stack on small screens.
  const todayFull = new Date().toLocaleDateString('ta-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const todayShort = new Date().toLocaleDateString('ta-IN', {
    day: 'numeric',
    month: 'short',
  });

  return (
    <div className="bg-brand-black text-white/70">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 overflow-x-auto px-3 py-1.5 text-[11px] sm:px-4 sm:text-xs">
        <span className="shrink-0 whitespace-nowrap">
          <span className="sm:hidden">{todayShort}</span>
          <span className="hidden sm:inline">{todayFull}</span>
        </span>
        <div className="flex shrink-0 items-center gap-2.5 whitespace-nowrap sm:gap-4">
          <a href="/about" className="hidden hover:text-white sm:inline">
            எங்களை பற்றி
          </a>
          <a href="/contact" className="hidden hover:text-white sm:inline">
            தொடர்பு
          </a>
          <a
            href={ADMIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden border-l border-white/20 pl-4 hover:text-white sm:inline"
          >
            Admin Login
          </a>
          <a
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-brand-red sm:border-l sm:border-white/20 sm:pl-4"
          >
            App பதிவிறக்கம்
          </a>
        </div>
      </div>
    </div>
  );
}
