'use client';

// src/components/DownloadAppPopup.tsx
// Nudges web visitors toward the Play Store app for the full experience
// (daily updates, push notifications, offline reading) — shows once per
// browser session, a few seconds after landing, centered over the page
// with a dimmed backdrop, and is easy to dismiss.

import { useEffect, useState } from 'react';
import Logo from './Logo';

const PLAY_STORE_URL =
  process.env.NEXT_PUBLIC_PLAY_STORE_URL ??
  'https://play.google.com/store/apps/details?id=com.agnisiragu.reader';

const SESSION_KEY = 'agnisiragu_app_popup_shown';
const SHOW_DELAY_MS = 4000;

export default function DownloadAppPopup() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let shown = false;
    try {
      shown = sessionStorage.getItem(SESSION_KEY) === '1';
    } catch {
      // sessionStorage unavailable (privacy mode etc.) — just show it once per page load
    }
    if (shown) return;

    const timer = setTimeout(() => {
      setVisible(true);
      try {
        sessionStorage.setItem(SESSION_KEY, '1');
      } catch {
        /* best-effort */
      }
    }, SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setVisible(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        aria-label="Close"
        onClick={() => setVisible(false)}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadein_0.2s_ease-out]"
      />

      {/* Centered card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Download the Agnisiragu app"
        className="relative w-full max-w-sm animate-[popin_0.25s_ease-out] overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <button
          onClick={() => setVisible(false)}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 rounded-full bg-black/5 p-1.5 text-black/50 hover:bg-black/10"
        >
          ✕
        </button>

        <div className="flex flex-col items-center px-6 pb-6 pt-10 text-center">
          <Logo className="h-9" />
          <p className="mt-5 font-tamil text-lg font-extrabold text-black">
            மேலும் செய்திகளுக்கு ஆப்-ஐ பதிவிறக்கவும்
          </p>
          <p className="mt-1.5 text-sm text-black/50">Daily updates &amp; breaking news alerts, right on your phone.</p>

          <a
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 w-full rounded-xl bg-brand-red py-3 text-center text-sm font-bold text-white transition hover:brightness-110"
          >
            Download on Play Store
          </a>
          <button
            onClick={() => setVisible(false)}
            className="mt-3 text-xs font-medium text-black/40 hover:text-black/60"
          >
            பின்னர் செய்கிறேன்
          </button>
        </div>
      </div>
    </div>
  );
}
