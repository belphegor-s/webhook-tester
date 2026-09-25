import { Hono } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { OAUTH_CALLBACK_PATH, OAUTH_STATE_COOKIE, OAUTH_STATE_TTL_SECONDS, SESSION_COOKIE, SESSION_TTL_SECONDS, appUrl } from '../config.js';
import { randomToken, sha256Hex, timingSafeCompare } from '../lib/crypto.js';
import { authorizeUrl, fetchProfile, revokeToken } from '../lib/github.js';
import { errorResponse } from '../lib/http.js';
import { sessionCookieOptions } from '../lib/session.js';
import { createSession, deleteExpiredSessions, deleteSession, upsertUser } from '../db/users.js';

// Mounted under /api/auth. /github/* is public; everything else runs behind `authenticate`.
const auth = new Hono();

const redirectUri = (env) => `${appUrl(env)}${OAUTH_CALLBACK_PATH}`;

const stateCookieOptions = (c) => ({ ...sessionCookieOptions(c), path: '/api/auth/github' });

// Where to land after login. Only same-origin relative paths are accepted (no open redirects).
const safeNext = (value) => {
	if (typeof value !== 'string' || value.length > 512 || !value.startsWith('/')) return '/';
	// "//host" and "/\host" are protocol-relative in browsers.
	return value[1] === '/' || value[1] === '\\' ? '/' : value;
};

auth.get('/github/login', (c) => {
	if (!c.env.GITHUB_CLIENT_ID || !c.env.GITHUB_CLIENT_SECRET) return errorResponse('Server misconfiguration', 500);

	const state = randomToken(16);
	const next = safeNext(c.req.query('next'));
	// The state cookie also carries the post-login path: `<state>.<encoded next>`.
	setCookie(c, OAUTH_STATE_COOKIE, `${state}.${encodeURIComponent(next)}`, { ...stateCookieOptions(c), maxAge: OAUTH_STATE_TTL_SECONDS });
	c.header('Cache-Control', 'no-store');
	return c.redirect(authorizeUrl({ clientId: c.env.GITHUB_CLIENT_ID, redirectUri: redirectUri(c.env), state }), 302);
});

auth.get('/github/callback', async (c) => {
	const { DB } = c.env;
	const home = appUrl(c.env);
	// base64url state never contains '.', so the first dot separates it from the encoded path.
	const stateCookie = getCookie(c, OAUTH_STATE_COOKIE) || '';
	const dot = stateCookie.indexOf('.');
	const expectedState = dot === -1 ? stateCookie : stateCookie.slice(0, dot);
	const encodedNext = dot === -1 ? '' : stateCookie.slice(dot + 1);
	deleteCookie(c, OAUTH_STATE_COOKIE, stateCookieOptions(c));
	c.header('Cache-Control', 'no-store');

	// Failures land back on the dashboard, which renders a message for `auth_error`.
	const fail = (reason) => c.redirect(`${home}/?auth_error=${reason}`, 302);

	const { code, state, error } = c.req.query();
	if (error) return fail('access_denied');
	if (!code || !state || !expectedState || !timingSafeCompare(state, expectedState)) return fail('invalid_state');

	let profile;
	try {
		const result = await fetchProfile(c.env, code, redirectUri(c.env));
		profile = result.profile;
		c.executionCtx.waitUntil(revokeToken(c.env, result.token));
	} catch (err) {
		console.error('github oauth', err);
		return fail('github_error');
	}

	if (!profile.email) return fail('unverified_email');

	try {
		const user = await upsertUser(DB, profile);
		const token = randomToken();
		await createSession(DB, {
			userId: user.id,
			tokenHash: await sha256Hex(token),
			ttlSeconds: SESSION_TTL_SECONDS,
			userAgent: (c.req.header('User-Agent') || '').slice(0, 512) || null,
			ip: c.req.header('CF-Connecting-IP') || null,
		});
		c.executionCtx.waitUntil(deleteExpiredSessions(DB, user.id).catch((err) => console.error('prune sessions', err)));

		setCookie(c, SESSION_COOKIE, token, { ...sessionCookieOptions(c), maxAge: SESSION_TTL_SECONDS });
		let next = '/';
		try {
			next = safeNext(decodeURIComponent(encodedNext));
		} catch {
			// Malformed cookie: fall back to the dashboard root.
		}
		return c.redirect(`${home}${next}`, 302);
	} catch (err) {
		console.error('create session', err);
		return fail('server_error');
	}
});

auth.get('/me', (c) => c.json({ user: c.get('user'), auth_type: c.get('authType') }));

auth.post('/logout', async (c) => {
	const token = getCookie(c, SESSION_COOKIE);
	if (token) {
		try {
			await deleteSession(c.env.DB, await sha256Hex(token));
		} catch (err) {
			console.error('logout', err);
			return errorResponse('Failed to log out', 500);
		}
	}
	deleteCookie(c, SESSION_COOKIE, sessionCookieOptions(c));
	return c.json({ message: 'Logged out' });
});

export default auth;
