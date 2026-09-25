export const listStats = async (DB, webhookId, { days, limit, offset }) => {
	const { results } = await DB.prepare(
		`
		SELECT * FROM webhook_stats
		WHERE webhook_id = ?
		AND date >= date('now', ?)
		ORDER BY date DESC
		LIMIT ? OFFSET ?
		`,
	)
		.bind(webhookId, `-${days} days`, limit, offset)
		.all();
	return results;
};

export const recordSuccess = (DB, webhookId, date) =>
	DB.prepare(
		`
		INSERT INTO webhook_stats (webhook_id, date, total_requests, success_requests)
		VALUES (?, ?, 1, 1)
		ON CONFLICT(webhook_id, date) DO UPDATE SET
			total_requests = total_requests + 1,
			success_requests = success_requests + 1
		`,
	)
		.bind(webhookId, date)
		.run();
