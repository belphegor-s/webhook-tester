// Auth is a first-party HttpOnly session cookie set by the API during GitHub OAuth.
// /api/* is proxied to the worker (vercel.json in prod, Vite dev server locally), so every call is same-origin.

const UNAUTHORIZED_EVENT = 'auth:unauthorized';
const LEGACY_TOKEN_KEY = 'wh_token';

// Starts GitHub OAuth; the API sends the browser back to `next` after a successful login.
export const loginUrl = (next = `${window.location.pathname}${window.location.search}`) => `/api/auth/github/login?next=${encodeURIComponent(next)}`;

// Removes the bearer token left behind by the old password login.
export const clearLegacyToken = () => {
  try {
    localStorage.removeItem(LEGACY_TOKEN_KEY);
  } catch {
    // Storage can be unavailable (private mode, blocked site data).
  }
};

// Returns the signed-in user, or null when there is no valid session.
export async function fetchCurrentUser() {
  const res = await fetch('/api/auth/me', { credentials: 'same-origin', headers: { Accept: 'application/json' } });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error('Failed to load session');
  const { user } = await res.json();
  return user ?? null;
}

export async function logout() {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
}

export const onUnauthorized = (handler) => {
  window.addEventListener(UNAUTHORIZED_EVENT, handler);
  return () => window.removeEventListener(UNAUTHORIZED_EVENT, handler);
};

export function authFetch(url, options = {}) {
  return fetch(url, { credentials: 'same-origin', ...options }).then((res) => {
    if (res.status === 401) window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    return res;
  });
}
