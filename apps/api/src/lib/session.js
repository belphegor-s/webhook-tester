import { appUrl } from '../config.js';

// Cookies are first-party on the dashboard origin: the dashboard proxies /api/* to this worker
// (vercel.json rewrite in prod, Vite proxy in dev). Secure is dropped only for plain-http local dev.
export const sessionCookieOptions = (c) => ({
	path: '/',
	httpOnly: true,
	secure: appUrl(c.env).startsWith('https://'),
	sameSite: 'Lax',
});
