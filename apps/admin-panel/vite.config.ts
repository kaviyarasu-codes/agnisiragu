// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Mounted under agnisiragu.com/admin/* (and .in) via a Next.js rewrite in
  // apps/website — see next.config.js there. Every built asset reference
  // (script src, favicon href, etc.) gets this prefix so the browser, still
  // on the main domain, requests /admin/assets/... which the website's
  // rewrite forwards on. Keep in sync with main.tsx's BrowserRouter
  // basename and vercel.json's asset remap.
  base: '/admin/',
  server: {
    port: 5173,
  },
});
