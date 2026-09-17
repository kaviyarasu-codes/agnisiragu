// app/icon.tsx
// Next.js App Router auto-detects this file and generates the site
// favicon (and injects the correct <link rel="icon"> tags) from it —
// no static .ico file needed. Renders the brand mark (red rounded
// square + the "அ" of அக்னிசிறகு) since the full wordmark logo is
// unreadable at favicon size.
import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
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
          borderRadius: 7,
          color: '#ffffff',
          fontSize: 22,
          fontWeight: 800,
        }}
      >
        அ
      </div>
    ),
    { ...size },
  );
}
