import { createRoot } from 'react-dom/client';
import 'sonner/dist/styles.css';
import './index.css';
import App from './App.jsx';
import { ThemeProvider } from './components/theme/ThemeProvider';
import { ThemedToaster } from './components/theme/ThemedToaster';

createRoot(document.getElementById('root')).render(
  <ThemeProvider>
    <App />
    <ThemedToaster />
  </ThemeProvider>,
);
