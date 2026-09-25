import { Hono } from 'hono';
import { errorResponse, jsonResponse } from '../lib/http.js';
import { parsePagination } from '../lib/pagination.js';
import { parseId } from '../lib/validate.js';
import { listStats } from '../db/stats.js';
import { findWebhookById } from '../db/webhooks.js';

// Mounted under /api/webhooks/:id/stats
const stats = new Hono();

stats.get('/', async (c) => {
	const id = parseId(c.req.param('id'));
	if (!id) return errorResponse('Invalid webhook id', 400);

	const days = Math.min(Math.max(parseInt(c.req.query('days') || '7', 10) || 7, 1), 365);
	try {
		const webhook = await findWebhookById(c.env.DB, c.get('user').id, id);
		if (!webhook) return errorResponse('Webhook not found', 404);

		const results = await listStats(c.env.DB, id, { days, ...parsePagination(c) });
		return jsonResponse(results);
	} catch (err) {
		console.error('list stats', err);
		return errorResponse('Failed to fetch webhook stats', 500);
	}
});

export default stats;
