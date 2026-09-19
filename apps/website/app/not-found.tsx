// app/not-found.tsx
// Next.js renders this automatically for any unmatched route (and whenever
// a page calls notFound()) inside the root layout — so Header/Footer/TopBar
// still render around it. Replaces the framework's generic default 404.

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <p className="font-tamil text-6xl font-extrabold text-brand-red">404</p>
      <h1 className="mt-4 font-tamil text-xl font-extrabold text-black">
        இந்தப் பக்கம் கிடைக்கவில்லை
      </h1>
      <p className="mt-2 text-sm text-black/60">
        Sorry, the page you're looking for doesn't exist or may have been removed.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-xl bg-brand-red px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
      >
        முகப்புக்கு செல்ல
      </Link>
    </div>
  );
}
