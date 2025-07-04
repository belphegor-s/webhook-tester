import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

app.use(
	'*',
	cors({
		origin: '*',
		allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
		allowHeaders: ['Content-Type', 'Authorization'],
	})
);

const jsonResponse = (data, status = 200) =>
	new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});

const generateEndpoint = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

app.get('/favicon.ico', (c) => c.body(null, 404));

app.get('/api/webhooks', async (c) => {
	const { DB } = c.env;
	try {
		const { results } = await DB.prepare(
			`
			SELECT w.*, COUNT(wr.id) as total_requests, MAX(wr.created_at) as last_request
			FROM webhooks w
			LEFT JOIN webhook_requests wr ON w.id = wr.webhook_id
			GROUP BY w.id
			ORDER BY w.created_at DESC
		`
		).all();
		return jsonResponse(results);
	} catch {
		return jsonResponse({ error: 'Failed to fetch webhooks' }, 500);
	}
});

app.post('/api/webhooks', async (c) => {
	const { DB } = c.env;
	try {
		const { name, description, secret } = await c.req.json();

		if (!name || typeof name !== 'string') {
			return jsonResponse({ error: 'Webhook name is required' }, 400);
		}

		const endpoint = generateEndpoint();

		const { success } = await DB.prepare(
			`
			INSERT INTO webhooks (name, endpoint, description, secret)
			VALUES (?, ?, ?, ?)
		`
		)
			.bind(name, endpoint, description, secret)
			.run();

		if (!success) return jsonResponse({ error: 'Failed to create webhook' }, 500);

		const webhook = await DB.prepare(
			`
			SELECT * FROM webhooks WHERE endpoint = ?
		`
		)
			.bind(endpoint)
			.first();

		return jsonResponse(webhook, 201);
	} catch {
		return jsonResponse({ error: 'Invalid request data' }, 400);
	}
});

app.get('/api/webhooks/:id', async (c) => {
	const { DB } = c.env;
	const id = c.req.param('id');
	try {
		const webhook = await DB.prepare(
			`
			SELECT * FROM webhooks WHERE id = ?
		`
		)
			.bind(id)
			.first();

		if (!webhook) return jsonResponse({ error: 'Webhook not found' }, 404);
		return jsonResponse(webhook);
	} catch {
		return jsonResponse({ error: 'Failed to fetch webhook' }, 500);
	}
});

app.put('/api/webhooks/:id', async (c) => {
	const { DB } = c.env;
	const id = c.req.param('id');
	try {
		const { name, description, secret, is_active } = await c.req.json();

		const { success } = await DB.prepare(
			`
			UPDATE webhooks 
			SET name = ?, description = ?, secret = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
			WHERE id = ?
		`
		)
			.bind(name, description, secret, is_active, id)
			.run();

		if (!success) return jsonResponse({ error: 'Webhook not found' }, 404);

		const webhook = await DB.prepare(
			`
			SELECT * FROM webhooks WHERE id = ?
		`
		)
			.bind(id)
			.first();

		return jsonResponse(webhook);
	} catch {
		return jsonResponse({ error: 'Failed to update webhook' }, 500);
	}
});

app.delete('/api/webhooks/:id', async (c) => {
	const { DB } = c.env;
	const id = c.req.param('id');
	try {
		const { success } = await DB.prepare(
			`
			DELETE FROM webhooks WHERE id = ?
		`
		)
			.bind(id)
			.run();

		return success ? jsonResponse({ message: 'Webhook deleted successfully' }) : jsonResponse({ error: 'Webhook not found' }, 404);
	} catch (e) {
		console.error(e);
		return jsonResponse({ error: 'Failed to delete webhook' }, 500);
	}
});

app.get('/api/webhooks/:id/requests', async (c) => {
	const { DB } = c.env;
	const id = c.req.param('id');
	const limit = parseInt(c.req.query('limit') || '50');
	const offset = parseInt(c.req.query('offset') || '0');
	try {
		const { results } = await DB.prepare(
			`
			SELECT * FROM webhook_requests 
			WHERE webhook_id = ? 
			ORDER BY created_at DESC 
			LIMIT ? OFFSET ?
		`
		)
			.bind(id, limit, offset)
			.all();

		return jsonResponse(results);
	} catch {
		return jsonResponse({ error: 'Failed to fetch webhook requests' }, 500);
	}
});

app.get('/api/webhooks/:id/stats', async (c) => {
	const { DB } = c.env;
	const id = c.req.param('id');
	const days = parseInt(c.req.query('days') || '7');
	try {
		const { results } = await DB.prepare(
			`
			SELECT * FROM webhook_stats 
			WHERE webhook_id = ? 
			AND date >= date('now', '-${days} days')
			ORDER BY date DESC
		`
		)
			.bind(id)
			.all();

		return jsonResponse(results);
	} catch {
		return jsonResponse({ error: 'Failed to fetch webhook stats' }, 500);
	}
});

app.all('/webhook/:endpoint', async (c) => {
	const { DB } = c.env;
	const endpoint = c.req.param('endpoint');
	try {
		const webhook = await DB.prepare(
			`
			SELECT * FROM webhooks WHERE endpoint = ? AND is_active = TRUE
		`
		)
			.bind(endpoint)
			.first();

		if (!webhook) return jsonResponse({ error: 'Webhook not found' }, 404);

		if (webhook.secret) {
			const authHeader = c.req.header('Authorization') || '';
			if (!authHeader.includes(webhook.secret)) return jsonResponse({ error: 'Unauthorized' }, 401);
		}

		const method = c.req.method;
		const headers = Object.fromEntries(c.req.raw.headers);
		const body = method !== 'GET' ? await c.req.text() : null;
		const query = Object.fromEntries(new URL(c.req.url).searchParams);
		const ip = c.req.header('CF-Connecting-IP') || 'unknown';
		const ua = c.req.header('User-Agent') || 'unknown';
		const responseTime = Date.now() - c.executionCtx.timestamp;
		const today = new Date().toISOString().split('T')[0];

		await DB.prepare(
			`
			INSERT INTO webhook_requests (webhook_id, method, headers, body, query_params, ip_address, user_agent, response_time)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?)
		`
		)
			.bind(webhook.id, method, JSON.stringify(headers), body, JSON.stringify(query), ip, ua, responseTime)
			.run();

		await DB.prepare(
			`
			INSERT INTO webhook_stats (webhook_id, date, total_requests, success_requests)
			VALUES (?, ?, 1, 1)
			ON CONFLICT(webhook_id, date) DO UPDATE SET
				total_requests = total_requests + 1,
				success_requests = success_requests + 1
		`
		)
			.bind(webhook.id, today)
			.run();

		return jsonResponse({
			message: 'Webhook received successfully',
			webhook: webhook.name,
			timestamp: new Date().toISOString(),
		});
	} catch {
		return jsonResponse({ error: 'Failed to process webhook' }, 500);
	}
});

app.notFound(() => jsonResponse({ error: 'Not found' }, 404));

export default app;
