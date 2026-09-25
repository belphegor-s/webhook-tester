// The API returns SQLite CURRENT_TIMESTAMP values ("YYYY-MM-DD HH:MM:SS"), which are UTC but carry no zone;
// browsers would parse them as local time. Anything else is passed to Date as-is.
const SQLITE_DATETIME = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

export const parseDate = (value) => new Date(typeof value === 'string' && SQLITE_DATETIME.test(value) ? `${value.replace(' ', 'T')}Z` : value);
