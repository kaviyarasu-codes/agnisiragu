// src/components/AppPromoBanner.tsx
// Big, impossible-to-miss "Get the app" band placed in the middle of the
// homepage feed — distinct from the small corner popup (DownloadAppPopup)
// and the sidebar card. This one is a full-width hero-style CTA, the kind
// news portals use to push app installs mid-scroll.

import Logo from './Logo';

const PLAY_STORE_URL =
  process.env.NEXT_PUBLIC_PLAY_STORE_URL ??
  'https://play.google.com/store/apps/details?id=com.agnisiragu.reader';

export default function AppPromoBanner() {
  return (
    <div className="relative my-10 overflow-hidden rounded-2xl bg-brand-black px-6 py-10 text-center sm:px-12 sm:py-14">
      <div
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, #CC1F2D 0%, transparent 45%), radial-gradient(circle at 80% 80%, #CC1F2D 0%, transparent 45%)',
        }}
      />
      <div className="relative mx-auto flex max-w-xl flex-col items-center">
        <Logo className="h-10 sm:h-12" inverted />
        <h2 className="mt-6 font-tamil text-2xl font-extrabold text-white sm:text-3xl">
          ஆப்-ஐ இப்போது பதிவிறக்கவும்
        </h2>
        <p className="mt-2 text-base text-white/60 sm:text-lg">
          Breaking news alerts, your district, daily updates — all in one app.
        </p>
        <a
          href={PLAY_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 rounded-xl bg-brand-red px-8 py-3.5 text-base font-bold text-white shadow-lg transition hover:brightness-110 sm:text-lg"
        >
          Get the App — Play Store
        </a>
      </div>
    </div>
  );
}
