import { useEffect, useState } from 'react';
import { RotateCcw, Search, Users } from 'lucide-react';
import { useAdminOverview, useAdminUsers } from '../../hooks/useAdmin';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Skeleton } from '../ui/Skeleton';
import { Pagination } from '../ui/Pagination';
import { RequestsChart } from './RequestsChart';
import { formatRelative } from '../../utils/formatRelative';
import { formatUserDate } from '../../utils/formatUserDate';
import { cn } from '../../lib/utils';

const number = new Intl.NumberFormat();
const compact = new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 });

const StatTile = ({ label, value, hint }) => (
  <div className="rounded-xl border bg-card p-4 shadow-xs">
    <p className="text-xs font-medium text-muted-foreground">{label}</p>
    <p className="mt-1.5 text-2xl font-semibold tracking-tight tabular-nums" title={value === undefined ? undefined : number.format(value)}>
      {value === undefined ? <Skeleton className="h-7 w-16" /> : compact.format(value)}
    </p>
    <p className="mt-1 min-h-4 text-xs text-muted-foreground">{hint}</p>
  </div>
);

const Avatar = ({ user }) =>
  user.avatar_url ? (
    <img src={user.avatar_url} alt="" referrerPolicy="no-referrer" className="size-8 shrink-0 rounded-full border bg-muted" />
  ) : (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full border bg-muted text-xs font-medium uppercase">{(user.name || user.login).charAt(0)}</span>
  );

const RelativeTime = ({ value, empty = 'Never' }) =>
  value ? (
    <time dateTime={value} title={formatUserDate(value)}>
      {formatRelative(value)}
    </time>
  ) : (
    <span className="text-muted-foreground/70">{empty}</span>
  );

// Debounces the search box so each keystroke doesn't hit the API.
const useDebounced = (value, delay) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

export function AdminView({ currentUserId }) {
  const [query, setQuery] = useState('');
  const search = useDebounced(query.trim(), 300);
  const { overview, error: overviewError, loading: overviewLoading, refresh: refreshOverview } = useAdminOverview();
  const { users, total, totalPages, page, setPage, loading: usersLoading, error: usersError, refresh: refreshUsers } = useAdminUsers(search);
  const t = overview?.totals;

  const refreshing = overviewLoading || usersLoading;

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Admin</h1>
          <p className="mt-1 text-sm text-muted-foreground">Usage across every account.</p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            refreshOverview();
            refreshUsers();
          }}
          disabled={refreshing}
          aria-label="Refresh"
          title="Refresh"
        >
          <RotateCcw className={cn(refreshing && 'animate-spin [animation-direction:reverse]')} />
        </Button>
      </div>

      {overviewError && (
        <p role="alert" className="text-sm text-destructive">
          {overviewError}
        </p>
      )}

      <section aria-label="Totals" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <StatTile label="Users" value={t?.users} hint={t && (t.new_users_7d ? `${number.format(t.new_users_7d)} new this week` : 'None new this week')} />
        <StatTile label="Webhooks" value={t?.webhooks} hint={t?.unowned_webhooks ? `${number.format(t.unowned_webhooks)} without an owner` : null} />
        <StatTile label="Requests" value={t?.requests} hint="All time" />
        <StatTile label="Requests, 24h" value={t?.requests_24h} hint="Rolling window" />
        <StatTile label="API keys" value={t?.api_keys} />
        <StatTile label="Active sessions" value={t?.active_sessions} hint="Signed-in browsers" />
      </section>

      <section className="rounded-xl border bg-card p-4 shadow-xs sm:p-5">
        <div className="mb-5 flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-medium">Requests per day</h2>
          <p className="text-xs text-muted-foreground">Last 14 days, UTC</p>
        </div>
        {overview ? <RequestsChart data={overview.daily} /> : <Skeleton className="h-48 w-full" />}
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold tracking-tight">
            Users {!usersLoading && <span className="text-sm font-normal text-muted-foreground tabular-nums">({number.format(total)})</span>}
          </h2>
          <div className="relative sm:w-72">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search login or email" aria-label="Search users" className="pl-9" />
          </div>
        </div>

        {usersError && (
          <p role="alert" className="text-sm text-destructive">
            {usersError}
          </p>
        )}

        <div className="overflow-x-auto rounded-xl border bg-card shadow-xs">
          <table className="w-full text-sm">
            <thead className="border-b bg-subtle text-left text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  User
                </th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">
                  Webhooks
                </th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">
                  Requests
                </th>
                <th scope="col" className="hidden px-4 py-2.5 font-medium md:table-cell">
                  Last request
                </th>
                <th scope="col" className="hidden px-4 py-2.5 text-right font-medium lg:table-cell">
                  API keys
                </th>
                <th scope="col" className="hidden px-4 py-2.5 font-medium sm:table-cell">
                  Joined
                </th>
                <th scope="col" className="hidden px-4 py-2.5 font-medium lg:table-cell">
                  Last login
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {usersLoading && users.length === 0 ? (
                Array.from({ length: 3 }, (_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-4 py-3">
                      <Skeleton className="h-8 w-full" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    <Users className="mx-auto mb-2 size-5" />
                    {search ? 'No users match that search.' : 'No users yet.'}
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className={cn('transition-opacity', usersLoading && 'opacity-60')}>
                    <td className="px-4 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar user={u} />
                        <div className="min-w-0">
                          <p className="flex items-center gap-1.5 truncate font-medium">
                            <a href={`https://github.com/${u.login}`} target="_blank" rel="noreferrer" className="truncate hover:underline">
                              {u.name || u.login}
                            </a>
                            {u.id === currentUserId && <span className="shrink-0 rounded border px-1 text-[10px] font-medium text-muted-foreground">You</span>}
                          </p>
                          <p className="truncate text-xs text-muted-foreground" title={u.email}>
                            {u.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{number.format(u.webhooks)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{number.format(u.requests)}</td>
                    <td className="hidden px-4 py-3 whitespace-nowrap text-muted-foreground md:table-cell">
                      <RelativeTime value={u.last_request} />
                    </td>
                    <td className="hidden px-4 py-3 text-right tabular-nums lg:table-cell">{number.format(u.api_keys)}</td>
                    <td className="hidden px-4 py-3 whitespace-nowrap text-muted-foreground sm:table-cell">
                      <RelativeTime value={u.created_at} />
                    </td>
                    <td className="hidden px-4 py-3 whitespace-nowrap text-muted-foreground lg:table-cell">
                      <RelativeTime value={u.last_login_at} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </section>
    </div>
  );
}
