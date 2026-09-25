import * as React from 'react';
import { cn } from '../../lib/utils';
import { fieldClasses } from '../../lib/styles';

const Input = React.forwardRef(({ className, type, ...props }, ref) => <input ref={ref} type={type} className={cn(fieldClasses, 'h-9 py-1', className)} {...props} />);
Input.displayName = 'Input';

export { Input };
