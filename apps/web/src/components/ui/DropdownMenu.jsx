import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { cn } from '../../lib/utils';

const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

const DropdownMenuContent = ({ className, sideOffset = 6, align = 'end', ...props }) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      sideOffset={sideOffset}
      align={align}
      collisionPadding={8}
      className={cn(
        'z-50 min-w-44 overflow-hidden rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg outline-none',
        'data-[state=closed]:animate-out data-[state=open]:animate-in',
        className,
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
);

const DropdownMenuItem = ({ className, variant = 'default', ...props }) => (
  <DropdownMenuPrimitive.Item
    className={cn(
      'relative flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg]:text-muted-foreground",
      variant === 'destructive' ? 'text-destructive focus:bg-destructive/10 [&_svg]:!text-destructive' : 'focus:bg-accent focus:text-accent-foreground',
      className,
    )}
    {...props}
  />
);

const DropdownMenuLabel = ({ className, ...props }) => <DropdownMenuPrimitive.Label className={cn('px-2 py-1.5 text-xs font-medium text-muted-foreground', className)} {...props} />;

const DropdownMenuSeparator = ({ className, ...props }) => <DropdownMenuPrimitive.Separator className={cn('-mx-1 my-1 h-px bg-border', className)} {...props} />;

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator };
