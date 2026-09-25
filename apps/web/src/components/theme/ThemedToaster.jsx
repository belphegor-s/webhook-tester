import { Toaster } from 'sonner';
import { useTheme } from '../../hooks/useTheme';

export function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      theme={resolvedTheme}
      position="bottom-right"
      offset={16}
      mobileOffset={{ bottom: 'calc(env(safe-area-inset-bottom) + 12px)', left: 12, right: 12 }}
      toastOptions={{ className: 'font-sans !text-[13px] !rounded-lg !border-border !bg-popover !text-popover-foreground !shadow-lg' }}
    />
  );
}
