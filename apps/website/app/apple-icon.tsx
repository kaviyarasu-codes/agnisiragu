// app/apple-icon.tsx
// Same wing-mark crop as icon.tsx, sized for iOS "Add to Home Screen".
// Auto-detected by Next.js — no manual <link rel="apple-touch-icon"> needed.
import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agnisiragu.com';
const LOGO_URL = `${SITE_URL}/logo.png`;

const SRC_W = 1310;
const SRC_H = 604;
const CROP_X = 982;
const CROP_W = SRC_W - CROP_X;
const CROP_H = SRC_H;

export default function AppleIcon() {
  const scale = size.height / CROP_H;
  const scaledFullW = SRC_W * scale;
  const scaledCropW = CROP_W * scale;
  const left = -(CROP_X * scale) + (size.width - scaledCropW) / 2;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: '#ffffff',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <img
          src={LOGO_URL}
          width={scaledFullW}
          height={size.height}
          style={{ position: 'absolute', left, top: 0 }}
        />
      </div>
    ),
    { ...size },
  );
}
