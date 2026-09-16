// src/components/TopBar.tsx
// The thin utility strip above the main header that Tamil news portals
// (Dinamalar, Dailythanthi, Hindu Tamil) all carry — today's date plus a
// couple of quick links. Purely presentational, server-rendered.

const PLAY_STORE_URL =
  process.env.NEXT_PUBLIC_PLAY_STORE_URL ??
  'https://play.google.com/store/apps/details?id=com.agnisiragu.reader';

const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL ?? 'https://agnisiragu-admin-panel.vercel.app';

export default function TopBar() {
  const today = new Date().toLocaleDateString('ta-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="bg-brand-black text-white/70">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-1.5 text-xs">
        <span>{today}</span>
        <div className="flex items-center gap-4">
          <a href="/about" className="hover:text-white">
            எங்களை பற்றி
          </a>
          <a href="/contact" className="hover:text-white">
            தொடர்பு
          </a>
          <a
            href={ADMIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="border-l border-white/20 pl-4 hover:text-white"
          >
            Admin Login
          </a>
          <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-red">
            App பதிவிறக்கம்
          </a>
        </div>
      </div>
    </div>
  );
}
