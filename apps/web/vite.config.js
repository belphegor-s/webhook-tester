import process from 'node:process';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';

// Absolute site origin for Open Graph tags (crawlers need absolute image URLs).
// Uses VITE_SITE_URL when set, otherwise Vercel's production domain at build time.
const siteUrl = (env) => {
  const url = env.VITE_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '');
  return url.replace(/\/$/, '');
};

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'html-site-url',
        transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', siteUrl(env)),
      },
    ],
    // Mirrors the vercel.json rewrite so the session cookie stays first-party in development.
    server: {
      proxy: {
        '/api': { target: env.VITE_API_PROXY_TARGET || 'http://localhost:8787', changeOrigin: true },
      },
    },
    build: {
      modulePreload: { polyfill: false },
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom'],
            motion: ['framer-motion'],
            ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', 'sonner', 'ogl'],
          },
        },
      },
    },
  };
});
