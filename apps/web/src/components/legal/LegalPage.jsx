import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '../layout/Logo';
import { ThemeSwitcher } from '../theme/ThemeSwitcher';
import { cn } from '../../lib/utils';
import { CONTACT_EMAIL, LEGAL_PAGES, LEGAL_UPDATED, legalPageFromPath } from './content';

const ease = [0.16, 1, 0.3, 1];

const ORDER = Object.keys(LEGAL_PAGES);

// Content slides in from the side of the tab being moved to.
const slide = {
  enter: (dir) => ({ opacity: 0, x: dir * 24 }),
  center: { opacity: 1, x: 0 },
  exit: (dir) => ({ opacity: 0, x: dir * -24 }),
};

const Tabs =({ current, onNavigate }) => (
  <nav aria-label="Legal" className="isolate inline-flex items-center gap-0.5 rounded-full border bg-background p-0.5">
    {Object.values(LEGAL_PAGES).map((page) => {
      const active = page.path === current.path;
      return (
        <a
          key={page.path}
          href={page.path}
          aria-current={active ? 'page' : undefined}
          onClick={(e) => {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
            e.preventDefault();
            onNavigate(page.path);
          }}
          className={cn(
            'relative rounded-full px-3 py-1 text-xs font-medium outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50',
            active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {active && <motion.span layoutId="legal-pill" className="absolute inset-0 -z-10 rounded-full bg-muted" transition={{ type: 'spring', bounce: 0.2, duration: 0.45 }} />}
          {page.label}
        </a>
      );
    })}
  </nav>
);

// Public, signed-out-friendly page for /terms and /privacy. Switching between the two stays client-side.
export function LegalPage({ initialPath }) {
  const [[path, dir], setNav] = useState([initialPath, 0]);
  const page = legalPageFromPath(path);
  const setPath = (next) => setNav(([prev]) => [next, Math.sign(ORDER.indexOf(next.replace(/\/+$/, '')) - ORDER.indexOf(prev.replace(/\/+$/, '')))]);

  useEffect(() => {
    document.title = `${page.label} · Webhook Tester`;
  }, [page.label]);

  useEffect(() => {
    const onPop = () => {
      if (legalPageFromPath(window.location.pathname)) setPath(window.location.pathname);
      else window.location.reload();
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = (next) => {
    if (next === path) return;
    window.history.pushState(null, '', next);
    setPath(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 w-full max-w-2xl items-center justify-between gap-3 px-4 sm:px-6">
          <a href="/" className="rounded-md p-0.5 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50" aria-label="Webhook Tester home">
            <Logo />
          </a>
          <a
            href="/"
            className="group inline-flex items-center gap-1.5 rounded-md text-xs text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
            Back to app
          </a>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 overflow-x-clip px-4 pt-12 pb-20 sm:px-6 sm:pt-16">
        <Tabs current={page} onNavigate={navigate} />

        <AnimatePresence mode="wait" initial={false} custom={dir}>
          <motion.article
            key={page.path}
            custom={dir}
            variants={slide}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease }}
          >
            <h1 className="mt-8 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{page.title}</h1>
            <p className="mt-3 font-mono text-[11px] tracking-wide text-muted-foreground uppercase">Last updated {LEGAL_UPDATED}</p>
            <p className="mt-8 text-[15px] leading-7 text-pretty text-muted-foreground">{page.intro}</p>

            <div className="mt-12 border-t">
              {page.sections.map((section, i) => (
                <section key={section.title} className="grid gap-x-8 gap-y-3 border-b py-8 sm:grid-cols-[3rem_1fr]">
                  <span aria-hidden className="pt-1 font-mono text-[11px] text-muted-foreground/60 tabular-nums">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h2 className="text-[15px] font-medium tracking-tight">{section.title}</h2>
                    <div className="mt-2.5 space-y-3 text-sm leading-6 text-muted-foreground [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-px [&_code]:font-mono [&_code]:text-[12px] [&_code]:text-foreground [&_strong]:font-medium [&_strong]:text-foreground">
                      {section.body}
                    </div>
                  </div>
                </section>
              ))}
            </div>

            <p className="mt-10 text-sm text-muted-foreground">
              Questions? Write to{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground">
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </motion.article>
        </AnimatePresence>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-4 px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-xs text-muted-foreground sm:px-6">
          <span>© {new Date().getFullYear()} Webhook Tester</span>
          <ThemeSwitcher layoutId="legal-theme-pill" />
        </div>
      </footer>
    </div>
  );
}
