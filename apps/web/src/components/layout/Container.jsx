import { cn } from '../../lib/utils';

const Container = ({ children, className }) => <div className={cn('relative mx-auto w-full max-w-6xl px-4 sm:px-6', className)}>{children}</div>;

export { Container };
