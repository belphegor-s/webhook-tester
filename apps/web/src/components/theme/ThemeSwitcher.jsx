import { Monitor, Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../../hooks/useTheme';
import { cn } from '../../lib/utils';

const OPTIONS = [
  { value: 'system', label: 'System', Icon: Monitor },
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
];

export function ThemeSwitcher({ className, layoutId = 'theme-pill' }) {
  const { theme, setTheme } = useTheme();

  return (
    <div role="radiogroup" aria-label="Theme" className={cn('inline-flex items-center gap-0.5 rounded-full border bg-background p-0.5', className)}>
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setTheme(value, { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
            }}
            className={cn(
              'relative flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              active && 'text-foreground',
            )}
          >
            {active && <motion.span layoutId={layoutId} className="absolute inset-0 rounded-full bg-accent ring-1 ring-border" transition={{ type: 'spring', stiffness: 500, damping: 35 }} />}
            <Icon className="relative size-3.5" />
          </button>
        );
      })}
    </div>
  );
}
