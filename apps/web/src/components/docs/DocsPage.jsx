import { Fragment, lazy, Suspense, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowUpRight, KeyRound, Lock, Terminal } from 'lucide-react';
import { Logo } from '../layout/Logo';
import { ThemeSwitcher } from '../theme/ThemeSwitcher';
import { Badge } from '../ui/Badge';
import { CopyButton } from '../ui/CopyButton';
import { cn } from '../../lib/utils';
import { MethodBadge } from './MethodBadge';
import { API_BASE, ENDPOINTS, ERRORS, GROUPS, KEY_ENV, LANGUAGES, METHOD_TEXT, responseText, snippet } from './reference';

const CodeBlock = lazy(() => import('../ui/CodeBlock').then((m) => ({ default: m.CodeBlock })));


const LANG_STORAGE = 'docs-lang';

const GUIDES = [
  { id: 'introduction', title: 'Introduction' },
  { id: 'authentication', title: 'Authentication' },
  { id: 'conventions', title: 'Conventions' },
  { id: 'errors', title: 'Errors' },
];

const codeStyle = { padding: '0.875rem 1rem', maxHeight: '26rem' };

const readLang = () => {
  try {
    const saved = localStorage.getItem(LANG_STORAGE);
    return LANGUAGES.some((l) => l.id === saved) ? saved : 'curl';
  } catch {
    return 'curl';
  }
};

// Renders `backtick` spans as inline code.
const Rich = ({ children }) =>
  children.split(/(`[^`]+`)/g).map((part, i) =>
    part.startsWith('`') && part.endsWith('`') ? (
      <code key={i} className="rounded bg-muted px-1 py-px font-mono text-[0.85em] break-words text-foreground">
        {part.slice(1, -1)}
      </code>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );

// Path with {placeholders} picked out.
const PathText = ({ path, className }) => (
  <span className={cn('font-mono break-all', className)}>
    {path.split(/(\{[^}]+\})/g).map((part, i) =>
      part.startsWith('{') ? (
        <span key={i} className="text-info">
          {part}
        </span>
      ) : (
        <Fragment key={i}>{part}</Fragment>
      ),
    )}
  </span>
);

const Code = ({ code, language }) => (
  <Suspense fallback={<pre className="px-4 py-3.5 font-mono text-xs leading-relaxed [overflow-wrap:anywhere] whitespace-pre-wrap text-muted-foreground">{code}</pre>}>
    <CodeBlock code={code} language={language} style={codeStyle} />
  </Suspense>
);

const LangTabs = ({ lang, onChange, id }) => (
  <div role="tablist" aria-label="Language" className="flex min-w-0 overflow-x-auto [scrollbar-width:none]">
    {LANGUAGES.map((l) => (
      <button
        key={l.id}
        type="button"
        role="tab"
        aria-selected={lang === l.id}
        onClick={() => onChange(l.id)}
        className={cn(
          'relative px-2.5 py-2.5 text-xs font-medium whitespace-nowrap transition-colors outline-none focus-visible:text-foreground',
          lang === l.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
        )}
      >
        {l.label}
        {lang === l.id && <motion.span layoutId={`lang-${id}`} className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-foreground" />}
      </button>
    ))}
  </div>
);

const Panel = ({ header, children, className }) => (
  <div className={cn('min-w-0 overflow-hidden rounded-xl border bg-subtle', className)}>
    <div className="flex min-h-10 items-center justify-between gap-2 border-b bg-background/60 pr-1.5 pl-1.5">{header}</div>
    {children}
  </div>
);

const RequestSample = ({ endpoint, lang, onLang }) => {
  const language = LANGUAGES.find((l) => l.id === lang);
  const code = snippet(lang, endpoint.example);
  return (
    <Panel
      header={
        <>
          <LangTabs lang={lang} onChange={onLang} id={endpoint.id} />
          <CopyButton value={code} label="Copy request" />
        </>
      }
    >
      <Code code={code} language={language.grammar} />
    </Panel>
  );
};

const ResponseSample = ({ response }) => {
  const text = responseText(response);
  return (
    <Panel
      header={
        <>
          <span className="flex min-w-0 items-center gap-2 pl-1.5 text-xs font-medium">
            Response
            <Badge variant={response.status < 300 ? 'success' : 'error'} className="font-mono">
              {response.status}
            </Badge>
            <span className="truncate font-mono text-[11px] font-normal text-muted-foreground">{response.contentType ?? 'application/json'}</span>
          </span>
          <CopyButton value={text} label="Copy response" />
        </>
      }
    >
      {response.text ? (
        <pre className="px-4 py-3.5 font-mono text-xs leading-relaxed [overflow-wrap:anywhere] whitespace-pre-wrap text-muted-foreground">{text}</pre>
      ) : (
        <Code code={text} language="json" />
      )}
    </Panel>
  );
};

const Heading = ({ id, children, className }) => (
  <h2 className={cn('group scroll-mt-28 text-xl font-semibold tracking-tight sm:text-2xl lg:scroll-mt-20', className)} id={id}>
    <a href={`#${id}`} className="outline-none focus-visible:underline">
      {children}
    </a>
  </h2>
);

