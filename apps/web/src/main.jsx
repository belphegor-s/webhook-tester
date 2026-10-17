import { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import 'sonner/dist/styles.css';
import './index.css';
import { ThemeProvider } from './components/theme/ThemeProvider';
import { ThemedToaster } from './components/theme/ThemedToaster';
import { LegalPage } from './components/legal/LegalPage';
import { legalPageFromPath } from './components/legal/content';
import { LandingPage } from './components/landing/LandingPage';

// The dashboard and the docs are their own chunks, so the landing page ships only what it draws.
const App = lazy(() => import('./App.jsx'));
const DocsPage = lazy(() => import('./components/docs/DocsPage').then((m) => ({ default: m.DocsPage })));

// The dashboard used to live at "/". Links carrying its state (webhook URLs opened in a browser, OAuth errors,
// bookmarks) move to /app with their query intact.
const DASHBOARD_PARAMS = ['webhook_endpoint', 'view', 'auth_error', 'page', 'req_page'];
if (window.location.pathname === '/' && DASHBOARD_PARAMS.some((p) => new URLSearchParams(window.location.search).has(p))) {
  window.history.replaceState(window.history.state, '', `/app${window.location.search}${window.location.hash}`);
}

const path = window.location.pathname;
// /, /terms, /privacy and /docs are public and never require a session.
const legal = legalPageFromPath(path);
const docs = /^\/docs\/?$/.test(path);
const landing = path === '/';

const blank = <div className="min-h-dvh bg-background" />;

createRoot(document.getElementById('root')).render(
  <ThemeProvider>
    {landing ? (
      <LandingPage />
    ) : docs ? (
      <Suspense fallback={blank}>
        <DocsPage />
      </Suspense>
    ) : legal ? (
      <LegalPage initialPath={legal.path} />
    ) : (
      <Suspense fallback={blank}>
        <App />
      </Suspense>
    )}
    <ThemedToaster />
  </ThemeProvider>,
);
