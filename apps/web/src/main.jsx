import { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import 'sonner/dist/styles.css';
import './index.css';
import App from './App.jsx';
import { ThemeProvider } from './components/theme/ThemeProvider';
import { ThemedToaster } from './components/theme/ThemedToaster';
import { LegalPage } from './components/legal/LegalPage';
import { legalPageFromPath } from './components/legal/content';

const DocsPage = lazy(() => import('./components/docs/DocsPage').then((m) => ({ default: m.DocsPage })));

// /terms, /privacy and /docs are public and never touch the session.
const legal = legalPageFromPath(window.location.pathname);
const docs = /^\/docs\/?$/.test(window.location.pathname);

createRoot(document.getElementById('root')).render(
  <ThemeProvider>
    {docs ? (
      <Suspense fallback={<div className="min-h-dvh bg-background" />}>
        <DocsPage />
      </Suspense>
    ) : legal ? (
      <LegalPage initialPath={legal.path} />
    ) : (
      <App />
    )}
    <ThemedToaster />
  </ThemeProvider>,
);
