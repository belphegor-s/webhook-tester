import { Hono } from 'hono';
import { errorResponse, jsonResponse, readJson } from '../lib/http.js';
import { paginated, parsePagination } from '../lib/pagination.js';
import { parseId, validateCreate, validateUpdate } from '../lib/validate.js';
import { generateEndpoint } from '../lib/endpoint.js';
import { sanitizeWebhook } from '../lib/sanitize.js';
import { publish } from '../lib/realtime.js';
import { countWebhooks, deleteWebhook, findUserWebhookByEndpoint, insertWebhook, listWebhooks, updateWebhook } from '../db/webhooks.js';

// Mounted under /api/webhooks
const webhooks = new Hono();

webhooks.get('/', async (c) => {
	const page = parsePagination(c);
	const userId = c.get('user').id;
	try {
		const [total, rows] = await Promise.all([countWebhooks(c.env.DB, userId), listWebhooks(c.env.DB, userId, page)]);
		return jsonResponse(paginated(rows.map(sanitizeWebhook), total, page));
	} catch (err) {
		console.error('list webhooks', err);
		return errorResponse('Failed to fetch webhooks', 500);
	}
});

webhooks.post('/', async (c) => {
	const body = await readJson(c);
	if (!body) return errorResponse('Invalid request data', 400);

	const { fields, errors } = validateCreate(body);
	if (errors.length) return errorResponse(errors[0], 400);

	try {
		const webhook = await insertWebhook(c.env.DB, c.get('user').id, { ...fields, endpoint: generateEndpoint() });
		publish(c, webhook.user_id, { type: 'webhook.created', webhook_id: webhook.id, endpoint: webhook.endpoint });
		return jsonResponse(sanitizeWebhook(webhook), 201);
	} catch (err) {
		console.error('create webhook', err);
		return errorResponse('Failed to create webhook', 500);
	}
});

webhooks.get('/:endpoint', async (c) => {
	try {
		const webhook = await findUserWebhookByEndpoint(c.env.DB, c.get('user').id, c.req.param('endpoint'));
		if (!webhook) return errorResponse('Webhook not found', 404);
		return jsonResponse(sanitizeWebhook(webhook));
	} catch (err) {
		console.error('get webhook', err);
		return errorResponse('Failed to fetch webhook', 500);
	}
});

// Partial update of name, description, secret and/or is_active. PUT is kept as an alias for older callers.
const update = async (c) => {
	const id = parseId(c.req.param('id'));
	if (!id) return errorResponse('Invalid webhook id', 400);

	const body = await readJson(c);
	if (!body) return errorResponse('Invalid request data', 400);

	const { fields, errors } = validateUpdate(body);
	if (errors.length) return errorResponse(errors[0], 400);

	try {
		const webhook = await updateWebhook(c.env.DB, c.get('user').id, id, fields);
		if (!webhook) return errorResponse('Webhook not found', 404);
		publish(c, webhook.user_id, { type: 'webhook.updated', webhook_id: webhook.id, endpoint: webhook.endpoint });
		return jsonResponse(sanitizeWebhook(webhook));
	} catch (err) {
		console.error('update webhook', err);
		return errorResponse('Failed to update webhook', 500);
	}
};

webhooks.patch('/:id', update);
webhooks.put('/:id', update);

webhooks.delete('/:id', async (c) => {
	const id = parseId(c.req.param('id'));
	if (!id) return errorResponse('Invalid webhook id', 400);

	try {
		const deleted = await deleteWebhook(c.env.DB, c.get('user').id, id);
		if (deleted) publish(c, c.get('user').id, { type: 'webhook.deleted', webhook_id: id });
		return deleted ? jsonResponse({ message: 'Webhook deleted successfully' }) : errorResponse('Webhook not found', 404);
	} catch (err) {
		console.error('delete webhook', err);
		return errorResponse('Failed to delete webhook', 500);
	}
});

export default webhooks;
