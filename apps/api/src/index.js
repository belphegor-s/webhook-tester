import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { CORS_HEADERS, CORS_METHODS, corsOrigins } from './config.js';
import { errorResponse } from './lib/http.js';
import { authenticate } from './middleware/auth.js';
import health from './routes/health.js';
import auth from './routes/auth.js';
import keys from './routes/keys.js';
import stream from './routes/stream.js';
import admin from './routes/admin.js';
import webhooks from './routes/webhooks.js';
import requests from './routes/requests.js';
import stats from './routes/stats.js';
import ingest from './routes/ingest.js';

const app = new Hono();

app.use(
	'*',
	cors({ origin: (origin, c) => (corsOrigins(c.env).includes(origin) ? origin : null), allowMethods: CORS_METHODS, allowHeaders: CORS_HEADERS }),
);
// API responses carry per-user data and pass through the dashboard's proxy: never cache them.
app.use('/api/*', async (c, next) => {
	await next();
	if (!c.res.headers.has('Cache-Control')) c.res.headers.set('Cache-Control', 'no-store');
});
app.use('*', authenticate);

app.route('/health', health);
app.route('/api/auth', auth);
app.route('/api/keys', keys);
app.route('/api/stream', stream);
app.route('/api/admin', admin);
// Nested resources are registered before the generic /:endpoint and /:id handlers.
app.route('/api/webhooks/:endpoint/requests', requests);
app.route('/api/webhooks/:id/stats', stats);
app.route('/api/webhooks', webhooks);
app.route('/webhook', ingest);

app.notFound(() => errorResponse('Not found', 404));
app.onError((err) => {
	console.error('unhandled', err);
	return errorResponse('Internal server error', 500);
});

export { RealtimeHub } from './realtime/hub.js';
export default app;
