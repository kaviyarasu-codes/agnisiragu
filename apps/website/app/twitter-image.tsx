// app/twitter-image.tsx
// Explicit Twitter/X card image for the home page (mirrors
// opengraph-image.tsx). Next.js auto-detects and wires this into
// twitter:image — kept as its own file so the tag is unambiguous rather
// than relying on the OG image being reused as a fallback.
import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agnisiragu.com';
const LOGO_URL = `${SITE_URL}/logo.png`;

const SRC_W = 1310;
const SRC_H = 604;
const CROP_X = 982;
const CROP_W = SRC_W - CROP_X;
const CROP_H = SRC_H;
const BADGE = 160;

export default function TwitterImage() {
  const scale = BADGE / CROP_H;
  const scaledFullW = SRC_W * scale;
  const scaledCropW = CROP_W * scale;
  const left = -(CROP_X * scale) + (BADGE - scaledCropW) / 2;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0B0B0C',
        }}
      >
        <div
          style={{
            display: 'flex',
            width: BADGE,
            height: BADGE,
            overflow: 'hidden',
            position: 'relative',
            marginBottom: 30,
          }}
        >
          <img
            src={LOGO_URL}
            width={scaledFullW}
            height={BADGE}
            style={{ position: 'absolute', left, top: 0 }}
          />
        </div>
        <div style={{ display: 'flex', color: '#ffffff', fontSize: 64, fontWeight: 800 }}>அக்னிசிறகு</div>
        <div style={{ display: 'flex', color: 'rgba(255,255,255,0.6)', fontSize: 28, marginTop: 14 }}>
          Agnisiragu Tamil News
        </div>
      </div>
    ),
    { ...size },
  );
}
