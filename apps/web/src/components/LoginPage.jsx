import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Button } from './ui/Button';
import { Logo, LogoMark } from './layout/Logo';
import { ThemeSwitcher } from './theme/ThemeSwitcher';
import { Topography } from './backgrounds/Topography';
import { useTheme } from '../hooks/useTheme';
import { loginUrl } from '../lib/auth';

const DARK_LINES = [1, 1, 1];
const LIGHT_LINES = [0.1, 0.1, 0.12];

// Codes sent back by the API as ?auth_error=... after a failed GitHub sign-in.
const AUTH_ERRORS = {
  unverified_email: 'Your GitHub account has no verified email address. Verify one in your GitHub email settings, then try again.',
  access_denied: 'GitHub sign-in was cancelled.',
  invalid_state: 'Your sign-in attempt expired. Please try again.',
  github_error: 'GitHub sign-in failed. Please try again.',
  server_error: 'Something went wrong on our side. Please try again.',
};

// Reads and strips ?auth_error from the URL so a refresh doesn't show it again.
const takeAuthError = () => {
  const url = new URL(window.location);
  const code = url.searchParams.get('auth_error');
  if (!code) return null;
  url.searchParams.delete('auth_error');
  window.history.replaceState(window.history.state, '', url);
  return AUTH_ERRORS[code] ?? AUTH_ERRORS.github_error;
};

const GitHubMark = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M12 .5C5.73.5.5 5.74.5 12.02c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.69 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56 4.56-1.53 7.85-5.83 7.85-10.91C23.5 5.74 18.27.5 12 .5Z" />
  </svg>
);

export function LoginPage({ error: sessionError }) {
  const [error] = useState(() => takeAuthError() ?? (sessionError ? AUTH_ERRORS[sessionError] : null));
  const [redirecting, setRedirecting] = useState(false);
  const { resolvedTheme } = useTheme();

  // Returning with the back button restores this page from bfcache mid-redirect; re-enable the button.
  useEffect(() => {
    const reset = (e) => e.persisted && setRedirecting(false);
    window.addEventListener('pageshow', reset);
    return () => window.removeEventListener('pageshow', reset);
  }, []);

  return (
    <div className="relative isolate flex min-h-dvh flex-col overflow-hidden bg-background">
      {/* Full-page contour lines; faded out behind the form so the content stays crisp. */}
      <div className="absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_55%_50%_at_50%_50%,transparent_20%,black_85%)]">
        <Topography color={resolvedTheme === 'dark' ? DARK_LINES : LIGHT_LINES} opacity={resolvedTheme === 'dark' ? 0.13 : 0.12} />
      </div>

      <header className="flex items-center px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6">
        <Logo />
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="w-full max-w-sm">
          <div className="mb-6 flex flex-col items-center text-center">
            <LogoMark className="mb-5 size-10 drop-shadow-sm" />
            <h1 className="text-2xl font-semibold tracking-tight">Welcome</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">Sign in with GitHub to inspect your webhooks.</p>
          </div>

          <div className="space-y-4 rounded-xl border bg-card/80 p-5 shadow-sm backdrop-blur-md sm:p-6">
            <Button asChild className="group w-full">
              <a href={loginUrl()} onClick={() => setRedirecting(true)} aria-disabled={redirecting} className={redirecting ? 'pointer-events-none opacity-70' : undefined}>
                {redirecting ? <Loader2 className="animate-spin" /> : <GitHubMark />}
                Continue with GitHub
              </a>
            </Button>
            {error && (
              <p role="alert" className="text-center text-xs text-destructive">
                {error}
              </p>
            )}
            <p className="text-center text-xs text-muted-foreground">Only accounts with a verified email address can sign in.</p>
            <p className="text-center text-[11px] leading-relaxed text-muted-foreground/70">
              By continuing, you agree to the{' '}
              <a href="/terms" className="underline decoration-dashed decoration-muted-foreground/50 underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground">
                Terms
              </a>{' '}
              and{' '}
              <a href="/privacy" className="underline decoration-dashed decoration-muted-foreground/50 underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground">
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </motion.div>
      </main>

      <footer className="flex flex-col-reverse items-center gap-3 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-between sm:px-6">
        <p className="text-center text-[11px] text-muted-foreground/70">
          Background:{' '}
          <a href="https://reactbits.dev/backgrounds/topography" target="_blank" rel="noreferrer" className="underline decoration-border underline-offset-2 transition-colors hover:text-foreground">
            Topography
          </a>{' '}
          by{' '}
          <a href="https://github.com/DavidHDev/react-bits" target="_blank" rel="noreferrer" className="underline decoration-border underline-offset-2 transition-colors hover:text-foreground">
            React Bits
          </a>
        </p>
        <ThemeSwitcher />
      </footer>
    </div>
  );
}
