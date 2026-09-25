import { deleteCookie, getCookie } from 'hono/cookie';
import { API_KEY_PREFIX, SESSION_COOKIE, appUrl, isAdmin } from '../config.js';
import { sha256Hex } from '../lib/crypto.js';
import { errorResponse } from '../lib/http.js';
import { sessionCookieOptions } from '../lib/session.js';
import { findUserByApiKey, findUserBySession } from '../db/users.js';
import { touchApiKey } from '../db/apiKeys.js';

// Public routes: incoming webhook deliveries, the health check and the OAuth handshake.
const isPublic = (path) => /^\/webhook\/[^/]+/.test(path) || path === '/health' || path.startsWith('/api/auth/github/');

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// API keys are accepted as `x-api-key: whk_...` or `Authorization: Bearer whk_...`.
const readApiKey = (c) => {
	const header = c.req.header('x-api-key');
	if (header) return header.trim();
	const auth = c.req.header('Authorization') || '';
	const bearer = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
	return bearer.startsWith(API_KEY_PREFIX) ? bearer : null;
};

// CSRF guard for cookie-authenticated writes. SameSite=Lax already blocks cross-site cookies on POST;
// this additionally rejects cross-origin requests from sibling subdomains.
const isSameOrigin = (c) => {
	const origin = c.req.header('Origin');
	if (origin) return origin === new URL(appUrl(c.env)).origin;
	const site = c.req.header('Sec-Fetch-Site');
	return !site || site === 'same-origin' || site === 'none';
};

// Resolves the caller from an API key or a session cookie and stores it as c.get('user').
// c.get('authType') is 'api_key' or 'session'.
export const authenticate = async (c, next) => {
	if (isPublic(new URL(c.req.url).pathname)) return next();

	const { DB } = c.env;
	const apiKey = readApiKey(c);
	if (apiKey) {
		const user = await findUserByApiKey(DB, await sha256Hex(apiKey));
		if (!user) return errorResponse('Invalid API key', 401);

		const { api_key_id: apiKeyId, ...rest } = user;
		c.set('user', rest);
		c.set('authType', 'api_key');
		c.executionCtx.waitUntil(touchApiKey(DB, apiKeyId).catch((err) => console.error('touch api key', err)));
		return next();
	}

	const token = getCookie(c, SESSION_COOKIE);
	const user = token ? await findUserBySession(DB, await sha256Hex(token)) : null;
	if (!user) {
		if (token) deleteCookie(c, SESSION_COOKIE, sessionCookieOptions(c));
		return c.json({ error: 'Unauthorized' }, 401);
	}

	if (!SAFE_METHODS.has(c.req.method) && !isSameOrigin(c)) return errorResponse('Forbidden', 403);

	c.set('user', user);
	c.set('authType', 'session');
	return next();
};

// Admin endpoints need a dashboard session (never an API key) from an ADMIN_EMAILS account.
export const requireAdmin = async (c, next) => {
	if (c.get('authType') !== 'session' || !isAdmin(c.env, c.get('user'))) return errorResponse('Not found', 404);
	return next();
};

// Key management is dashboard-only so a leaked API key can't mint or revoke other keys.
export const requireSession = async (c, next) => {
	if (c.get('authType') !== 'session') return errorResponse('This endpoint requires a dashboard session', 403);
	return next();
};
