import { DurableObject } from 'cloudflare:workers';
import { MAX_STREAMS_PER_USER, STREAM_HEARTBEAT_MS, STREAM_MAX_AGE_MS } from '../config.js';

const encoder = new TextEncoder();

const frame = (type, data) => encoder.encode(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);

// One instance per user (see lib/realtime.js). Holds that user's open SSE streams in memory and fans out
// events published by ingest and the webhook routes. Nothing is persisted: a client that reconnects resyncs
// from the REST API, so losing in-memory streams on eviction only costs a reconnect.
export class RealtimeHub extends DurableObject {
	constructor(ctx, env) {
		super(ctx, env);
		this.clients = new Set();
		this.heartbeat = null;
	}

	// Any request opens an SSE stream. Served over fetch so the caller's abort signal is forwarded; where the
	// runtime reports the disconnect, the next write fails and the client is dropped.
	fetch() {
		// At the cap, evict the oldest stream rather than refusing: disconnects aren't guaranteed to be reported,
		// so the oldest entries are the likeliest to be dead, and a live one simply reconnects.
		if (this.clients.size >= MAX_STREAMS_PER_USER) this.#drop(this.clients.values().next().value, { graceful: true });

		const { readable, writable } = new TransformStream();
		const client = { writer: writable.getWriter(), openedAt: Date.now(), inflight: 0 };
		this.clients.add(client);

		// `retry` sets the browser's reconnect delay; `ready` confirms the stream is flowing end to end.
		this.#write(client, encoder.encode('retry: 3000\n\n'));
		this.#write(client, frame('ready', { at: new Date().toISOString() }));
		this.#startHeartbeat();
		return new Response(readable, { headers: { 'Content-Type': 'text/event-stream; charset=utf-8' } });
	}

	publish(event) {
		if (this.clients.size === 0) return 0;
		const bytes = frame(event.type, event);
		for (const client of this.clients) this.#write(client, bytes);
		return this.clients.size;
	}

	// A failed write means the client went away. A disconnect is not always surfaced as an error across the
	// RPC boundary, though: writes to a dead stream can simply never flush, which the heartbeat checks for.
	#write(client, bytes) {
		client.inflight++;
		client.writer.write(bytes).then(
			() => client.inflight--,
			() => this.#drop(client),
		);
	}

	#drop(client, { graceful = false } = {}) {
		if (!this.clients.delete(client)) return;
		(graceful ? client.writer.close() : client.writer.abort()).catch(() => {});
		if (this.clients.size === 0 && this.heartbeat) {
			clearInterval(this.heartbeat);
			this.heartbeat = null;
		}
	}

	// Pings keep proxies from idling the connection out and let clients detect a silently dead stream.
	#startHeartbeat() {
		if (this.heartbeat) return;
		this.heartbeat = setInterval(() => {
			const now = Date.now();
			const bytes = frame('ping', { at: new Date(now).toISOString() });
			for (const client of this.clients) {
				// A live reader drains every frame within milliseconds; anything still queued a full interval later is gone.
				if (client.inflight > 0) this.#drop(client);
				// Recycle long-lived streams; EventSource reconnects on its own and the client resyncs.
				else if (now - client.openedAt > STREAM_MAX_AGE_MS) this.#drop(client, { graceful: true });
				else this.#write(client, bytes);
			}
		}, STREAM_HEARTBEAT_MS);
	}
}
