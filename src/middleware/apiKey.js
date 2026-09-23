import { errorResponse } from '../lib/http.js';

// Public routes: incoming webhook deliveries and the health check.
const isPublic = (path) => /^\/webhook\/[^/]+/.test(path) || path === '/health';

const timingSafeCompare = (provided, expected) => {
	const encoder = new TextEncoder();
	const providedBytes = encoder.encode(provided);
	const expectedBytes = encoder.encode(expected);

	// Compare lengths without short-circuit, then content via timingSafeEqual
	const lengthMatch = providedBytes.length === expectedBytes.length;
	const maxLen = Math.max(providedBytes.length, expectedBytes.length);
	const a = new Uint8Array(maxLen);
	const b = new Uint8Array(maxLen);
	a.set(providedBytes);
	b.set(expectedBytes);

	return crypto.subtle.timingSafeEqual(a, b) && lengthMatch;
};

export const apiKeyAuth = async (c, next) => {
	if (isPublic(new URL(c.req.url).pathname)) return next();

	const apiKey = c.env.API_KEY;
	if (!apiKey) return errorResponse('Server misconfiguration', 500);

	if (!timingSafeCompare(c.req.header('x-api-key') || '', apiKey)) {
		return errorResponse('Unauthorized', 401);
	}

	return next();
};
