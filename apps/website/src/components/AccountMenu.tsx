'use client';

// src/components/AccountMenu.tsx
// Persistent login/account control for the header — previously the only
// way to log in on the website was reactively, from inside the comment
// box (CommentsSection -> LoginModal). This makes phone-OTP login a
// first-class, discoverable action, matching the reader-app's Profile tab.
// Reuses the same auth infra (lib/auth.ts, useWebsiteAuth, LoginModal) —
// nothing new on the backend, no new session model.

import { useEffect, useRef, useState } from 'react';
import { useWebsiteAuth } from '@/hooks/useWebsiteAuth';
import LoginModal from './LoginModal';

function UserIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </svg>
  );
}

export default function AccountMenu() {
  const { user, isAuthenticated, hydrated, logout } = useWebsiteAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [menuOpen]);

  // Avoid a hydration flash — reserve the space but render nothing
  // interactive until localStorage has been read on the client.
  if (!hydrated) return <div className="h-8 w-8" />;

  if (!isAuthenticated) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowLogin(true)}
          className="flex items-center gap-1.5 rounded-full border border-black/15 px-3.5 py-1.5 text-sm font-semibold text-black/80 transition hover:border-brand-red/40 hover:text-brand-red"
        >
          <UserIcon />
          <span className="font-tamil">உள்நுழை</span>
        </button>
        {showLogin && (
          <LoginModal onClose={() => setShowLogin(false)} onSuccess={() => setShowLogin(false)} />
        )}
      </>
    );
  }

  const label = user?.name?.trim() || user?.phone || 'பயனர்';

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full border border-black/15 px-3.5 py-1.5 text-sm font-semibold text-black/80 transition hover:border-brand-red/40"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-red/10 text-xs font-extrabold text-brand-red">
          {label[0]?.toUpperCase()}
        </span>
        <span className="font-tamil max-w-[7rem] truncate">{label}</span>
      </button>

      {menuOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-40 overflow-hidden rounded-xl border border-black/10 bg-white py-1 shadow-lg">
          <button
            type="button"
            onClick={() => {
              logout();
              setMenuOpen(false);
            }}
            className="font-tamil block w-full px-4 py-2 text-left text-sm text-black/70 hover:bg-black/5"
          >
            வெளியேறு
          </button>
        </div>
      )}
    </div>
  );
}
