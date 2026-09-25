import { motion } from 'framer-motion';
import { Activity, ArrowUpRight, Copy, Lock, MoreHorizontal, Pause, Pencil, Play, Trash2 } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/DropdownMenu';
import { WebhookAvatar } from './WebhookAvatar';
import { WEBHOOK_BASE } from '../../lib/config';
import { formatRelative } from '../../utils/formatRelative';
import { formatUserDate } from '../../utils/formatUserDate';
import { cn } from '../../lib/utils';

const host = WEBHOOK_BASE.replace(/^https?:\/\//, '');

const WebhookCard = ({ webhook, index = 0, onSelect, onDelete, onCopy, onToggleActive, onEdit }) => {
  const count = webhook.total_requests || 0;
  const active = Boolean(webhook.is_active);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.25, delay: Math.min(index, 8) * 0.03, ease: [0.16, 1, 0.3, 1] }}
      className="group relative flex h-full min-w-0 flex-col rounded-xl border bg-card p-4 shadow-xs transition-[border-color,box-shadow] hover:border-foreground/20 hover:shadow-md sm:p-5 dark:hover:border-foreground/25"
    >
      {/* Stretched button makes the whole card clickable while keeping the menu separately focusable. */}
      <button
        type="button"
        onClick={() => onSelect(webhook)}
        className="absolute inset-0 rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        aria-label={`Open ${webhook.name}`}
      />

      <div className="flex items-start gap-3">
        <WebhookAvatar seed={webhook.endpoint || webhook.name} className={cn('transition-[filter,opacity]', !active && 'opacity-60 grayscale')} />
        <div className="min-w-0 flex-1">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold">
            <span className="truncate">{webhook.name}</span>
            {webhook.has_secret && <Lock className="size-3 shrink-0 text-muted-foreground" aria-label="Protected with a secret" />}
          </h3>
          <p className="truncate font-mono text-xs text-muted-foreground" title={`${host}/webhook/${webhook.endpoint}`}>
            {host}/webhook/{webhook.endpoint}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="relative z-10 -mt-1 -mr-1.5" aria-label={`Actions for ${webhook.name}`}>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={() => onSelect(webhook)}>
              <ArrowUpRight />
              View requests
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onCopy(webhook.endpoint)}>
              <Copy />
              Copy URL
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onEdit(webhook)}>
              <Pencil />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onToggleActive(webhook, !active)}>
              {active ? <Pause /> : <Play />}
              {active ? 'Deactivate' : 'Activate'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => onDelete(webhook.id, webhook.name)}>
              <Trash2 />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <p className="mt-3 line-clamp-2 min-h-10 text-sm text-muted-foreground">{webhook.description || <span className="text-muted-foreground/60">No description</span>}</p>

      <div className="mt-4 flex items-center justify-between gap-3 border-t pt-3.5 text-xs text-muted-foreground">
        <div className="flex min-w-0 items-center gap-3">
          <Badge variant={active ? 'success' : 'outline'}>
            <span className={cn('size-1.5 rounded-full', active ? 'bg-success' : 'bg-muted-foreground')} />
            {active ? 'Active' : 'Inactive'}
          </Badge>
          <span className="flex items-center gap-1.5 tabular-nums">
            <Activity className="size-3.5" />
            <span>
              {count.toLocaleString()}
              <span className="hidden min-[360px]:inline"> request{count === 1 ? '' : 's'}</span>
            </span>
          </span>
        </div>
        <time dateTime={webhook.created_at} title={formatUserDate(webhook.created_at)} className="shrink-0">
          {formatRelative(webhook.created_at)}
        </time>
      </div>
    </motion.div>
  );
};

export { WebhookCard };
