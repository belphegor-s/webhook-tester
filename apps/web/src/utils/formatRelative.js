import { parseDate } from './parseDate';

const UNITS = [
  ['year', 60 * 60 * 24 * 365],
  ['month', 60 * 60 * 24 * 30],
  ['week', 60 * 60 * 24 * 7],
  ['day', 60 * 60 * 24],
  ['hour', 60 * 60],
  ['minute', 60],
];

const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto', style: 'short' });

// "3m ago", "yesterday", "2 wk. ago"; falls back to '-' for missing/invalid dates.
export const formatRelative = (dateString, now = Date.now()) => {
  if (!dateString) return '-';
  const d = parseDate(dateString);
  if (isNaN(d)) return String(dateString);

  const diff = (d.getTime() - now) / 1000;
  for (const [unit, seconds] of UNITS) {
    if (Math.abs(diff) >= seconds) return rtf.format(Math.round(diff / seconds), unit);
  }
  return 'just now';
};
