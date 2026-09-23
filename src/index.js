import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { CORS_HEADERS, CORS_METHODS, CORS_ORIGINS } from './config.js';
import { errorResponse } from './lib/http.js';
import { apiKeyAuth } from './middleware/apiKey.js';
import health from './routes/health.js';
import webhooks from './routes/webhooks.js';
import requests from './routes/requests.js';
import stats from './routes/stats.js';
import ingest from './routes/ingest.js';

const app = new Hono();

app.use('*', cors({ origin: CORS_ORIGINS, allowMethods: CORS_METHODS, allowHeaders: CORS_HEADERS }));
app.use('*', apiKeyAuth);

app.route('/health', health);
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

export default app;
