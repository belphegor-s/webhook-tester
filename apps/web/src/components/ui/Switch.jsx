import { cn } from '../../lib/utils';

// shadcn-style switch built on a native button with role="switch".
export function Switch({ checked, onCheckedChange, disabled, className, ...props }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        'peer inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-colors outline-none',
        'focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-success' : 'bg-input dark:bg-input/80',
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          'pointer-events-none block size-4 rounded-full bg-background shadow-sm ring-0 transition-transform duration-200 dark:bg-foreground',
          checked ? 'translate-x-4' : 'translate-x-0.5',
        )}
      />
    </button>
  );
}
