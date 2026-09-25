import { hashHue, cn } from '../../lib/utils';

// Deterministic soft gradient avatar based on the webhook's endpoint.
export function WebhookAvatar({ seed, className }) {
  const h = hashHue(seed);
  return (
    <span
      aria-hidden="true"
      className={cn('size-8 shrink-0 rounded-full ring-1 ring-border', className)}
      style={{ background: `radial-gradient(circle at 30% 25%, oklch(0.9 0.08 ${h}), oklch(0.68 0.14 ${(h + 40) % 360}) 70%)` }}
    />
  );
}
