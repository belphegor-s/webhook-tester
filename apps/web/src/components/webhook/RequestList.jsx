import { lazy, Suspense, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Clock, Globe, Radio, User, CalendarClock } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';
import { CopyButton } from '../ui/CopyButton';
import { formatUserDate } from '../../utils/formatUserDate';
import { formatRelative } from '../../utils/formatRelative';
import { formatPayload, isEmptyPayload } from '../../utils/formatPayload';
import { cn } from '../../lib/utils';

// Syntax highlighting is only needed once a request is expanded, so load it on demand.
const CodeBlock = lazy(() => import('../ui/CodeBlock').then((m) => ({ default: m.CodeBlock })));

const METHOD_VARIANT = { GET: 'info', POST: 'success', PUT: 'warning', PATCH: 'warning', DELETE: 'error' };

const TABS = [
  { key: 'body', label: 'Body' },
  { key: 'headers', label: 'Headers' },
  { key: 'query_params', label: 'Query' },
];

const gridCols = 'grid-cols-[4.5rem_minmax(0,1fr)_1rem] md:grid-cols-[4.5rem_minmax(0,1fr)_9rem_1rem] lg:grid-cols-[4.5rem_minmax(0,1fr)_9rem_5rem_8rem_1rem]';

const MetaItem = ({ icon: Icon, label, children, className }) => (
  <div className={cn('flex min-w-0 items-start gap-2.5 rounded-lg border bg-background p-3', className)}>
    <Icon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
    <div className="min-w-0">
      <div className="text-[11px] font-medium text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-xs break-words">{children}</div>
    </div>
  </div>
);

