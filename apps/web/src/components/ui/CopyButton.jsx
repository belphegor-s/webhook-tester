import { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from './Button';
import { cn } from '../../lib/utils';

// Copies `value` and swaps the icon to a check for a moment.
export function CopyButton({ value, onCopied, label = 'Copy', showLabel = false, className, variant = 'ghost', size, ...props }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef();

  useEffect(() => () => clearTimeout(timer.current), []);

  const handleCopy = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value ?? '');
      setCopied(true);
      onCopied?.();
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      onCopied?.(new Error('Clipboard unavailable'));
    }
  };

  return (
    <Button variant={variant} size={size ?? (showLabel ? 'sm' : 'icon-sm')} onClick={handleCopy} aria-label={label} title={label} className={cn(className)} {...props}>
      <span className="relative size-3.5">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={copied ? 'check' : 'copy'}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.12 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
          </motion.span>
        </AnimatePresence>
      </span>
      {showLabel && <span>{copied ? 'Copied' : label}</span>}
    </Button>
  );
}
