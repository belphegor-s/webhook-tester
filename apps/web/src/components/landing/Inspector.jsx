import { Fragment, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Globe, Timer } from 'lucide-react';
import { MethodBadge } from '../docs/MethodBadge';
import { Badge } from '../ui/Badge';
import { WebhookAvatar } from '../webhook/WebhookAvatar';
import { cn } from '../../lib/utils';

const TABS = [
  { key: 'body', label: 'Body' },
  { key: 'headers', label: 'Headers' },
  { key: 'query', label: 'Query' },
];

// Light JSON colouring: enough to read like the dashboard without loading the syntax highlighter on the landing page.
const TOKEN = /("(?:\\.|[^"\\])*")(\s*:)?|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|\b(true|false|null)\b/g;

const Json = ({ value }) => {
  const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  if (!text || text === '{}') return <p className="py-8 text-center text-xs text-muted-foreground">Nothing here</p>;
  if (typeof value === 'string') return <pre className="font-mono text-[11.5px] leading-relaxed [overflow-wrap:anywhere] whitespace-pre-wrap text-muted-foreground">{text}</pre>;
  const parts = [];
  let last = 0;
  for (const m of text.matchAll(TOKEN)) {
    if (m.index > last) parts.push(<Fragment key={last}>{text.slice(last, m.index)}</Fragment>);
    const [, str, colon, num, lit] = m;
    if (str && colon) parts.push(<span key={m.index} className="text-foreground">{str}<span className="text-muted-foreground">{colon}</span></span>);
    else if (str) parts.push(<span key={m.index} className="text-success">{str}</span>);
    else if (num) parts.push(<span key={m.index} className="text-warning">{num}</span>);
    else parts.push(<span key={m.index} className="text-info">{lit}</span>);
    last = m.index + m[0].length;
  }
  parts.push(<Fragment key="end">{text.slice(last)}</Fragment>);
  return <pre className="font-mono text-[11.5px] leading-relaxed [overflow-wrap:anywhere] whitespace-pre-wrap text-muted-foreground">{parts}</pre>;
};

const ago = (t, now) => {
  const s = Math.max(0, Math.round((now - t) / 1000));
  if (s < 3) return 'now';
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m`;
};

const useNow = (ms) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), ms);
    return () => window.clearInterval(id);
  }, [ms]);
  return now;
};

const Detail = ({ request, tab, setTab }) => (
    <div className="flex min-h-0 min-w-0 flex-col">
      <div className="flex items-center gap-2.5 border-b px-4 py-3">
        <MethodBadge method={request.method} />
        <span className="truncate font-mono text-xs">{request.event}</span>
        <span className="ml-auto shrink-0 font-mono text-[11px] text-muted-foreground">#{request.id}</span>
      </div>
      <dl className="grid grid-cols-2 gap-px border-b bg-border text-[11px]">
        <div className="flex items-center gap-2 bg-card px-4 py-2.5">
          <Globe className="size-3 shrink-0 text-muted-foreground" />
          <dt className="sr-only">IP address</dt>
          <dd className="truncate font-mono">{request.ip}</dd>
        </div>
        <div className="flex items-center gap-2 bg-card px-4 py-2.5">
          <Timer className="size-3 shrink-0 text-muted-foreground" />
          <dt className="sr-only">Response time</dt>
          <dd className="font-mono tabular-nums">{request.ms} ms</dd>
        </div>
      </dl>
      <div role="tablist" aria-label="Request data" className="flex border-b px-2">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={cn(
              'relative px-2.5 py-2.5 text-xs font-medium transition-colors outline-none focus-visible:text-foreground',
              tab === key ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {label}
            {tab === key && <motion.span layoutId="hero-tab" className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-foreground" />}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="h-52 overflow-y-auto px-4 py-3 [scrollbar-width:thin] sm:h-56">
        <Json value={request[tab]} />
      </div>
    </div>
);

/**
 * The hero's product preview: a webhook's request list fed by the SignalField, with the selected request opened beside it.
 * It is a working miniature of the dashboard, so it stays interactive: rows select, tabs switch.
 */
export function Inspector({ requests, total, selectedId, onSelect, className }) {
  const now = useNow(1000);
  // Lives here, not in Detail, so the open tab survives new requests arriving.
  const [tab, setTab] = useState('body');
  const selected = requests.find((r) => r.id === selectedId) ?? requests[0];

  return (
    <div className={cn('overflow-hidden rounded-2xl border bg-card/85 shadow-[0_1px_0_0_var(--border),0_24px_80px_-24px_rgb(0_0_0/0.35)] backdrop-blur-xl', className)}>
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <WebhookAvatar seed="checkout-events" className="size-6" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">checkout-events</p>
        </div>
        <Badge variant="outline" className="gap-1.5">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex size-1.5 rounded-full bg-success" />
          </span>
          Live
        </Badge>
        <span className="ml-auto hidden font-mono text-[11px] text-muted-foreground tabular-nums sm:inline">{total.toLocaleString('en-US')} requests</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        {/* The list never sets the card's height: a fixed box on phones, and on wider screens it fills whatever the
            detail pane needs. New rows push old ones out of view instead of growing the card and shifting the page. */}
        <div className="relative h-[15.5rem] overflow-hidden border-b md:h-auto md:border-r md:border-b-0">
          <ul aria-label="Captured requests" className="md:absolute md:inset-x-0 md:top-0">
            {/* popLayout takes a leaving row out of the flow at once, so the list never briefly holds an extra row. */}
            <AnimatePresence initial={false} mode="popLayout">
              {requests.map((r) => (
                <motion.li
                  key={r.id}
                  layout="position"
                  initial={{ opacity: 0, y: -14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="border-b last:border-b-0"
                >
                  <button
                    type="button"
                    onClick={() => onSelect(r.id)}
                    aria-pressed={selected?.id === r.id}
                    className={cn(
                      'relative grid w-full grid-cols-[3.75rem_minmax(0,1fr)_auto] items-center gap-3 px-4 py-2.5 text-left transition-colors outline-none hover:bg-accent/60 focus-visible:bg-accent/70',
                      selected?.id === r.id && 'bg-accent/70',
                    )}
                  >
                    {selected?.id === r.id && <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-foreground" aria-hidden />}
                    <MethodBadge method={r.method} className="w-fit" />
                    <span className="min-w-0">
                      <span className="block truncate font-mono text-xs">{r.event}</span>
                      <span className="block truncate text-[11px] text-muted-foreground">{r.agent}</span>
                    </span>
                    <time className="text-[11px] text-muted-foreground tabular-nums">{ago(r.receivedAt, now)}</time>
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-card to-transparent" aria-hidden />
        </div>
        <div className="hidden md:block">{selected && <Detail request={selected} tab={tab} setTab={setTab} />}</div>
      </div>
    </div>
  );
}
