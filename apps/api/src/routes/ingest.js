import { Hono } from 'hono';
import { appUrl } from '../config.js';
import { errorResponse, jsonResponse } from '../lib/http.js';
import { findWebhookByEndpoint } from '../db/webhooks.js';
import { insertRequest } from '../db/requests.js';
import { recordSuccess } from '../db/stats.js';
import { publish } from '../lib/realtime.js';

// Public delivery endpoint, mounted under /webhook
const ingest = new Hono();

ingest.all('/:endpoint', async (c) => {
	const { DB } = c.env;
	const endpoint = c.req.param('endpoint');
	const method = c.req.method;

	// Opening the URL in a browser jumps to the dashboard for this webhook.
	if (method === 'GET') {
		return Response.redirect(`${appUrl(c.env)}/?webhook_endpoint=${encodeURIComponent(endpoint)}`, 302);
	}

	try {
		const webhook = await findWebhookByEndpoint(DB, endpoint);
		if (!webhook) return errorResponse('Webhook not found', 404);
		if (!webhook.is_active) return errorResponse('Webhook is inactive', 403);

		if (webhook.secret) {
			const authHeader = c.req.header('Authorization') || '';
			if (!authHeader.includes(webhook.secret)) return errorResponse('Unauthorized', 401);
		}

		const body = await c.req.text();
		const responseTime = Date.now() - c.executionCtx.timestamp;

		const requestId = await insertRequest(DB, {
			webhookId: webhook.id,
			method,
			headers: Object.fromEntries(c.req.raw.headers),
			body,
			query: Object.fromEntries(new URL(c.req.url).searchParams),
			ip: c.req.header('CF-Connecting-IP') || 'unknown',
			userAgent: c.req.header('User-Agent') || 'unknown',
			responseTime,
		});
		await recordSuccess(DB, webhook.id, new Date().toISOString().split('T')[0]);
		publish(c, webhook.user_id, { type: 'request', webhook_id: webhook.id, endpoint: webhook.endpoint, request_id: requestId });

		return jsonResponse({
			message: 'Webhook received successfully',
			webhook: webhook.name,
			timestamp: new Date().toISOString(),
		});
	} catch (err) {
		console.error('ingest', err);
		return errorResponse('Failed to process webhook', 500);
	}
});

export default ingest;
