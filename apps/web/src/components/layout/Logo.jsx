import { cn } from '../../lib/utils';

// Brand mark: a request trail curving into an endpoint node. Mirrors public/favicon.svg and public/icons/*.
export function LogoMark({ className }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className={cn('size-6', className)}>
      <rect width="32" height="32" rx="8" className="fill-foreground" />
      <path d="M8.6 12.25v2.75a6 6 0 0 0 6 6h2.5" className="stroke-background" strokeWidth="2.25" strokeLinecap="round" />
      <circle cx="8.6" cy="7.6" r="1.55" className="fill-background" opacity="0.6" />
      <circle cx="20.6" cy="21" r="3.25" className="stroke-background" strokeWidth="2.25" />
    </svg>
  );
}

export function Logo({ className, showText = true, textClassName }) {
  return (
    <span className={cn('flex items-center gap-2', className)}>
      <LogoMark />
      {showText && <span className={cn('text-sm font-semibold tracking-tight', textClassName)}>Webhook Tester</span>}
    </span>
  );
}
