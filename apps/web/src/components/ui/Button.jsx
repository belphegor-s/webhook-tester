import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '../../lib/utils';

const variants = {
  primary: 'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  outline: 'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/20 dark:hover:bg-input/40',
  ghost: 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
  danger: 'bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/40',
  link: 'text-foreground underline-offset-4 hover:underline',
};

const sizes = {
  sm: 'h-8 gap-1.5 rounded-md px-3 text-xs',
  md: 'h-9 gap-2 rounded-md px-4 text-sm',
  lg: 'h-10 gap-2 rounded-md px-6 text-sm',
  icon: 'size-9 rounded-md',
  'icon-sm': 'size-8 rounded-md',
};

const Button = React.forwardRef(({ className, variant = 'primary', size = 'md', asChild = false, type, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      ref={ref}
      type={asChild ? undefined : (type ?? 'button')}
      className={cn(
        'inline-flex shrink-0 items-center justify-center whitespace-nowrap font-medium transition-[color,background-color,border-color,box-shadow,transform] outline-none select-none',
        'focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
});
Button.displayName = 'Button';

export { Button };
