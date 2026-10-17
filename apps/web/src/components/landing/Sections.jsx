import { lazy, Suspense, useId, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, Cloud, Database, KeyRound, Lock, Pause, Plus, Radio, ShieldCheck, Terminal, Waypoints } from 'lucide-react';
import { Container } from '../layout/Container';
import { Badge } from '../ui/Badge';
import { CopyButton } from '../ui/CopyButton';
import { MethodBadge } from '../docs/MethodBadge';
import { ENDPOINTS, KEY_ENV, LANGUAGES, snippet } from '../docs/reference';
import { WEBHOOK_BASE } from '../../lib/config';
import { cn } from '../../lib/utils';

const CodeBlock = lazy(() => import('../ui/CodeBlock').then((m) => ({ default: m.CodeBlock })));

const ease = [0.16, 1, 0.3, 1];
const HOST = WEBHOOK_BASE.replace(/^https?:\/\//, '');

// Fades a block up the first time it scrolls into view.
export const Reveal = ({ children, delay = 0, className, as = 'div' }) => {
  const Comp = motion[as];
  return (
    <Comp initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-12% 0px' }} transition={{ duration: 0.6, ease, delay }} className={className}>
      {children}
    </Comp>
  );
};

const SectionHeading = ({ eyebrow, title, children, className }) => (
  <Reveal className={cn('mx-auto max-w-2xl text-center', className)}>
    <p className="font-mono text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase">{eyebrow}</p>
    <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-balance sm:text-4xl">{title}</h2>
    {children && <p className="mt-4 text-base text-pretty text-muted-foreground">{children}</p>}
  </Reveal>
);

// A halftone dot pattern in CSS, echoing the hero field where a canvas would be overkill.
export const DotGrid = ({ className }) => (
  <div aria-hidden className={cn('pointer-events-none absolute inset-0 [background-image:radial-gradient(var(--dot)_1px,transparent_1.5px)] [background-size:11px_11px] [--dot:color-mix(in_oklch,var(--foreground)_16%,transparent)]', className)} />
);

const Card = ({ className, children }) => <div className={cn('relative overflow-hidden rounded-2xl border bg-card shadow-xs', className)}>{children}</div>;

/* ----------------------------------------------------------------------------------------------- Providers */

const PROVIDERS = ['Stripe', 'GitHub', 'Shopify', 'Slack', 'Twilio', 'Linear', 'Discord', 'Clerk', 'Resend', 'Paddle', 'Zapier', 'your own code'];

export const Providers = () => (
  <section aria-label="Works with" className="border-y bg-subtle/60">
    <Container className="flex flex-col items-center gap-4 py-8 sm:flex-row sm:justify-between sm:gap-8">
      <p className="shrink-0 text-xs text-muted-foreground">Point anything that speaks HTTP at it</p>
      <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2 sm:justify-end">
        {PROVIDERS.map((p, i) => (
          <li key={p} className={cn('font-mono text-xs', i === PROVIDERS.length - 1 ? 'text-foreground' : 'text-muted-foreground')}>
            {p}
          </li>
        ))}
      </ul>
    </Container>
  </section>
);

/* ------------------------------------------------------------------------------------------- How it works */

const StepVisual = {
  create: () => (
    <div className="space-y-2.5 rounded-xl border bg-background p-3.5 text-xs">
      <div>
        <p className="mb-1 text-[11px] font-medium text-muted-foreground">Name</p>
        <div className="flex h-8 items-center rounded-md border px-2.5">
          stripe-test
          <span className="ml-px h-3.5 w-px animate-pulse bg-foreground" />
        </div>
      </div>
      <div>
        <p className="mb-1 text-[11px] font-medium text-muted-foreground">Secret (optional)</p>
        <div className="flex h-8 items-center rounded-md border px-2.5 tracking-widest text-muted-foreground">••••••••</div>
      </div>
      <div className="flex h-8 items-center justify-center gap-1.5 rounded-md bg-primary font-medium text-primary-foreground">
        <Plus className="size-3.5" />
        Create webhook
      </div>
    </div>
  ),
  point: () => (
    <div className="rounded-xl border bg-background p-3.5 font-mono text-[11px] leading-relaxed">
      <p className="text-muted-foreground">
        <span className="text-success">$</span> curl -X POST \
      </p>
      <p className="pl-3 break-all">
        {HOST}/webhook/<span className="text-info">k3v9x2</span> \
      </p>
      <p className="pl-3 text-muted-foreground">-H &quot;Content-Type: application/json&quot; \</p>
      <p className="pl-3 text-muted-foreground">
        -d <span className="text-success">&apos;{'{"hello":"world"}'}&apos;</span>
      </p>
      <p className="mt-2 border-t pt-2 text-muted-foreground">
        <span className="text-success">200</span> {'{"message":"Webhook received successfully"}'}
      </p>
    </div>
  ),
  watch: () => (
    <div className="overflow-hidden rounded-xl border bg-background text-xs">
      {[
        ['POST', 'hello', 'now'],
        ['POST', 'invoice.paid', '12s'],
        ['PATCH', 'user.updated', '1m'],
      ].map(([m, e, t], i) => (
        <div key={e} className={cn('flex items-center gap-2.5 border-b px-3 py-2 last:border-b-0', i === 0 && 'bg-accent/60')}>
          <MethodBadge method={m} className="w-12" />
          <span className="min-w-0 flex-1 truncate font-mono">{e}</span>
          <span className="text-[11px] text-muted-foreground">{t}</span>
        </div>
      ))}
    </div>
  ),
};

const STEPS = [
  { key: 'create', title: 'Create an endpoint', body: 'Name it, add a description and, if you like, a secret. You get a unique URL straight away.' },
  { key: 'point', title: 'Point anything at it', body: 'Paste the URL into Stripe, GitHub or your own service, or fire a request at it with curl.' },
  { key: 'watch', title: 'Watch it land', body: 'Requests show up the moment they arrive. Open one to read its headers, body and query string.' },
];

export const HowItWorks = () => (
  <section id="how" className="scroll-mt-20 py-24 sm:py-32">
    <Container>
      <SectionHeading eyebrow="How it works" title="From zero to first request in under a minute">
        No CLI to install and no tunnel to keep alive. Sign in with GitHub and you&apos;re ready.
      </SectionHeading>
      <ol className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-3">
        {STEPS.map(({ key, title, body }, i) => {
          const Visual = StepVisual[key];
          return (
            <Reveal as="li" key={key} delay={i * 0.08}>
              <Card className="flex h-full flex-col p-5">
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex size-7 items-center justify-center rounded-full border bg-subtle font-mono text-xs">{i + 1}</span>
                  <h3 className="font-medium">{title}</h3>
                </div>
                <p className="mb-5 text-sm text-muted-foreground">{body}</p>
                <div className="mt-auto">
                  <Visual />
                </div>
              </Card>
            </Reveal>
          );
        })}
      </ol>
    </Container>
  </section>
);

/* ----------------------------------------------------------------------------------------------- Features */

const FeatureTitle = ({ icon: Icon, children }) => (
  <h3 className="flex items-center gap-2 font-medium">
    <Icon className="size-4 text-muted-foreground" />
    {children}
  </h3>
);

const shortId = (n) => `k3v9…${String(n).slice(-2)}`;

// The stream card replays the hero's own arrivals as SSE events.
const StreamLog = ({ requests }) => (
  <div className="rounded-xl border bg-background p-3.5 font-mono text-[11px] leading-relaxed" aria-label="Example event stream">
    <p className="text-muted-foreground">
      <span className="text-success">$</span> curl -N {HOST}/api/stream -H &quot;x-api-key: $WHK_API_KEY&quot;
    </p>
    <div className="mt-2 space-y-1 border-t pt-2">
      <p>
        <span className="text-info">event:</span> ready
      </p>
      {requests
        .slice(0, 3)
        .reverse()
        .map((r) => (
          <motion.p key={r.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, ease }} className="truncate">
            <span className="text-info">event:</span> request <span className="text-muted-foreground">data:</span>{' '}
            <span className="text-muted-foreground">{`{"endpoint":"${shortId(r.id)}","request_id":${r.id}}`}</span>
          </motion.p>
        ))}
      <p className="text-muted-foreground">
        <span className="text-info">event:</span> ping
      </p>
    </div>
  </div>
);