const SubHeading = ({ children }) => <h4 className="mb-2 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">{children}</h4>;

const ParamList = ({ params }) => (
  <dl className="divide-y rounded-xl border">
    {params.map((p) => (
      <div key={`${p.in}-${p.name}`} className="px-4 py-3">
        <dt className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-mono text-[13px] font-medium break-all">{p.name}</span>
          <span className="font-mono text-[11px] text-muted-foreground">{p.type}</span>
          <Badge variant="outline" className="font-normal">
            {p.in}
          </Badge>
          {p.required && <span className="text-[11px] font-medium text-warning">required</span>}
        </dt>
        <dd className="mt-1 text-[13px] leading-5 text-muted-foreground">
          <Rich>{p.desc}</Rich>
        </dd>
      </div>
    ))}
  </dl>
);

const EventList = ({ events }) => (
  <dl className="divide-y rounded-xl border">
    {events.map((e) => (
      <div key={e.name} className="grid gap-1 px-4 py-3 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-3">
        <dt className="font-mono text-[13px] font-medium">{e.name}</dt>
        <dd className="text-[13px] leading-5 text-muted-foreground">
          <Rich>{e.desc}</Rich>
        </dd>
      </div>
    ))}
  </dl>
);

const StatusList = ({ items }) => (
  <dl className="divide-y rounded-xl border">
    {items.map((e) => (
      <div key={e.status} className="flex items-start gap-3 px-4 py-3">
        <dt>
          <Badge variant="error" className="font-mono">
            {e.status}
          </Badge>
        </dt>
        <dd className="text-[13px] leading-5 text-muted-foreground">
          {e.title && <span className="font-medium text-foreground">{e.title}. </span>}
          <Rich>{e.desc}</Rich>
        </dd>
      </div>
    ))}
  </dl>
);

const EndpointSection = ({ endpoint, lang, onLang }) => (
  <section id={endpoint.id} aria-labelledby={`${endpoint.id}-title`} className="scroll-mt-28 border-t py-10 first:border-t-0 first:pt-2 lg:scroll-mt-20">
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] xl:gap-10">
      <div className="min-w-0 space-y-6">
        <div>
          <h3 id={`${endpoint.id}-title`} className="text-base font-semibold tracking-tight sm:text-lg">
            {endpoint.title}
          </h3>
          <div className="mt-3 flex min-w-0 items-start gap-2.5 rounded-lg border bg-background px-3 py-2.5">
            <MethodBadge method={endpoint.method} className="mt-px min-w-12" />
            <PathText path={endpoint.path} className="min-w-0 flex-1 text-[13px] leading-5" />
            {endpoint.public ? (
              <span className="hidden shrink-0 items-center gap-1 text-[11px] text-muted-foreground sm:inline-flex">
                <Terminal className="size-3" /> Public
              </span>
            ) : (
              <span className="hidden shrink-0 items-center gap-1 text-[11px] text-muted-foreground sm:inline-flex">
                <Lock className="size-3" /> API key
              </span>
            )}
          </div>
          <p className="mt-4 text-sm leading-6 text-pretty text-muted-foreground">
            <Rich>{endpoint.summary}</Rich>
          </p>
        </div>

        {endpoint.params && (
          <div>
            <SubHeading>Parameters</SubHeading>
            <ParamList params={endpoint.params} />
          </div>
        )}
        {endpoint.events && (
          <div>
            <SubHeading>Events</SubHeading>
            <EventList events={endpoint.events} />
          </div>
        )}
        {endpoint.errors && (
          <div>
            <SubHeading>Errors</SubHeading>
            <StatusList items={endpoint.errors} />
          </div>
        )}
      </div>

      <div className="min-w-0 space-y-3 xl:sticky xl:top-20 xl:self-start">
        <RequestSample endpoint={endpoint} lang={lang} onLang={onLang} />
        <ResponseSample response={endpoint.response} />
      </div>
    </div>
  </section>
);

