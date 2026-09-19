'use client';

// src/components/LoginModal.tsx
// Phone-OTP sign-in — same two backend endpoints the reader-app uses
// (/auth/send-otp, /auth/verify-otp; see apps/reader-app/src/screens/
// LoginScreen.tsx for the mobile equivalent of this exact flow). This is
// the website's first login UI; Google sign-in will be added as a second
// button here later without changing this component's phone flow.

import { useState } from 'react';
import { setSession } from '@/lib/auth';
import { fetchWithTimeout } from '@/lib/fetchWithTimeout';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.agnisiragu.com/api/v1';
const OTP_LENGTH = 6;

type Step = 'phone' | 'otp';

export default function LoginModal({ onClose, onSuccess }: { onClose: () => void; onSuccess?: () => void }) {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function sendOtp() {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length !== 10) {
      setError('சரியான 10 இலக்க எண் உள்ளிடவும்');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetchWithTimeout(`${API_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `+91${cleaned}` }),
      });
      if (!res.ok) throw new Error();
      setStep('otp');
    } catch {
      setError('OTP அனுப்ப முடியவில்லை. மீண்டும் முயற்சிக்கவும்.');
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    if (otp.length !== OTP_LENGTH) {
      setError('OTP முழுமையாக உள்ளிடவும்');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const cleaned = phone.replace(/\D/g, '');
      const res = await fetchWithTimeout(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `+91${cleaned}`, otp }),
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      const { accessToken, refreshToken, user } = json.data;
      setSession(accessToken, refreshToken, user);
      onSuccess?.();
      onClose();
    } catch {
      setError('தவறான OTP');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="உள்நுழைய"
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-tamil text-lg font-extrabold text-black">உள்நுழைய</h2>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 text-black/40 hover:bg-black/5" aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {step === 'phone' ? (
          <>
            <p className="font-tamil text-sm text-black/60">உங்கள் தொலைபேசி எண்ணை உள்ளிடவும்</p>
            <div className="mt-3 flex overflow-hidden rounded-xl border border-black/15">
              <span className="flex items-center border-r border-black/15 bg-black/[0.03] px-3 text-sm font-semibold text-black/70">+91</span>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="10 இலக்க எண்"
                aria-label="தொலைபேசி எண்"
                className="flex-1 px-3 py-2.5 text-sm outline-none"
                onKeyDown={(e) => e.key === 'Enter' && sendOtp()}
                autoFocus
              />
            </div>
            {error && <p className="mt-2 text-xs text-brand-red">{error}</p>}
            <button
              type="button"
              onClick={sendOtp}
              disabled={loading}
              className="mt-4 w-full rounded-xl bg-brand-red py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
            >
              {loading ? 'அனுப்புகிறது…' : 'OTP அனுப்பு'}
            </button>
          </>
        ) : (
          <>
            <p className="font-tamil text-sm text-black/60">+91 {phone} க்கு அனுப்பப்பட்ட 6 இலக்க குறியீடு</p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={OTP_LENGTH}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="••••••"
              aria-label="OTP குறியீடு"
              className="mt-3 w-full rounded-xl border border-black/15 px-3 py-2.5 text-center text-lg tracking-[0.5em] outline-none"
              onKeyDown={(e) => e.key === 'Enter' && verifyOtp()}
              autoFocus
            />
            {error && <p className="mt-2 text-xs text-brand-red">{error}</p>}
            <button
              type="button"
              onClick={verifyOtp}
              disabled={loading}
              className="mt-4 w-full rounded-xl bg-brand-red py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
            >
              {loading ? 'சரிபார்க்கிறது…' : 'சரிபார்'}
            </button>
            <button type="button" onClick={() => { setStep('phone'); setOtp(''); setError(''); }} className="mt-3 w-full text-center text-xs font-semibold text-brand-red">
              எண்ணை மாற்ற
            </button>
          </>
        )}
      </div>
    </div>
  );
}
