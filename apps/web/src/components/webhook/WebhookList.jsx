import { AnimatePresence } from 'framer-motion';
import { WebhookCard } from './WebhookCard';
import { Skeleton } from '../ui/Skeleton';

const WebhookCardSkeleton = () => (
  <div className="flex h-full flex-col rounded-xl border bg-card p-4 shadow-xs sm:p-5">
    <div className="flex items-start gap-3">
      <Skeleton className="size-8 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-32" />
        <Skeleton className="h-3 w-48 max-w-full" />
      </div>
    </div>
    <div className="mt-4 min-h-10 space-y-2">
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
    </div>
    <div className="mt-4 flex items-center justify-between border-t pt-3.5">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-3 w-14" />
    </div>
  </div>
);

const gridClass = 'grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3';

const WebhookList = ({ webhooks, loading, onSelect, onDelete, onCopy, onToggleActive, onEdit }) => {
  if (loading) {
    return (
      <div className={gridClass} aria-busy="true" aria-label="Loading webhooks">
        {Array.from({ length: Math.max(webhooks.length, 3) }, (_, i) => (
          <WebhookCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className={gridClass}>
      <AnimatePresence>
        {webhooks.map((webhook, i) => (
          <WebhookCard key={webhook.id} index={i} webhook={webhook} onSelect={onSelect} onDelete={onDelete} onCopy={onCopy} onToggleActive={onToggleActive} onEdit={onEdit} />
        ))}
      </AnimatePresence>
    </div>
  );
};

export { WebhookList };
