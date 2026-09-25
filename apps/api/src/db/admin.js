// Platform-wide reads for the admin view. Never used by tenant routes.

export const getTotals = (DB) =>
	DB.prepare(
		`
		SELECT
			(SELECT COUNT(*) FROM users) AS users,
			(SELECT COUNT(*) FROM users WHERE created_at >= datetime('now', '-7 days')) AS new_users_7d,
			(SELECT COUNT(*) FROM webhooks) AS webhooks,
			(SELECT COUNT(*) FROM webhooks WHERE user_id IS NULL) AS unowned_webhooks,
			(SELECT COUNT(*) FROM webhook_requests) AS requests,
			(SELECT COUNT(*) FROM webhook_requests WHERE created_at >= datetime('now', '-1 day')) AS requests_24h,
			(SELECT COUNT(*) FROM api_keys) AS api_keys,
			(SELECT COUNT(*) FROM sessions WHERE expires_at > datetime('now')) AS active_sessions
		`,
	).first();

// Requests per UTC day for the last `days` days (from webhook_stats), oldest first.
export const getDailyRequests = async (DB, days) => {
	const { results } = await DB.prepare(
		`
		SELECT date, SUM(total_requests) AS requests
		FROM webhook_stats
		WHERE date >= date('now', ?)
		GROUP BY date
		`,
	)
		.bind(`-${days - 1} days`)
		.all();
	return results;
};

// LIKE wildcards in the search term are matched literally (escaped with '!').
const USER_FILTER = `WHERE (? = '' OR u.login LIKE ? ESCAPE '!' OR u.email LIKE ? ESCAPE '!')`;
const likePattern = (search) => `%${search.replace(/[!%_]/g, (ch) => `!${ch}`)}%`;

export const countUsers = async (DB, search) => {
	const like = likePattern(search);
	const row = await DB.prepare(`SELECT COUNT(*) AS total FROM users u ${USER_FILTER}`).bind(search, like, like).first();
	return row?.total ?? 0;
};

export const listUsers = async (DB, search, { limit, offset }) => {
	const like = likePattern(search);
	const { results } = await DB.prepare(
		`
		SELECT
			u.id, u.login, u.name, u.email, u.avatar_url, u.created_at, u.last_login_at,
			(SELECT COUNT(*) FROM webhooks w WHERE w.user_id = u.id) AS webhooks,
			(SELECT COUNT(*) FROM webhook_requests r JOIN webhooks w ON w.id = r.webhook_id WHERE w.user_id = u.id) AS requests,
			(SELECT MAX(r.created_at) FROM webhook_requests r JOIN webhooks w ON w.id = r.webhook_id WHERE w.user_id = u.id) AS last_request,
			(SELECT COUNT(*) FROM api_keys k WHERE k.user_id = u.id) AS api_keys
		FROM users u
		${USER_FILTER}
		ORDER BY u.created_at DESC, u.id DESC
		LIMIT ? OFFSET ?
		`,
	)
		.bind(search, like, like, limit, offset)
		.all();
	return results;
};
