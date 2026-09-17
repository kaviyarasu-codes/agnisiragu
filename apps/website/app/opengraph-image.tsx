// app/opengraph-image.tsx
// Default social-share preview image for the home page (article pages
// generate their own via generateMetadata in app/article/[id]/page.tsx).
// Auto-picked up by Next.js and wired into openGraph.images / twitter
// card metadata — no manual linking needed.
import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
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
            alignItems: 'center',
            justifyContent: 'center',
            width: 140,
            height: 140,
            borderRadius: 28,
            background: '#CC1F2D',
            color: '#ffffff',
            fontSize: 84,
            fontWeight: 800,
            marginBottom: 36,
          }}
        >
          அ
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
