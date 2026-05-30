// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0A0A0A',
          900: '#111111',
          800: '#1A1A1A',
          700: '#242424',
          600: '#2E2E2E',
          500: '#3D3D3D',
        },
        red: {
          DEFAULT: '#CC1F2D',
          hover: '#B01825',
          light: '#FF3344',
          muted: '#F8E8E9',
        },
        surface: '#FFFFFF',
        page: '#F2F3F5',
        border: '#E4E6EA',
        'border-dark': '#2E2E2E',
        text: {
          primary: '#111111',
          secondary: '#5C6170',
          muted: '#9CA3AF',
          inverse: '#FFFFFF',
        },
        status: {
          green: '#16A34A',
          'green-bg': '#F0FDF4',
          yellow: '#CA8A04',
          'yellow-bg': '#FEFCE8',
          orange: '#EA580C',
          'orange-bg': '#FFF7ED',
          red: '#DC2626',
          'red-bg': '#FEF2F2',
          gray: '#6B7280',
          'gray-bg': '#F9FAFB',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '1rem' }],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.10), 0 2px 4px rgba(0,0,0,0.06)',
        modal: '0 20px 60px rgba(0,0,0,0.15)',
      },
    },
  },
  plugins: [],
};
