import { useState } from 'react';
import { KeyRound, LogOut, Shield } from 'lucide-react';
import { Container } from './Container';
import { Logo } from './Logo';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/DropdownMenu';
import { cn } from '../../lib/utils';

const Slash = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5 shrink-0 text-border" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M16.88 3.549L7.12 20.451" />
  </svg>
);

// GitHub avatar, falling back to the first letter of the login if the image can't load.
const UserAvatar = ({ user, className }) => {
  const [failed, setFailed] = useState(false);
  const base = cn('size-7 shrink-0 rounded-full border bg-muted', className);
  if (user.avatar_url && !failed) {
    return <img src={user.avatar_url} alt="" referrerPolicy="no-referrer" onError={() => setFailed(true)} className={base} />;
  }
  return <span className={cn(base, 'flex items-center justify-center text-xs font-medium uppercase')}>{(user.name || user.login || '?').charAt(0)}</span>;
};

// `crumb` is the current page's title after the logo (a webhook name, "Admin"), or empty on the webhook list.
const Navbar = ({ crumb, onHome, user, onOpenApiKeys, onOpenAdmin, onLogout }) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <Container className="flex h-14 items-center justify-between gap-3">
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5">
          <button type="button" onClick={onHome} className="flex shrink-0 items-center rounded-md p-0.5 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50" aria-label="All webhooks">
            <Logo textClassName={crumb ? 'hidden sm:inline' : undefined} />
          </button>
          {crumb && (
            <>
              <Slash />
              <span className="truncate text-sm font-medium" title={crumb}>
                {crumb}
              </span>
            </>
          )}
        </nav>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex shrink-0 items-center rounded-full outline-none transition-opacity hover:opacity-80 focus-visible:ring-[3px] focus-visible:ring-ring/50"
              aria-label="Account menu"
            >
              <UserAvatar user={user} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-60">
            <DropdownMenuLabel className="flex items-center gap-2.5 py-2 font-normal">
              <UserAvatar user={user} className="size-8" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-foreground">{user.name || user.login}</span>
                <span className="block truncate text-xs text-muted-foreground" title={user.email}>
                  {user.email}
                </span>
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onOpenApiKeys}>
              <KeyRound />
              API keys
            </DropdownMenuItem>
            {user.is_admin && (
              <DropdownMenuItem onSelect={onOpenAdmin}>
                <Shield />
                Admin
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onLogout}>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Container>
    </header>
  );
};

export { Navbar };
