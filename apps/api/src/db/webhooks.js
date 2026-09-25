// Every dashboard/API query is scoped to the owning user. Only ingest looks webhooks up globally (findWebhookByEndpoint).

export const countWebhooks = async (DB, userId) => {
	const row = await DB.prepare(`SELECT COUNT(*) AS total FROM webhooks WHERE user_id = ?`).bind(userId).first();
	return row?.total ?? 0;
};

export const listWebhooks = async (DB, userId, { limit, offset }) => {
	const { results } = await DB.prepare(
		`
		SELECT w.*, COUNT(wr.id) AS total_requests, MAX(wr.created_at) AS last_request
		FROM webhooks w
		LEFT JOIN webhook_requests wr ON w.id = wr.webhook_id
		WHERE w.user_id = ?
		GROUP BY w.id
		ORDER BY w.created_at DESC
		LIMIT ? OFFSET ?
		`,
	)
		.bind(userId, limit, offset)
		.all();
	return results;
};

export const findWebhookById = (DB, userId, id) => DB.prepare(`SELECT * FROM webhooks WHERE id = ? AND user_id = ?`).bind(id, userId).first();

export const findUserWebhookByEndpoint = (DB, userId, endpoint) =>
	DB.prepare(`SELECT * FROM webhooks WHERE endpoint = ? AND user_id = ?`).bind(endpoint, userId).first();

// Unscoped: used by the public ingest route only.
export const findWebhookByEndpoint = (DB, endpoint) => DB.prepare(`SELECT * FROM webhooks WHERE endpoint = ?`).bind(endpoint).first();

export const insertWebhook = (DB, userId, { name, endpoint, description, secret }) =>
	DB.prepare(`INSERT INTO webhooks (user_id, name, endpoint, description, secret) VALUES (?, ?, ?, ?, ?) RETURNING *`)
		.bind(userId, name, endpoint, description ?? null, secret || null)
		.first();

const UPDATABLE_COLUMNS = ['name', 'description', 'secret', 'is_active'];

// Partial update: only the provided columns are written. Returns the updated row, or null if missing.
export const updateWebhook = async (DB, userId, id, fields) => {
	const columns = UPDATABLE_COLUMNS.filter((col) => fields[col] !== undefined);
	if (columns.length === 0) return findWebhookById(DB, userId, id);

	const assignments = columns.map((col) => `${col} = ?`).join(', ');
	const values = columns.map((col) => fields[col]);

	const { meta } = await DB.prepare(`UPDATE webhooks SET ${assignments}, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?`)
		.bind(...values, id, userId)
		.run();

	if (!meta?.changes) return null;
	return findWebhookById(DB, userId, id);
};

export const deleteWebhook = async (DB, userId, id) => {
	const { meta } = await DB.prepare(`DELETE FROM webhooks WHERE id = ? AND user_id = ?`).bind(id, userId).run();
	return (meta?.changes ?? 0) > 0;
};
