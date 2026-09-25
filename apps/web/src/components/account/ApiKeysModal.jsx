import { lazy, Suspense, useEffect, useState } from 'react';
import { ArrowUpRight, KeyRound, Loader2, Plus, Trash2, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogHeader, DialogBody, DialogTitle, DialogDescription } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Skeleton } from '../ui/Skeleton';
import { CopyButton } from '../ui/CopyButton';
import { useApiKeys } from '../../hooks/useApiKeys';
import { WEBHOOK_BASE } from '../../lib/config';
import { ENDPOINTS } from '../docs/reference';
import { MethodBadge } from '../docs/MethodBadge';
import { formatRelative } from '../../utils/formatRelative';
import { formatUserDate } from '../../utils/formatUserDate';

const CodeBlock = lazy(() => import('../ui/CodeBlock').then((m) => ({ default: m.CodeBlock })));

const usageStyle = { padding: '0.75rem 2.75rem 0.75rem 0.875rem' };

// Lists, creates and revokes the signed-in user's API keys. A new key's secret is shown once, right after creation.
export function ApiKeysModal({ open, onOpenChange }) {
  const { keys, loading, fetchKeys, createKey, revokeKey } = useApiKeys();
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);
  const [revokingId, setRevokingId] = useState(null);

  useEffect(() => {
    if (!open) return;
    fetchKeys().catch((error) => toast.error(error.message));
  }, [open, fetchKeys]);

  const handleOpenChange = (next) => {
    if (!next) {
      // The plaintext key must not linger in memory once the dialog is closed.
      setCreated(null);
      setConfirmingId(null);
      setName('');
    }
    onOpenChange(next);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      setCreated(await createKey(name.trim()));
      setName('');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (key) => {
    setRevokingId(key.id);
    try {
      await revokeKey(key.id);
      if (created?.id === key.id) setCreated(null);
      toast.success(`Revoked ${key.name}`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setRevokingId(null);
      setConfirmingId(null);
    }
  };

  const example = `curl ${WEBHOOK_BASE}/api/webhooks \\\n  -H "x-api-key: ${created?.key ?? 'whk_…'}"`;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>API keys</DialogTitle>
        <DialogDescription>Call the API from scripts and CI. A key has full access to your webhooks, so keep it secret.</DialogDescription>
      </DialogHeader>

      <DialogBody className="space-y-5">
        {created && (
          <div role="status" className="space-y-2.5 rounded-lg border border-warning/30 bg-warning/10 p-3.5">
            <p className="flex items-center gap-2 text-sm font-medium">
              <TriangleAlert className="size-4 shrink-0 text-warning" />
              Copy your new key now. You won&apos;t see it again.
            </p>
            <div className="flex h-9 min-w-0 items-center gap-1 rounded-md border bg-background pr-0.5 pl-3">
              <code className="min-w-0 flex-1 truncate font-mono text-xs" title={created.key}>
                {created.key}
              </code>
              <CopyButton value={created.key} label="Copy key" className="size-7" />
            </div>
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-2">
          <Label htmlFor="api-key-name">New key</Label>
          <div className="flex gap-2">
            <Input id="api-key-name" autoComplete="off" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. GitHub Actions" />
            <Button type="submit" disabled={creating || !name.trim()} className="min-w-24">
              {creating ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  <Plus />
                  Create
                </>
              )}
            </Button>
          </div>
        </form>

        <div className="space-y-2">
          <p className="text-sm font-medium">Your keys</p>
          {loading && keys.length === 0 ? (
            <div className="space-y-2">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : keys.length === 0 ? (
            <div className="flex flex-col items-center rounded-lg border border-dashed px-4 py-8 text-center">
              <KeyRound className="mb-2 size-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No API keys yet.</p>
            </div>
          ) : (
            <ul className="divide-y rounded-lg border">
              {keys.map((key) => (
                <li key={key.id} className="flex items-center gap-3 px-3.5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{key.name}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      <code className="font-mono">{key.prefix}…</code>
                      <span aria-hidden="true"> · </span>
                      <span title={formatUserDate(key.created_at)}>Created {formatRelative(key.created_at)}</span>
                      <span aria-hidden="true"> · </span>
                      <span title={key.last_used_at ? formatUserDate(key.last_used_at) : undefined}>{key.last_used_at ? `Used ${formatRelative(key.last_used_at)}` : 'Never used'}</span>
                    </p>
                  </div>
                  {confirmingId === key.id ? (
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Button variant="ghost" size="sm" onClick={() => setConfirmingId(null)} disabled={revokingId === key.id}>
                        Cancel
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleRevoke(key)} disabled={revokingId === key.id} className="min-w-16">
                        {revokingId === key.id ? <Loader2 className="animate-spin" /> : 'Revoke'}
                      </Button>
                    </div>
                  ) : (
                    <Button variant="ghost" size="icon-sm" onClick={() => setConfirmingId(key.id)} aria-label={`Revoke ${key.name}`} title="Revoke">
                      <Trash2 />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Quick test</p>
          <div className="relative rounded-lg border bg-subtle">
            <Suspense fallback={<pre className="px-3.5 py-3 pr-11 font-mono text-xs leading-relaxed [overflow-wrap:anywhere] whitespace-pre-wrap text-muted-foreground">{example}</pre>}>
              <CodeBlock code={example} language="bash" style={usageStyle} />
            </Suspense>
            <CopyButton value={example} label="Copy command" className="absolute top-1.5 right-1.5 size-7" />
          </div>
          <p className="text-xs text-muted-foreground">
            Also accepted as <code className="font-mono">Authorization: Bearer whk_…</code>. Keys can&apos;t manage other keys.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm font-medium">Endpoints</p>
            <a href="/docs" target="_blank" rel="noopener" className="group inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
              Full API reference
              <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </div>
          <ul className="divide-y overflow-hidden rounded-lg border">
            {ENDPOINTS.map((endpoint) => (
              <li key={endpoint.id}>
                <a
                  href={`/docs#${endpoint.id}`}
                  target="_blank"
                  rel="noopener"
                  className="group flex items-center gap-3 px-3 py-2.5 transition-colors outline-none hover:bg-accent/60 focus-visible:bg-accent/60"
                >
                  <MethodBadge method={endpoint.method} className="w-14 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-mono text-xs" title={endpoint.path}>
                      {endpoint.path}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">{endpoint.title}</span>
                  </span>
                  <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </DialogBody>
    </Dialog>
  );
}
