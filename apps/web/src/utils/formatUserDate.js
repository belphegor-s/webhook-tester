import { parseDate } from './parseDate';

export const formatUserDate = (dateString) => {
  if (!dateString) return '-';
  const d = parseDate(dateString);
  if (isNaN(d)) return dateString;

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const formatter = new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: tz,
    timeZoneName: 'short',
  });

  return formatter.format(d);
};
