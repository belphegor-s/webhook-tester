import { cn } from '../../lib/utils';

const variants = {
  default: 'border-border bg-secondary text-secondary-foreground',
  success: 'border-success/25 bg-success/10 text-success',
  error: 'border-destructive/25 bg-destructive/10 text-destructive',
  warning: 'border-warning/30 bg-warning/10 text-warning',
  info: 'border-info/25 bg-info/10 text-info',
  outline: 'border-border text-muted-foreground',
};

const Badge = ({ className, variant = 'default', ...props }) => (
  <span className={cn('inline-flex shrink-0 items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium leading-none whitespace-nowrap', variants[variant], className)} {...props} />
);

export { Badge };
