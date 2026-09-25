import { useState } from 'react';
import { cn } from '../../lib/utils';

const number = new Intl.NumberFormat();
const dayLabel = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });
const fullDay = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });

const toDate = (iso) => new Date(`${iso}T00:00:00Z`);

// Rounds the axis maximum up to 1, 2 or 5 × 10^n so the single gridline carries a clean label.
const niceMax = (value) => {
  if (value <= 0) return 1;
  const exp = 10 ** Math.floor(Math.log10(value));
  return [1, 2, 5, 10].map((m) => m * exp).find((n) => n >= value);
};

// Single-series daily bar chart. Days are UTC, matching the API's webhook_stats.
export function RequestsChart({ data }) {
  const [hovered, setHovered] = useState(null);
  const max = niceMax(Math.max(0, ...data.map((d) => d.requests)));
  const total = data.reduce((sum, d) => sum + d.requests, 0);
  const active = hovered === null ? null : data[hovered];
  const mid = Math.floor((data.length - 1) / 2);
  // Edge tooltips anchor to their side so they never spill past the card.
  const align = hovered === null ? '' : hovered <= 1 ? '-translate-x-[15%]' : hovered >= data.length - 2 ? '-translate-x-[85%]' : '-translate-x-1/2';

  return (
    <figure className="space-y-3">
      <div className="relative h-40 pl-10" onMouseLeave={() => setHovered(null)}>
        {/* Recessive gridlines: the top one is labeled, the baseline anchors the bars. */}
        <div className="pointer-events-none absolute inset-y-0 right-0 left-10" aria-hidden="true">
          <div className="absolute inset-x-0 top-0 border-t border-dashed border-border" />
          <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-border/60" />
          <div className="absolute inset-x-0 bottom-0 border-t border-border" />
        </div>
        <span className="absolute top-0 left-0 w-8 -translate-y-1/2 text-right text-[11px] text-muted-foreground tabular-nums" aria-hidden="true">
          {number.format(max)}
        </span>
        <span className="absolute bottom-0 left-0 w-8 translate-y-1/2 text-right text-[11px] text-muted-foreground tabular-nums" aria-hidden="true">
          0
        </span>

        <div className="relative flex h-full items-end gap-0.5" role="img" aria-label={`Requests per day over the last ${data.length} days, ${number.format(total)} in total.`}>
          {data.map((d, i) => (
            // The whole column is the hover target, so zero and tiny days are still easy to inspect.
            <div key={d.date} className="flex h-full flex-1 items-end" onMouseEnter={() => setHovered(i)}>
              <div
                className={cn('w-full rounded-t-[4px] transition-colors', d.requests > 0 ? 'min-h-0.5' : 'h-0', hovered === i ? 'bg-primary' : 'bg-primary/75')}
                style={d.requests > 0 ? { height: `${(d.requests / max) * 100}%` } : undefined}
              />
            </div>
          ))}
        </div>

        {active && (
          <div
            className={cn('pointer-events-none absolute -top-2 z-10 -translate-y-full', align, 'rounded-md border bg-popover px-2.5 py-1.5 text-xs whitespace-nowrap text-popover-foreground shadow-md')}
            style={{ left: `calc(2.5rem + (100% - 2.5rem) * ${(hovered + 0.5) / data.length})` }}
          >
            <p className="text-muted-foreground">{fullDay.format(toDate(active.date))}</p>
            <p className="font-medium tabular-nums">
              {number.format(active.requests)} {active.requests === 1 ? 'request' : 'requests'}
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-between pl-10 text-[11px] text-muted-foreground" aria-hidden="true">
        <span>{dayLabel.format(toDate(data[0].date))}</span>
        <span>{dayLabel.format(toDate(data[mid].date))}</span>
        <span>{dayLabel.format(toDate(data[data.length - 1].date))}</span>
      </div>

      <table className="sr-only">
        <caption>Requests per day (UTC)</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Requests</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.date}>
              <td>{fullDay.format(toDate(d.date))}</td>
              <td>{d.requests}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
