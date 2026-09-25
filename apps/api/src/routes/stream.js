import { Hono } from 'hono';
import { errorResponse } from '../lib/http.js';
import { userHub } from '../lib/realtime.js';

// Mounted under /api/stream. Server-Sent Events for the caller's account:
//   ready    stream is live
//   ping     heartbeat
//   request  a webhook received a request       { webhook_id, endpoint, request_id }
//   webhook.created | webhook.updated | webhook.deleted   { webhook_id, endpoint }
const stream = new Hono();

stream.get('/', async (c) => {
	try {
		const upstream = await userHub(c.env, c.get('user').id).fetch('https://realtime/subscribe', { signal: c.req.raw.signal });
		if (!upstream.ok) throw new Error(`hub responded ${upstream.status}`);

		return new Response(upstream.body, {
			headers: {
				'Content-Type': 'text/event-stream; charset=utf-8',
				// no-transform stops intermediaries from compressing (and so buffering) the stream.
				'Cache-Control': 'no-store, no-transform',
				'X-Accel-Buffering': 'no',
			},
		});
	} catch (err) {
		console.error('open stream', err);
		return errorResponse('Failed to open stream', 500);
	}
});

export default stream;
