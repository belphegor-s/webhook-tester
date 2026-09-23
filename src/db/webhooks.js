export const countWebhooks = async (DB) => {
	const row = await DB.prepare(`SELECT COUNT(*) AS total FROM webhooks`).first();
	return row?.total ?? 0;
};

export const listWebhooks = async (DB, { limit, offset }) => {
	const { results } = await DB.prepare(
		`
		SELECT w.*, COUNT(wr.id) AS total_requests, MAX(wr.created_at) AS last_request
		FROM webhooks w
		LEFT JOIN webhook_requests wr ON w.id = wr.webhook_id
		GROUP BY w.id
		ORDER BY w.created_at DESC
		LIMIT ? OFFSET ?
		`,
	)
		.bind(limit, offset)
		.all();
	return results;
};

export const findWebhookById = (DB, id) => DB.prepare(`SELECT * FROM webhooks WHERE id = ?`).bind(id).first();

export const findWebhookByEndpoint = (DB, endpoint) => DB.prepare(`SELECT * FROM webhooks WHERE endpoint = ?`).bind(endpoint).first();

export const insertWebhook = async (DB, { name, endpoint, description, secret }) => {
	await DB.prepare(`INSERT INTO webhooks (name, endpoint, description, secret) VALUES (?, ?, ?, ?)`)
		.bind(name, endpoint, description ?? null, secret || null)
		.run();
	return findWebhookByEndpoint(DB, endpoint);
};

const UPDATABLE_COLUMNS = ['name', 'description', 'secret', 'is_active'];

// Partial update: only the provided columns are written. Returns the updated row, or null if missing.
export const updateWebhook = async (DB, id, fields) => {
	const columns = UPDATABLE_COLUMNS.filter((col) => fields[col] !== undefined);
	if (columns.length === 0) return findWebhookById(DB, id);

	const assignments = columns.map((col) => `${col} = ?`).join(', ');
	const values = columns.map((col) => fields[col]);

	const { meta } = await DB.prepare(`UPDATE webhooks SET ${assignments}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
		.bind(...values, id)
		.run();

	if (!meta?.changes) return null;
	return findWebhookById(DB, id);
};

export const deleteWebhook = async (DB, id) => {
	const { meta } = await DB.prepare(`DELETE FROM webhooks WHERE id = ?`).bind(id).run();
	return (meta?.changes ?? 0) > 0;
};
