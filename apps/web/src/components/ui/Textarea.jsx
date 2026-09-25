import * as React from 'react';
import { cn } from '../../lib/utils';
import { fieldClasses } from '../../lib/styles';

const Textarea = React.forwardRef(({ className, ...props }, ref) => <textarea ref={ref} className={cn(fieldClasses, 'min-h-20 resize-y py-2', className)} {...props} />);
Textarea.displayName = 'Textarea';

export { Textarea };