const Callout = ({ icon: Icon, children }) => (
  <div className="flex gap-3 rounded-xl border bg-subtle px-4 py-3.5 text-[13px] leading-6 text-muted-foreground">
    <Icon className="mt-1 size-4 shrink-0 text-foreground" />
    <div className="min-w-0">{children}</div>
  </div>
);

const Prose = ({ children }) => <div className="space-y-4 text-sm leading-6 text-pretty text-muted-foreground">{children}</div>;

// Sidebar entries in page order, used for the active-section highlight.
const NAV = [
  { title: 'Getting started', items: GUIDES.map((g) => ({ id: g.id, label: g.title })) },
  ...GROUPS.map((g) => ({
    id: g.id,
    title: g.title,
    items: ENDPOINTS.filter((e) => e.group === g.id).map((e) => ({ id: e.id, label: e.title, method: e.method })),
  })),
];
const NAV_IDS = NAV.flatMap((section) => [section.id, ...section.items.map((i) => i.id)].filter(Boolean));
const MOBILE_NAV = [...GUIDES, ...GROUPS];
const groupOf = (id) => ENDPOINTS.find((e) => e.id === id)?.group ?? id;

const useActiveSection = () => {
  const [active, setActive] = useState(NAV_IDS[0]);
  useEffect(() => {
    const visible = new Map();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.set(entry.target.id, entry.boundingClientRect.top);
          else visible.delete(entry.target.id);
        }
        if (visible.size) setActive(NAV_IDS.find((id) => visible.has(id)));
      },
      { rootMargin: '-96px 0px -65% 0px' },
    );
    NAV_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);
  return active;
};

const Sidebar = ({ active }) => (
  <nav aria-label="API reference" className="sticky top-20 max-h-[calc(100dvh-6rem)] overflow-y-auto pr-2 pb-10 lg:block">
    {NAV.map((section) => (
      <div key={section.title} className="mb-6">
        <p className="mb-1.5 px-2 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
          {section.id ? (
            <a href={`#${section.id}`} className="transition-colors hover:text-foreground">
              {section.title}
            </a>
          ) : (
            section.title
          )}
        </p>
        <ul className="space-y-px">
          {section.items.map((item) => {
            const on = active === item.id;
            return (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  aria-current={on ? 'location' : undefined}
                  className={cn(
                    'relative flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50',
                    on ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {on && <motion.span layoutId="docs-nav" className="absolute inset-0 -z-10 rounded-md bg-muted" transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }} />}
                  {item.method && <span className={cn('w-11 shrink-0 font-mono text-[10px] font-medium', METHOD_TEXT[item.method] ?? 'text-muted-foreground')}>{item.method}</span>}
                  <span className="truncate">{item.label}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    ))}
  </nav>
);

// Horizontal section switcher for narrow screens; keeps the active chip in view without scrolling the page.
const MobileNav = ({ active }) => {
  const ref = useRef(null);
  const current = groupOf(active);

  useEffect(() => {
    const bar = ref.current;
    const chip = bar?.querySelector(`[data-id="${current}"]`);
    if (chip) bar.scrollTo({ left: chip.offsetLeft - bar.clientWidth / 2 + chip.clientWidth / 2, behavior: 'smooth' });
  }, [current]);

  return (
    <div className="sticky top-14 z-30 border-b bg-background/80 backdrop-blur-xl lg:hidden">
      <nav ref={ref} aria-label="API reference sections" className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-2 [scrollbar-width:none] sm:px-6">
        {MOBILE_NAV.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            data-id={item.id}
            className={cn(
              'relative isolate shrink-0 rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
              current === item.id ? 'text-foreground' : 'text-muted-foreground',
            )}
          >
            {current === item.id && <motion.span layoutId="docs-chip" className="absolute inset-0 -z-10 rounded-full bg-muted" transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }} />}
            {item.title}
          </a>
        ))}
      </nav>
    </div>
  );
};

