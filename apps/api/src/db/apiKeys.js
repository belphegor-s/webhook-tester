const PUBLIC_COLUMNS = `id, name, prefix, last_used_at, created_at`;

export const listApiKeys = async (DB, userId) => {
	const { results } = await DB.prepare(`SELECT ${PUBLIC_COLUMNS} FROM api_keys WHERE user_id = ? ORDER BY created_at DESC, id DESC`)
		.bind(userId)
		.all();
	return results;
};

export const countApiKeys = async (DB, userId) => {
	const row = await DB.prepare(`SELECT COUNT(*) AS total FROM api_keys WHERE user_id = ?`).bind(userId).first();
	return row?.total ?? 0;
};

export const insertApiKey = (DB, { userId, name, prefix, keyHash }) =>
	DB.prepare(`INSERT INTO api_keys (user_id, name, prefix, key_hash) VALUES (?, ?, ?, ?) RETURNING ${PUBLIC_COLUMNS}`)
		.bind(userId, name, prefix, keyHash)
		.first();

export const deleteApiKey = async (DB, userId, id) => {
	const { meta } = await DB.prepare(`DELETE FROM api_keys WHERE id = ? AND user_id = ?`).bind(id, userId).run();
	return (meta?.changes ?? 0) > 0;
};

// Throttled to one write per minute per key to keep hot keys from hammering D1.
export const touchApiKey = (DB, id) =>
	DB.prepare(
		`UPDATE api_keys SET last_used_at = CURRENT_TIMESTAMP WHERE id = ? AND (last_used_at IS NULL OR last_used_at < datetime('now', '-1 minute'))`,
	)
		.bind(id)
		.run();
