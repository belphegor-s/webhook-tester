// Routing to the per-user RealtimeHub Durable Object.
export const userHub = (env, userId) => env.REALTIME.get(env.REALTIME.idFromName(`user:${userId}`));

// Fire-and-forget: publishing must never delay or fail the request that triggered it.
// Webhooks without an owner (created before accounts) have nobody to notify.
export const publish = (c, userId, event) => {
	if (!userId || !c.env.REALTIME) return;
	c.executionCtx.waitUntil(
		userHub(c.env, userId)
			.publish({ ...event, at: new Date().toISOString() })
			.catch((err) => console.error('realtime publish', err)),
	);
};
