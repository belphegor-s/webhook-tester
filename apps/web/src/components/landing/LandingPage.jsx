import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, BookOpen } from 'lucide-react';
import { Container } from '../layout/Container';
import { Logo, LogoMark } from '../layout/Logo';
import { ThemeSwitcher } from '../theme/ThemeSwitcher';
import { SignalField } from './SignalField';
import { Inspector } from './Inspector';
import { ApiSection, Faq, Features, FinalCta, HowItWorks, Providers } from './Sections';
import { nextSample, seedSamples } from './samples';
import { fetchCurrentUser, loginUrl } from '../../lib/auth';
import { WEBHOOK_BASE } from '../../lib/config';
import { cn } from '../../lib/utils';

const ease = [0.16, 1, 0.3, 1];
const HOST = WEBHOOK_BASE.replace(/^https?:\/\//, '');
const FEED_SIZE = 6;
const SEED_TOTAL = 128;

const NAV = [
  { href: '#how', label: 'How it works' },
  { href: '#features', label: 'Features' },
  { href: '#api', label: 'API' },
  { href: '#faq', label: 'FAQ' },
];

// Signed-in visitors go straight to the dashboard; everyone else starts GitHub sign-in and lands there.
const useSignedIn = () => {
  const [signedIn, setSignedIn] = useState(null);
  useEffect(() => {
    let cancelled = false;
    fetchCurrentUser()
      .then((user) => !cancelled && setSignedIn(Boolean(user)))
      .catch(() => !cancelled && setSignedIn(false));
    return () => {
      cancelled = true;
    };
  }, []);
  return signedIn;
};

const LandingNav = ({ cta }) => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-40 border-b pt-[env(safe-area-inset-top)] transition-[background-color,border-color,backdrop-filter] duration-300',
        scrolled ? 'border-border bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60' : 'border-transparent',
      )}
    >
      <Container className="flex h-14 items-center justify-between gap-3">
        <a href="/" className="rounded-md p-0.5 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50" aria-label="Webhook Tester home">
          <Logo />
        </a>
        <nav aria-label="Sections" className="hidden items-center gap-0.5 md:flex">
          {NAV.map(({ href, label }) => (
            <a key={href} href={href} className="rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50">
              {label}
            </a>
          ))}
          <a href="/docs" className="rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50">
            Docs
          </a>
        </nav>
        <div className="flex items-center gap-1.5">
          <a
            href="/docs"
            aria-label="API docs"
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 md:hidden"
          >
            <BookOpen className="size-4" />
          </a>
          <a
            href={cta.href}
            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-primary px-3.5 text-sm font-medium text-primary-foreground shadow-xs transition-[background-color,opacity] outline-none hover:bg-primary/90 focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {cta.short}
          </a>
        </div>
      </Container>
    </header>
  );
};

// The endpoint the hero's packets fly into. It flashes in each arriving request's method colour.
const EndpointPill = ({ sinkRef, last, caught }) => (
  <div ref={sinkRef} className="relative inline-flex h-12 max-w-full items-center gap-3 rounded-full border bg-background/85 pr-4 pl-1.5 shadow-[0_8px_40px_-12px_rgb(0_0_0/0.25)] backdrop-blur-md">
    <AnimatePresence>
      {last && (
        <motion.span
          key={last.id}
          aria-hidden
          initial={{ opacity: 0.9, scale: 1 }}
          animate={{ opacity: 0, scale: 1.06 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          className="pointer-events-none absolute -inset-px rounded-full border-2"
          style={{ borderColor: `var(${last.colorVar})` }}
        />
      )}
    </AnimatePresence>
    <span className="flex h-9 w-[4.75rem] shrink-0 items-center justify-center gap-1.5 rounded-full border bg-subtle font-mono text-[11px] font-medium">
      <span className="size-1.5 rounded-full transition-colors duration-300" style={{ background: `var(${last ? last.colorVar : '--success'})` }} />
      <span className="w-[3.25ch] text-left">{last ? last.method : 'POST'}</span>
    </span>
    <span className="min-w-0 truncate font-mono text-[13px] sm:text-sm">
      <span className="hidden text-muted-foreground sm:inline">{HOST}</span>
      /webhook/<span className="text-muted-foreground">your-endpoint</span>
    </span>
    {/* Room for four digits, so the pill (and the packets aimed at it) never resize as the count grows. */}
    <span className="hidden min-w-[5.25rem] shrink-0 border-l pl-3 text-xs text-muted-foreground tabular-nums sm:inline" aria-live="off">
      {caught} caught
    </span>
  </div>
);

const Hero = ({ cta, feed, onArrive, selectedId, onSelect, total, last, caught }) => {
  const sinkRef = useRef(null);
  const quietRef = useRef(null);
  const pick = useCallback(() => nextSample(), []);

  return (
    <section className="relative isolate overflow-hidden pt-[calc(env(safe-area-inset-top)+7rem)] pb-16 sm:pt-[calc(env(safe-area-inset-top)+9rem)] sm:pb-24">
      <SignalField sinkRef={sinkRef} quietRef={quietRef} pick={pick} onArrive={onArrive} className="-z-10 [mask-image:linear-gradient(to_bottom,black_75%,transparent)]" />

      <Container className="flex flex-col items-center text-center">
        <div ref={quietRef} className="flex max-w-3xl flex-col items-center">
          <motion.a
            href="#features"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            className="group mb-7 inline-flex items-center gap-2 rounded-full border bg-background/70 py-1 pr-3 pl-1 text-xs text-muted-foreground backdrop-blur-md transition-colors outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <span className="rounded-full bg-foreground px-2 py-0.5 font-medium text-background">Free</span>
            Live over Server-Sent Events
            <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
          </motion.a>
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease, delay: 0.05 }}
            className="text-[2.6rem] leading-[1.04] font-semibold tracking-[-0.045em] text-balance sm:text-6xl lg:text-7xl"
          >
            Every webhook,
            <br />
            <span className="text-muted-foreground">caught live.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease, delay: 0.12 }}
            className="mt-6 max-w-xl text-base text-pretty text-muted-foreground sm:text-lg"
          >
            Create an endpoint in one click, point Stripe, GitHub or anything that speaks HTTP at it, and watch each request land with its headers, body and query string intact.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease, delay: 0.2 }}
          className="mt-9 flex w-full flex-col items-center justify-center gap-3 min-[420px]:w-auto min-[420px]:flex-row"
        >
          <a
            href={cta.href}
            className="group inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm transition-[background-color,transform] outline-none hover:bg-primary/90 focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-[0.98] min-[420px]:w-auto"
          >
            {cta.label}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </a>
          <a
            href="/docs"
            className="inline-flex h-11 w-full items-center justify-center rounded-full border bg-background/80 px-6 text-sm font-medium backdrop-blur-md transition-colors outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 min-[420px]:w-auto"
          >
            Read the API docs
          </a>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease, delay: 0.3 }} className="mt-16 flex max-w-full justify-center sm:mt-20">
          <EndpointPill sinkRef={sinkRef} last={last} caught={caught} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease, delay: 0.4 }} className="mt-10 w-full max-w-4xl text-left sm:mt-12">
          <Inspector requests={feed} total={total} selectedId={selectedId} onSelect={onSelect} />
        </motion.div>
      </Container>
    </section>
  );
};

