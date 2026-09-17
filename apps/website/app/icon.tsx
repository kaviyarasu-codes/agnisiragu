// app/icon.tsx
// Next.js App Router auto-detects this file and generates the site
// favicon (and injects the correct <link rel="icon"> tags) from it — no
// static .ico file needed. Renders just the feather/wing mark cropped out
// of the real logo (public/logo.png), not the full Tamil wordmark, since
// the wordmark is unreadable at favicon size.
import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agnisiragu.com';
const LOGO_URL = `${SITE_URL}/logo.png`;

// logo.png is 1310x604 (red mark on transparent bg). The wing occupies
// roughly x:[982,1310] y:[0,604] of that canvas — everything below is the
// scale/position math to crop just that region and center it in the icon.
const SRC_W = 1310;
const SRC_H = 604;
const CROP_X = 982;
const CROP_W = SRC_W - CROP_X; // 328
const CROP_H = SRC_H; // 604

export default function Icon() {
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
          borderRadius: 7,
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
