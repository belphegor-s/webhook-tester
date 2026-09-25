import { createRoot } from 'react-dom/client';
import 'sonner/dist/styles.css';
import './index.css';
import App from './App.jsx';
import { ThemeProvider } from './components/theme/ThemeProvider';
import { ThemedToaster } from './components/theme/ThemedToaster';
import { LegalPage } from './components/legal/LegalPage';
import { legalPageFromPath } from './components/legal/content';

// /terms and /privacy are public and never touch the session.
const legal = legalPageFromPath(window.location.pathname);

createRoot(document.getElementById('root')).render(
  <ThemeProvider>
    {legal ? <LegalPage initialPath={legal.path} /> : <App />}
    <ThemedToaster />
  </ThemeProvider>,
);
