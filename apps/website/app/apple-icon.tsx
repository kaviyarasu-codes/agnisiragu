// app/apple-icon.tsx
// Same brand mark as icon.tsx, sized for iOS "Add to Home Screen".
// Auto-detected by Next.js — no manual <link rel="apple-touch-icon"> needed.
import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#CC1F2D',
          color: '#ffffff',
          fontSize: 96,
          fontWeight: 800,
        }}
      >
        அ
      </div>
    ),
    { ...size },
  );
}