const LandingFooter = () => (
  <footer className="border-t">
    <Container className="grid grid-cols-1 gap-10 py-12 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:gap-16">
      <div className="max-w-xs">
        <div className="flex items-center gap-2">
          <LogoMark className="size-5" />
          <span className="text-sm font-semibold tracking-tight">Webhook Tester</span>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">Capture, inspect and debug incoming HTTP requests, live.</p>
      </div>
      <nav aria-label="Product" className="text-sm">
        <p className="font-medium">Product</p>
        <ul className="mt-3 space-y-2 text-muted-foreground">
          {[...NAV.slice(0, 2), { href: '/docs', label: 'API reference' }, { href: '/app', label: 'Dashboard' }].map(({ href, label }) => (
            <li key={href}>
              <a href={href} className="transition-colors hover:text-foreground">
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <nav aria-label="Legal" className="text-sm">
        <p className="font-medium">Legal</p>
        <ul className="mt-3 space-y-2 text-muted-foreground">
          <li>
            <a href="/terms" className="transition-colors hover:text-foreground">
              Terms
            </a>
          </li>
          <li>
            <a href="/privacy" className="transition-colors hover:text-foreground">
              Privacy
            </a>
          </li>
        </ul>
      </nav>
    </Container>
    <Container>
      <div className="flex items-center justify-between gap-4 border-t py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-xs text-muted-foreground">
        <span>© {new Date().getFullYear()} Webhook Tester</span>
        <ThemeSwitcher layoutId="landing-theme-pill" />
      </div>
    </Container>
  </footer>
);

export function LandingPage() {
  const signedIn = useSignedIn();
  const cta = signedIn ? { href: '/app', label: 'Open dashboard', short: 'Dashboard' } : { href: loginUrl('/app'), label: 'Create a free endpoint', short: 'Get started' };

  const [feed, setFeed] = useState(() => seedSamples(4));
  const [caught, setCaught] = useState(0);
  const [last, setLast] = useState(null);
  // null follows the newest request; a click pins that row until it scrolls out of the feed.
  const [pinned, setPinned] = useState(null);

  const onArrive = useCallback((sample) => {
    const request = { ...sample, receivedAt: Date.now() };
    setFeed((prev) => [request, ...prev].slice(0, FEED_SIZE));
    setCaught((n) => n + 1);
    setLast(request);
  }, []);

  const selectedId = pinned !== null && feed.some((r) => r.id === pinned) ? pinned : feed[0]?.id;

  useEffect(() => {
    document.title = 'Webhook Tester · Capture & inspect webhooks live';
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const root = document.documentElement;
    root.style.scrollBehavior = 'smooth';
    return () => {
      root.style.scrollBehavior = '';
    };
  }, []);

  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-clip bg-background">
      <a href="#main" className="sr-only z-50 rounded-md bg-background px-3 py-2 text-sm focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:ring-[3px] focus:ring-ring/50">
        Skip to content
      </a>
      <LandingNav cta={cta} />
      <main id="main" className="flex-1">
        <Hero
          cta={cta}
          feed={feed}
          onArrive={onArrive}
          selectedId={selectedId}
          onSelect={(id) => setPinned((p) => (p === id ? null : id))}
          total={SEED_TOTAL + caught}
          last={last}
          caught={caught}
        />
        <Providers />
        <HowItWorks />
        <Features requests={feed} />
        <ApiSection />
        <Faq />
        <FinalCta href={cta.href} label={cta.label} />
      </main>
      <LandingFooter />
    </div>
  );
}
