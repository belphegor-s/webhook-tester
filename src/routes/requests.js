import { Hono } from 'hono';
import { errorResponse, jsonResponse } from '../lib/http.js';
import { paginated, parsePagination } from '../lib/pagination.js';
import { sanitizeRequest } from '../lib/sanitize.js';
import { findWebhookByEndpoint } from '../db/webhooks.js';
import { countRequests, listRequests } from '../db/requests.js';

// Mounted under /api/webhooks/:endpoint/requests
const requests = new Hono();

requests.get('/', async (c) => {
	const page = parsePagination(c);
	try {
		const webhook = await findWebhookByEndpoint(c.env.DB, c.req.param('endpoint'));
		if (!webhook) return errorResponse('Webhook not found', 404);

		const [total, rows] = await Promise.all([countRequests(c.env.DB, webhook.id), listRequests(c.env.DB, webhook.id, page)]);
		return jsonResponse(paginated(rows.map(sanitizeRequest), total, page));
	} catch (err) {
		console.error('list requests', err);
		return errorResponse('Failed to fetch webhook requests', 500);
	}
});

export default requests;
