const USER_COLUMNS = `u.id, u.github_id, u.login, u.name, u.email, u.avatar_url, u.created_at`;

// Inserts or refreshes the account for a GitHub user and returns it.
export const upsertUser = (DB, { githubId, login, name, email, avatarUrl }) =>
	DB.prepare(
		`
		INSERT INTO users (github_id, login, name, email, avatar_url, last_login_at)
		VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
		ON CONFLICT(github_id) DO UPDATE SET
			login = excluded.login,
			name = excluded.name,
			email = excluded.email,
			avatar_url = excluded.avatar_url,
			last_login_at = CURRENT_TIMESTAMP,
			updated_at = CURRENT_TIMESTAMP
		RETURNING id, github_id, login, name, email, avatar_url, created_at
		`,
	)
		.bind(githubId, login, name, email, avatarUrl)
		.first();

export const createSession = (DB, { userId, tokenHash, ttlSeconds, userAgent, ip }) =>
	DB.prepare(
		`
		INSERT INTO sessions (user_id, token_hash, user_agent, ip_address, expires_at)
		VALUES (?, ?, ?, ?, datetime('now', ?))
		`,
	)
		.bind(userId, tokenHash, userAgent, ip, `+${ttlSeconds} seconds`)
		.run();

export const findUserBySession = (DB, tokenHash) =>
	DB.prepare(
		`
		SELECT ${USER_COLUMNS}
		FROM sessions s
		JOIN users u ON u.id = s.user_id
		WHERE s.token_hash = ? AND s.expires_at > datetime('now')
		`,
	)
		.bind(tokenHash)
		.first();

export const deleteSession = (DB, tokenHash) => DB.prepare(`DELETE FROM sessions WHERE token_hash = ?`).bind(tokenHash).run();

export const deleteExpiredSessions = (DB, userId) =>
	DB.prepare(`DELETE FROM sessions WHERE user_id = ? AND expires_at <= datetime('now')`).bind(userId).run();

export const findUserByApiKey = (DB, keyHash) =>
	DB.prepare(
		`
		SELECT ${USER_COLUMNS}, k.id AS api_key_id
		FROM api_keys k
		JOIN users u ON u.id = k.user_id
		WHERE k.key_hash = ?
		`,
	)
		.bind(keyHash)
		.first();