const CAPTURED = ['Method', 'Headers', 'Raw body', 'Query string', 'Source IP', 'User agent', 'Response time', 'Timestamp'];

export const Features = ({ requests }) => (
  <section id="features" className="scroll-mt-20 border-t bg-subtle/50 py-24 sm:py-32">
    <Container>
      <SectionHeading eyebrow="Features" title="Everything you need to debug a webhook, nothing you don't">
        A focused tool: catch the request, show it exactly as it was sent, and get out of the way.
      </SectionHeading>

      <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-6">
        <Reveal className="md:col-span-4">
          <Card className="grid grid-cols-1 h-full gap-6 p-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-center">
            <div>
              <FeatureTitle icon={Radio}>Live, no refresh button</FeatureTitle>
              <p className="mt-2 text-sm text-muted-foreground">
                Your dashboard holds an open Server-Sent Events stream, so a request appears the moment it lands. If the stream drops, it falls back to polling and catches up on reconnect.
              </p>
            </div>
            <StreamLog requests={requests} />
          </Card>
        </Reveal>

        <Reveal className="md:col-span-2" delay={0.06}>
          <Card className="h-full p-6">
            <FeatureTitle icon={Waypoints}>Every byte, as sent</FeatureTitle>
            <p className="mt-2 text-sm text-muted-foreground">Nothing is reformatted on the way in.</p>
            <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
              {CAPTURED.map((c) => (
                <li key={c} className="flex items-center gap-1.5">
                  <Check className="size-3.5 shrink-0 text-success" />
                  {c}
                </li>
              ))}
            </ul>
          </Card>
        </Reveal>

        <Reveal className="md:col-span-2">
          <Card className="h-full p-6">
            <FeatureTitle icon={Lock}>Lock it with a secret</FeatureTitle>
            <p className="mt-2 text-sm text-muted-foreground">Set one and only requests whose Authorization header carries it get through.</p>
            <div className="mt-4 space-y-1.5 font-mono text-[11px]">
              <div className="flex items-center justify-between gap-2 rounded-md border bg-background px-2.5 py-1.5">
                <span className="truncate text-muted-foreground">no Authorization</span>
                <Badge variant="error">401</Badge>
              </div>
              <div className="flex items-center justify-between gap-2 rounded-md border bg-background px-2.5 py-1.5">
                <span className="truncate">Bearer s3cr3t</span>
                <Badge variant="success">200</Badge>
              </div>
            </div>
          </Card>
        </Reveal>

        <Reveal className="md:col-span-2" delay={0.06}>
          <Card className="h-full p-6">
            <FeatureTitle icon={Pause}>Pause, don&apos;t delete</FeatureTitle>
            <p className="mt-2 text-sm text-muted-foreground">Switch an endpoint off and deliveries are refused with 403 until you switch it back on. History stays put.</p>
            <div className="mt-4 flex items-center justify-between rounded-md border bg-background px-2.5 py-1.5 text-xs">
              <span className="flex items-center gap-2">
                <span className="inline-flex h-4 w-7 items-center rounded-full bg-input p-0.5">
                  <span className="size-3 rounded-full bg-background shadow-xs ring-1 ring-border" />
                </span>
                Inactive
              </span>
              <Badge variant="warning" className="font-mono">
                403
              </Badge>
            </div>
          </Card>
        </Reveal>

        <Reveal className="md:col-span-2" delay={0.12}>
          <Card className="h-full p-6">
            <FeatureTitle icon={ShieldCheck}>Private by default</FeatureTitle>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>GitHub sign-in, verified emails only.</li>
              <li>Sessions and API keys stored as SHA-256 hashes.</li>
              <li>Other accounts get a 404 for anything of yours.</li>
            </ul>
          </Card>
        </Reveal>

        <Reveal className="md:col-span-3">
          <Card className="h-full p-6">
            <FeatureTitle icon={KeyRound}>An API for everything you can click</FeatureTitle>
            <p className="mt-2 text-sm text-muted-foreground">
              Create keys in the dashboard and script endpoints from tests or CI: create, read, update, delete, list captured requests and pull daily stats.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-md border bg-background px-2.5 py-1.5 font-mono text-[11px]">
              <span className="text-muted-foreground">x-api-key:</span> whk_••••••••••••
            </div>
          </Card>
        </Reveal>

        <Reveal className="md:col-span-3" delay={0.06}>
          <Card className="h-full p-6">
            <FeatureTitle icon={Cloud}>Runs on the edge</FeatureTitle>
            <p className="mt-2 text-sm text-muted-foreground">Deliveries are caught by a Cloudflare Worker close to the sender, stored in D1, and fanned out to your open tabs by a Durable Object.</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {[
                [Terminal, 'Workers'],
                [Database, 'D1'],
                [Radio, 'Durable Objects'],
              ].map(([Icon, label]) => (
                <span key={label} className="inline-flex items-center gap-1.5 rounded-md border bg-background px-2 py-1 text-[11px]">
                  <Icon className="size-3 text-muted-foreground" />
                  {label}
                </span>
              ))}
            </div>
          </Card>
        </Reveal>
      </div>
    </Container>
  </section>
);

