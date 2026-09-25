// Pretty-prints a request field that may arrive as an object, a JSON string, or plain text.
export const formatPayload = (value) => {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return String(value);
  }
};

export const isEmptyPayload = (formatted) => !formatted || formatted === '{}' || formatted === '[]' || formatted === 'null';
