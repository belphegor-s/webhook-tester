import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';

const METHOD_VARIANT = { GET: 'info', POST: 'success', PUT: 'warning', PATCH: 'warning', DELETE: 'error' };

export const MethodBadge = ({ method, className }) => (
  <Badge variant={METHOD_VARIANT[method] ?? 'default'} className={cn('justify-center font-mono tracking-wide', className)}>
    {method}
  </Badge>
);