/* -------------------------------------------------------------------------------------------------- API */

const SAMPLES = [
  { id: 'create-webhook', label: 'Create' },
  { id: 'list-requests', label: 'Read requests' },
  { id: 'update-webhook', label: 'Pause' },
].map((s) => ({ ...s, endpoint: ENDPOINTS.find((e) => e.id === s.id) }));

const codeStyle = { padding: '1rem 1.125rem', maxHeight: 'none' };

export const ApiSection = () => {
  const [sample, setSample] = useState(SAMPLES[0].id);
  const [lang, setLang] = useState('curl');
  const current = SAMPLES.find((s) => s.id === sample);
  const language = LANGUAGES.find((l) => l.id === lang);
  const code = snippet(lang, current.endpoint.example);
  // Reserve the tallest sample's height so switching tabs never moves the page.
  const lines = Math.max(...SAMPLES.flatMap((s) => LANGUAGES.map((l) => snippet(l.id, s.endpoint.example).split('\n').length)));

  return (
    <section id="api" className="scroll-mt-20 py-24 sm:py-32">
      <Container className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
        <Reveal>
          <p className="font-mono text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase">API</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-balance sm:text-4xl">Script it from your test suite</h2>
          <p className="mt-4 text-pretty text-muted-foreground">
            Spin up a fresh endpoint per test run, point the code under test at it, then assert on exactly what was sent. Every route is documented with cURL, JavaScript and Python examples.
          </p>
          <ul className="mt-6 space-y-2.5 text-sm">
            {['Keys are shown once and stored hashed', 'JSON in, JSON out, paginated lists', 'Live events over a single SSE connection'].map((t) => (
              <li key={t} className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-success" />
                {t}
              </li>
            ))}
          </ul>
          <a
            href="/docs"
            className="group mt-8 inline-flex items-center gap-1.5 text-sm font-medium underline decoration-dashed decoration-foreground/50 underline-offset-4 transition-colors outline-none hover:decoration-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            Read the API reference
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </a>
        </Reveal>

        <Reveal delay={0.08} className="min-w-0">
          <div className="overflow-hidden rounded-2xl border bg-subtle shadow-xs">
            <div className="flex items-center justify-between gap-2 border-b bg-background/60 px-1.5">
              <div role="tablist" aria-label="Example" className="flex min-w-0 overflow-x-auto [scrollbar-width:none]">
                {SAMPLES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    role="tab"
                    aria-selected={sample === s.id}
                    onClick={() => setSample(s.id)}
                    className={cn(
                      'relative flex items-center gap-1.5 px-2.5 py-2.5 text-xs font-medium whitespace-nowrap transition-colors outline-none focus-visible:text-foreground',
                      sample === s.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {s.label}
                    {sample === s.id && <motion.span layoutId="api-sample" className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-foreground" />}
                  </button>
                ))}
              </div>
              <CopyButton value={code} label="Copy example" />
            </div>
            <div className="flex items-center gap-2 border-b px-4 py-2.5">
              <MethodBadge method={current.endpoint.method} />
              <span className="truncate font-mono text-xs text-muted-foreground">{current.endpoint.path}</span>
              <div role="tablist" aria-label="Language" className="ml-auto flex shrink-0 gap-0.5 rounded-md border bg-background p-0.5">
                {LANGUAGES.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    role="tab"
                    aria-selected={lang === l.id}
                    onClick={() => setLang(l.id)}
                    className={cn('rounded px-2 py-0.5 text-[11px] font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50', lang === l.id ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground')}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ minHeight: `calc(${lines} * 1.6 * 12px + 2rem)` }}>
              <Suspense fallback={<pre className="px-[1.125rem] py-4 font-mono text-xs leading-relaxed [overflow-wrap:anywhere] whitespace-pre-wrap text-muted-foreground">{code}</pre>}>
                <CodeBlock code={code} language={language.grammar} style={codeStyle} />
              </Suspense>
            </div>
          </div>
          <p className="mt-3 text-center font-mono text-[11px] text-muted-foreground">export {KEY_ENV}=&quot;whk_…&quot;</p>
        </Reveal>
      </Container>
    </section>
  );
};

/* -------------------------------------------------------------------------------------------------- FAQ */

const FAQ = [
  { q: 'Is it free?', a: 'Yes. Webhook Tester is a personal project, offered free of charge. There is no paid plan and no card to enter.' },
  { q: 'What gets recorded for each request?', a: 'The method, every header, the raw body, query parameters, the source IP, the user agent, how long it took to handle and when it arrived.' },
  {
    q: 'Why does opening my endpoint in a browser take me to the dashboard?',
    a: 'A GET to an endpoint is treated as you visiting it, so it opens that webhook in the dashboard instead of being recorded. Send POST, PUT, PATCH or DELETE to capture a request.',
  },
  { q: 'How long is data kept?', a: 'Until you delete it. Deleting a webhook permanently removes its requests and stats along with it.' },
  {
    q: 'Can I protect an endpoint?',
    a: 'Give it a secret. Requests whose Authorization header doesn’t contain the secret are rejected with 401. You can also switch an endpoint off, which refuses deliveries with 403.',
  },
  { q: 'Should I send production data to it?', a: 'Best not. It is a testing tool, so avoid sending real secrets or sensitive personal data to your endpoints.' },
];

// Opens and closes with a height animation; the answer stays in the DOM only while open.
const FaqItem = ({ question, answer }) => {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className="px-5">
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-medium outline-none focus-visible:underline"
        >
          {question}
          <Plus className={cn('size-4 shrink-0 text-muted-foreground transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]', open && 'rotate-45')} />
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={id}
            role="region"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ height: { duration: 0.35, ease }, opacity: { duration: 0.2 } }}
            className="overflow-hidden"
          >
            <p className="pb-4 text-sm text-pretty text-muted-foreground">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const Faq = () => (
  <section id="faq" className="scroll-mt-20 border-t bg-subtle/50 py-24 sm:py-32">
    <Container className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:gap-16">
      <Reveal>
        <p className="font-mono text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase">FAQ</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-balance sm:text-4xl">Questions, answered</h2>
        <p className="mt-4 text-muted-foreground">
          Anything else? The{' '}
          <a href="/privacy" className="text-foreground underline decoration-dashed decoration-foreground/60 underline-offset-4 transition-colors hover:decoration-foreground">
            privacy policy
          </a>{' '}
          and{' '}
          <a href="/terms" className="text-foreground underline decoration-dashed decoration-foreground/60 underline-offset-4 transition-colors hover:decoration-foreground">
            terms
          </a>{' '}
          are short and plain.
        </p>
      </Reveal>
      <Reveal delay={0.06}>
        <div className="divide-y rounded-2xl border bg-card shadow-xs">
          {FAQ.map(({ q, a }) => (
            <FaqItem key={q} question={q} answer={a} />
          ))}
        </div>
      </Reveal>
    </Container>
  </section>
);

/* -------------------------------------------------------------------------------------------- Final CTA */

export const FinalCta = ({ href, label }) => (
  <section className="py-24 sm:py-32">
    <Container>
      <Reveal>
        <div className="relative isolate overflow-hidden rounded-3xl border bg-card px-6 py-16 text-center shadow-xs sm:py-20">
          <DotGrid className="-z-10 [mask-image:radial-gradient(ellipse_60%_80%_at_50%_100%,black,transparent)]" />
          <h2 className="mx-auto max-w-xl text-3xl font-semibold tracking-[-0.03em] text-balance sm:text-5xl">Your next webhook is one click away</h2>
          <p className="mx-auto mt-4 max-w-md text-pretty text-muted-foreground">Sign in with GitHub, copy your URL, and see the first request land before your coffee cools.</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={href}
              className="group inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm transition-[background-color,transform] outline-none hover:bg-primary/90 focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-[0.98]"
            >
              {label}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="/docs"
              className="inline-flex h-11 items-center rounded-full border bg-background px-6 text-sm font-medium transition-colors outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              Browse the API
            </a>
          </div>
        </div>
      </Reveal>
    </Container>
  </section>
);
