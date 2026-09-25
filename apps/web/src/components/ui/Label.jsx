import { cn } from '../../lib/utils';

const Label = ({ className, ...props }) => <label className={cn('flex items-center gap-2 text-sm font-medium leading-none select-none', className)} {...props} />;

export { Label };