const RequestDetails = ({ request }) => {
  const [tab, setTab] = useState('body');
  const payloads = Object.fromEntries(TABS.map(({ key }) => [key, formatPayload(request[key])]));
  const current = payloads[tab];
  const empty = isEmptyPayload(current);

  return (
    <div className="space-y-4 border-t bg-subtle px-3 py-4 sm:px-5 sm:py-5">
      <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2 lg:grid-cols-3">
        <MetaItem icon={Globe} label="IP address">
          <span className="font-mono">{request.ip_address || '-'}</span>
        </MetaItem>
        <MetaItem icon={Clock} label="Response time">
          <span className="tabular-nums">{request.response_time ? `${request.response_time} ms` : '-'}</span>
        </MetaItem>
        <MetaItem icon={CalendarClock} label="Received" className="min-[360px]:col-span-2 lg:col-span-1">
          {formatUserDate(request.created_at)}
        </MetaItem>
        <MetaItem icon={User} label="User agent" className="min-[360px]:col-span-2 lg:col-span-3">
          <span className="font-mono">{request.user_agent || '-'}</span>
        </MetaItem>
      </div>

      <div className="overflow-hidden rounded-lg border bg-background">
        <div className="flex items-center justify-between gap-2 border-b pr-1.5 pl-1">
          <div role="tablist" aria-label="Request data" className="flex min-w-0">
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                role="tab"
                type="button"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={cn(
                  'relative px-2.5 py-2.5 text-xs font-medium whitespace-nowrap transition-colors outline-none focus-visible:text-foreground',
                  tab === key ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {label}
                {tab === key && <motion.span layoutId={`tab-${request.id}`} className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-foreground" />}
              </button>
            ))}
          </div>
          <CopyButton value={current} label={`Copy ${tab.replace('_', ' ')}`} disabled={empty} />
        </div>
        <div role="tabpanel">
          {empty ? (
            <p className="px-4 py-8 text-center text-xs text-muted-foreground">Nothing here</p>
          ) : (
            <Suspense fallback={<pre className="overflow-auto px-4 py-3.5 font-mono text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground">{current}</pre>}>
              <CodeBlock code={current} />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  );
};

const RequestRow = ({ request, expanded, onToggle }) => {
  const method = request.method?.toUpperCase() || '-';
  return (
    <li className="border-b last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className={cn('grid w-full items-center gap-3 px-3 py-3 text-left transition-colors outline-none hover:bg-accent/50 focus-visible:bg-accent/60 sm:px-5', gridCols, expanded && 'bg-accent/40')}
      >
        <Badge variant={METHOD_VARIANT[method] ?? 'default'} className="w-fit font-mono">
          {method}
        </Badge>
        <div className="min-w-0">
          <div className="truncate font-mono text-xs">#{String(request.id)}</div>
          <div className="mt-0.5 truncate text-[11px] text-muted-foreground lg:hidden">
            <time dateTime={request.created_at}>{formatRelative(request.created_at)}</time>
            <span className="md:hidden">{request.ip_address ? ` · ${request.ip_address}` : ''}</span>
          </div>
        </div>
        <span className="hidden truncate font-mono text-xs text-muted-foreground md:block">{request.ip_address || '-'}</span>
        <span className="hidden text-right text-xs text-muted-foreground tabular-nums lg:block">{request.response_time ? `${request.response_time} ms` : '-'}</span>
        <time dateTime={request.created_at} title={formatUserDate(request.created_at)} className="hidden truncate text-right text-xs text-muted-foreground lg:block">
          {formatRelative(request.created_at)}
        </time>
        <ChevronDown className={cn('size-4 text-muted-foreground transition-transform duration-200', expanded && 'rotate-180')} />
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <RequestDetails request={request} />
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
};

const HeaderRow = () => (
  <div className={cn('grid gap-3 border-b bg-subtle px-3 py-2 text-[11px] font-medium text-muted-foreground sm:px-5', gridCols)}>
    <span>Method</span>
    <span>Request</span>
    <span className="hidden md:block">IP address</span>
    <span className="hidden text-right lg:block">Duration</span>
    <span className="hidden text-right lg:block">Received</span>
    <span />
  </div>
);

export const RequestListSkeleton = () => (
  <div className="overflow-hidden rounded-xl border bg-card shadow-xs" aria-busy="true" aria-label="Loading requests">
    <HeaderRow />
    {Array.from({ length: 6 }, (_, i) => (
      <div key={i} className={cn('grid items-center gap-3 border-b px-3 py-3.5 last:border-b-0 sm:px-5', gridCols)}>
        <Skeleton className="h-5 w-12" />
        <Skeleton className="h-3 w-32 max-w-full" />
        <Skeleton className="hidden h-3 w-24 md:block" />
        <Skeleton className="hidden h-3 w-12 justify-self-end lg:block" />
        <Skeleton className="hidden h-3 w-16 justify-self-end lg:block" />
        <Skeleton className="size-4" />
      </div>
    ))}
  </div>
);

export const RequestList = ({ requests, url }) => {
  const [expanded, setExpanded] = useState({});
  const toggle = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed px-4 py-16 text-center sm:px-6">
        <span className="relative mb-4 flex size-10 items-center justify-center rounded-full border bg-card">
          <Radio className="size-4 text-muted-foreground" />
          <span className="absolute inset-0 animate-ping rounded-full border border-foreground/10" />
        </span>
        <h3 className="text-sm font-medium">Waiting for requests</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">Send a request to your endpoint and it shows up here automatically.</p>
        {url && (
          <code className="mt-5 block w-full max-w-lg overflow-x-auto rounded-lg border bg-subtle px-3 py-2 text-left font-mono text-[11px] whitespace-nowrap text-muted-foreground sm:w-auto sm:text-xs">
            {`curl -X POST ${url} -H "Content-Type: application/json" -d '{"hello":"world"}'`}
          </code>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
      <HeaderRow />
      <ul>
        {requests.map((request) => (
          <RequestRow key={request.id} request={request} expanded={!!expanded[request.id]} onToggle={() => toggle(request.id)} />
        ))}
      </ul>
    </div>
  );
};
