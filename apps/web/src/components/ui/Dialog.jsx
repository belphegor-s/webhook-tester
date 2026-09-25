import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

const Dialog = ({ open, onOpenChange, children, className }) => (
  <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in dark:bg-black/60" />
      <div className="pointer-events-none fixed inset-0 z-50 flex items-end justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-center sm:p-4">
        <DialogPrimitive.Content
          className={cn(
            'pointer-events-auto relative flex max-h-[calc(100dvh-1.5rem)] w-full flex-col overflow-y-auto border bg-popover text-popover-foreground shadow-2xl outline-none',
            'rounded-2xl sm:max-w-md sm:rounded-xl',
            'data-[state=closed]:animate-out data-[state=open]:animate-in',
            className,
          )}
        >
          {children}
          <DialogPrimitive.Close className="absolute top-3.5 right-3.5 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none">
            <X className="size-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </div>
    </DialogPrimitive.Portal>
  </DialogPrimitive.Root>
);

const DialogHeader = ({ className, ...props }) => <div className={cn('flex flex-col gap-1.5 px-5 pt-5 pr-12 sm:px-6 sm:pt-6', className)} {...props} />;

const DialogBody = ({ className, ...props }) => <div className={cn('px-5 py-5 sm:px-6', className)} {...props} />;

const DialogTitle = ({ className, ...props }) => <DialogPrimitive.Title className={cn('text-base font-semibold tracking-tight', className)} {...props} />;

const DialogDescription = ({ className, ...props }) => <DialogPrimitive.Description className={cn('text-sm text-muted-foreground', className)} {...props} />;

const DialogFooter = ({ className, ...props }) => (
  <div className={cn('flex flex-col-reverse gap-2 border-t bg-subtle px-5 py-3.5 rounded-b-2xl sm:flex-row sm:justify-end sm:rounded-b-xl sm:px-6', className)} {...props} />
);

export { Dialog, DialogHeader, DialogBody, DialogFooter, DialogTitle, DialogDescription };
