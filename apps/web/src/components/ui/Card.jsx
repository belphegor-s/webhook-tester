import { cn } from '../../lib/utils';

const Card = ({ className, ...props }) => <div className={cn('rounded-xl border bg-card text-card-foreground shadow-xs', className)} {...props} />;

const CardHeader = ({ className, ...props }) => <div className={cn('flex flex-col gap-1.5 p-5', className)} {...props} />;

const CardTitle = ({ className, ...props }) => <h3 className={cn('font-semibold leading-none tracking-tight', className)} {...props} />;

const CardDescription = ({ className, ...props }) => <p className={cn('text-sm text-muted-foreground', className)} {...props} />;

const CardContent = ({ className, ...props }) => <div className={cn('p-5 pt-0', className)} {...props} />;

const CardFooter = ({ className, ...props }) => <div className={cn('flex items-center p-5 pt-0', className)} {...props} />;

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
