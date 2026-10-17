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

// Routes that get their own HTML file, so crawlers and link previews see the right title, description and canonical
// URL without running the app. Vercel serves them through `cleanUrls` (/docs -> docs.html); "/" keeps index.html as is.
const PAGES = [
  {
    file: 'docs.html',
    path: '/docs',
    title: 'API reference · Webhook Tester',
    description: 'REST and Server-Sent Events reference for Webhook Tester: create endpoints, read captured requests, pull stats and stream events, with cURL, JavaScript and Python examples.',
  },
  { file: 'terms.html', path: '/terms', title: 'Terms · Webhook Tester', description: 'The short, plain terms for using Webhook Tester, a free tool for capturing and inspecting HTTP requests.' },
  { file: 'privacy.html', path: '/privacy', title: 'Privacy · Webhook Tester', description: 'What Webhook Tester stores, why, for how long, and how to delete it.' },
  { file: 'app.html', path: '/app', title: 'Dashboard · Webhook Tester', description: 'Your webhook endpoints and the requests they captured.', noindex: true },
];
const INDEXED = ['/', ...PAGES.filter((p) => !p.noindex).map((p) => p.path)];

const escapeAttr = (s) => s.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');

// Replaces the content="" of a <meta>/<link> found by one of its attributes.
const setAttr = (html, selector, attr, value) => html.replace(new RegExp(`(<(?:meta|link)[^>]*${selector}[^>]*${attr}=")[^"]*(")`), `$1${escapeAttr(value)}$2`);

const pageHtml = (html, page, origin) => {
  let out = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeAttr(page.title)}</title>`);
  out = setAttr(out, 'name="description"', 'content', page.description);
  out = setAttr(out, 'rel="canonical"', 'href', `${origin}${page.path}`);
  out = setAttr(out, 'property="og:url"', 'content', `${origin}${page.path}`);
  for (const key of ['property="og:title"', 'name="twitter:title"']) out = setAttr(out, key, 'content', page.title);
  for (const key of ['property="og:description"', 'name="twitter:description"']) out = setAttr(out, key, 'content', page.description);
  // The structured data describes the product, which belongs to the home page only.
  out = out.replace(/\s*<!--[^>]*Structured data[^>]*-->\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/, '');
  if (page.noindex) out = out.replace('<meta name="application-name"', '<meta name="robots" content="noindex, nofollow" />\n    <meta name="application-name"');
  return out;
};

const seoFiles = (env) => ({
  name: 'seo-files',
  apply: 'build',
  // After Vite's HTML plugin, so index.html is already in the bundle with its hashed asset links.
  enforce: 'post',
  generateBundle(_, bundle) {
    const origin = siteUrl(env);
    const index = bundle['index.html'];
    if (index) {
      for (const page of PAGES) this.emitFile({ type: 'asset', fileName: page.file, source: pageHtml(String(index.source), page, origin) });
    }

    const robots = ['User-agent: *', 'Allow: /', 'Disallow: /app', 'Disallow: /api/', ...(origin ? ['', `Sitemap: ${origin}/sitemap.xml`] : [])].join('\n');
    this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `${robots}\n` });

    // A sitemap needs absolute URLs, so it's only written when the origin is known.
    if (origin) {
      const urls = INDEXED.map((p) => `  <url><loc>${origin}${p === '/' ? '/' : p}</loc></url>`).join('\n');
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n` });
    }
  },
});

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
      seoFiles(env),
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
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            if (/\/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'react';
            if (/\/node_modules\/(framer-motion|motion-dom|motion-utils)\//.test(id)) return 'motion';
            // Button's Slot is tiny and used everywhere; kept apart so it doesn't pull the dialogs in with it.
            if (/@radix-ui\/react-(slot|compose-refs)\//.test(id)) return 'slot';
            // Dialogs and menus are dashboard-only, so the landing page never downloads them.
            if (/\/node_modules\/(@radix-ui|@floating-ui|react-remove-scroll|react-remove-scroll-bar|react-style-singleton|use-callback-ref|use-sidecar|aria-hidden|get-nonce)\//.test(id)) return 'radix';
            return undefined;
          },
        },
      },
    },
  };
});