// Public API reference at /docs. Everything is generated from ./reference.js.
export function DocsPage() {
  const [lang, setLang] = useState(readLang);
  const active = useActiveSection();

  const changeLang = (next) => {
    setLang(next);
    try {
      localStorage.setItem(LANG_STORAGE, next);
    } catch {
      // Storage blocked: the choice just won't persist.
    }
  };

  useEffect(() => {
    document.title = 'API reference · Webhook Tester';
  }, []);

  const quickstart = `export ${KEY_ENV}="whk_…"\n\ncurl ${API_BASE}/api/auth/me \\\n  -H "x-api-key: $${KEY_ENV}"`;

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <a href="/" className="rounded-md p-0.5 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50" aria-label="Webhook Tester home">
              <Logo textClassName="hidden min-[400px]:inline" />
            </a>
            <span className="h-4 w-px bg-border" aria-hidden />
            <span className="text-sm font-medium text-muted-foreground">API</span>
          </div>
          <a
            href="/"
            className="group inline-flex items-center gap-1.5 rounded-md text-xs text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
            Back to app
          </a>
        </div>
      </header>

      <MobileNav active={active} />

      <div className="mx-auto grid w-full max-w-6xl flex-1 gap-10 px-4 sm:px-6 lg:grid-cols-[13.5rem_minmax(0,1fr)] lg:gap-12">
        <aside className="hidden pt-12 lg:block">
          <Sidebar active={active} />
        </aside>

        <main className="min-w-0 pt-10 pb-24 sm:pt-14">
          <section id="introduction" className="scroll-mt-28 lg:scroll-mt-20">
            <p className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">API reference</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">Build on Webhook Tester</h1>
            <p className="mt-4 max-w-2xl text-[15px] leading-7 text-pretty text-muted-foreground">
              A small JSON API for everything the dashboard does with your webhooks. Create endpoints from CI, read captured requests in tests, or stream them into your own tools.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="min-w-0 rounded-xl border bg-subtle p-4">
                <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">Base URL</p>
                <div className="mt-2 flex items-center gap-1">
                  <code className="min-w-0 flex-1 truncate font-mono text-sm" title={API_BASE}>
                    {API_BASE}
                  </code>
                  <CopyButton value={API_BASE} label="Copy base URL" className="size-7" />
                </div>
              </div>
              <div className="min-w-0 rounded-xl border bg-subtle p-4">
                <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">Format</p>
                <p className="mt-2 text-sm">JSON in, JSON out, over HTTPS.</p>
              </div>
            </div>

            <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] xl:gap-10">
              <Prose>
                <h3 className="text-base font-semibold tracking-tight text-foreground">Quickstart</h3>
                <ol className="space-y-3">
                  {[
                    'Open the dashboard, then API keys from the account menu, and create a key. It is shown once.',
                    `Keep it in an environment variable. Every sample on this page reads \`${KEY_ENV}\`.`,
                    'Call `/api/auth/me`. A 200 with your GitHub login means you’re set.',
                  ].map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full border bg-background font-mono text-[10px] text-foreground tabular-nums">{i + 1}</span>
                      <span>
                        <Rich>{step}</Rich>
                      </span>
                    </li>
                  ))}
                </ol>
              </Prose>
              <Panel
                header={
                  <>
                    <span className="pl-1.5 text-xs font-medium">Terminal</span>
                    <CopyButton value={quickstart} label="Copy commands" />
                  </>
                }
              >
                <Code code={quickstart} language="bash" />
              </Panel>
            </div>
          </section>

          <section className="mt-16 border-t pt-12">
            <Heading id="authentication">Authentication</Heading>
            <div className="mt-4 grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] xl:gap-10">
              <Prose>
                <p>
                  <Rich>Send your key in the `x-api-key` header, or as a bearer token in `Authorization`. Both are equivalent.</Rich>
                </p>
                <p>A key has full access to your webhooks and their requests, so keep it out of client-side code and repositories. Revoke a leaked key from the dashboard right away.</p>
                <Callout icon={KeyRound}>
                  <Rich>Key management (`/api/keys`) and admin endpoints only accept a signed-in dashboard session. A key can’t create or revoke other keys.</Rich>
                </Callout>
                <Callout icon={Lock}>
                  <Rich>Only the dashboard’s origin is allowed by CORS, so call the API from servers, scripts and CI rather than from other websites.</Rich>
                </Callout>
              </Prose>
              <Panel
                header={
                  <>
                    <span className="pl-1.5 text-xs font-medium">Headers</span>
                    <CopyButton value={`x-api-key: whk_…\nAuthorization: Bearer whk_…`} label="Copy headers" />
                  </>
                }
              >
                <Code code={`# either\nx-api-key: whk_…\n\n# or\nAuthorization: Bearer whk_…`} language="bash" />
              </Panel>
            </div>

            <Heading id="conventions" className="mt-14">
              Conventions
            </Heading>
            <div className="mt-4 grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] xl:gap-10">
              <Prose>
                <ul className="space-y-3">
                  {[
                    'Send bodies as JSON with `Content-Type: application/json`.',
                    'Webhooks are read by their endpoint slug, and changed or deleted by their numeric `id`.',
                    'Timestamps are UTC, formatted `YYYY-MM-DD HH:MM:SS`.',
                    '`is_active` is returned as `1` or `0`. Secrets are never returned; `has_secret` tells you if one is set.',
                    'Lists take `limit` (1 to 100, default 50) and `offset`, and return the envelope on the right.',
                  ].map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-2.5 size-1 shrink-0 rounded-full bg-muted-foreground/60" aria-hidden />
                      <span>
                        <Rich>{item}</Rich>
                      </span>
                    </li>
                  ))}
                </ul>
              </Prose>
              <Panel
                header={
                  <>
                    <span className="pl-1.5 text-xs font-medium">Paginated response</span>
                  </>
                }
              >
                <Code code={JSON.stringify({ data: ['…'], total: 128, totalPages: 3, limit: 50, offset: 0 }, null, 2)} language="json" />
              </Panel>
            </div>

            <Heading id="errors" className="mt-14">
              Errors
            </Heading>
            <div className="mt-4 grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] xl:gap-10">
              <StatusList items={ERRORS} />
              <div className="space-y-3">
                <Prose>
                  <p>
                    <Rich>Failed requests return a non-2xx status and a JSON body with a readable `error` message.</Rich>
                  </p>
                </Prose>
                <Panel header={<span className="pl-1.5 text-xs font-medium">Error body</span>}>
                  <Code code={JSON.stringify({ error: 'name is required' }, null, 2)} language="json" />
                </Panel>
              </div>
            </div>
          </section>

          {GROUPS.map((group) => (
            <section key={group.id} className="mt-16 border-t pt-12" aria-labelledby={group.id}>
              <Heading id={group.id}>{group.title}</Heading>
              <p className="mt-2 text-sm text-muted-foreground">{group.blurb}</p>
              <div className="mt-8">
                {ENDPOINTS.filter((e) => e.group === group.id).map((endpoint) => (
                  <EndpointSection key={endpoint.id} endpoint={endpoint} lang={lang} onLang={changeLang} />
                ))}
              </div>
            </section>
          ))}

          <div className="mt-16 flex flex-col items-start gap-3 rounded-xl border bg-subtle p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">Ready to try it?</p>
              <p className="mt-0.5 text-sm text-muted-foreground">Create a key in the dashboard and run the quickstart.</p>
            </div>
            <a
              href="/"
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs transition-colors outline-none hover:bg-primary/90 focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              Open dashboard
              <ArrowUpRight className="size-4" />
            </a>
          </div>
        </main>
      </div>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-xs text-muted-foreground sm:px-6">
          <span>© {new Date().getFullYear()} Webhook Tester</span>
          <ThemeSwitcher layoutId="docs-theme-pill" />
        </div>
      </footer>
    </div>
  );
}
