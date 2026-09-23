export const countRequests = async (DB, webhookId) => {
	const row = await DB.prepare(`SELECT COUNT(*) AS total FROM webhook_requests WHERE webhook_id = ?`).bind(webhookId).first();
	return row?.total ?? 0;
};

export const listRequests = async (DB, webhookId, { limit, offset }) => {
	const { results } = await DB.prepare(
		`
		SELECT * FROM webhook_requests
		WHERE webhook_id = ?
		ORDER BY created_at DESC
		LIMIT ? OFFSET ?
		`,
	)
		.bind(webhookId, limit, offset)
		.all();
	return results;
};

export const insertRequest = (DB, { webhookId, method, headers, body, query, ip, userAgent, responseTime }) =>
	DB.prepare(
		`
		INSERT INTO webhook_requests (webhook_id, method, headers, body, query_params, ip_address, user_agent, response_time)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
		`,
	)
		.bind(webhookId, method, JSON.stringify(headers), body, JSON.stringify(query), ip, userAgent, responseTime)
		.run();
