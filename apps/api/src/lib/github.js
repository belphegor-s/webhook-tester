const USER_AGENT = 'webhook-tester';
const API = 'https://api.github.com';

export const authorizeUrl = ({ clientId, redirectUri, state }) => {
	const url = new URL('https://github.com/login/oauth/authorize');
	url.searchParams.set('client_id', clientId);
	url.searchParams.set('redirect_uri', redirectUri);
	url.searchParams.set('scope', 'read:user user:email');
	url.searchParams.set('state', state);
	url.searchParams.set('allow_signup', 'true');
	return url.toString();
};

const exchangeCode = async (env, code, redirectUri) => {
	const res = await fetch('https://github.com/login/oauth/access_token', {
		method: 'POST',
		headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'User-Agent': USER_AGENT },
		body: JSON.stringify({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET, code, redirect_uri: redirectUri }),
	});
	const data = await res.json().catch(() => null);
	if (!res.ok || !data?.access_token) throw new Error(`GitHub token exchange failed: ${data?.error || res.status}`);
	return data.access_token;
};

const get = async (token, path) => {
	const res = await fetch(`${API}${path}`, {
		headers: {
			Accept: 'application/vnd.github+json',
			Authorization: `Bearer ${token}`,
			'User-Agent': USER_AGENT,
			'X-GitHub-Api-Version': '2022-11-28',
		},
	});
	if (!res.ok) throw new Error(`GitHub ${path} failed: ${res.status}`);
	return res.json();
};

// The access token is only needed once to read the profile, so it is revoked right after.
export const revokeToken = (env, token) =>
	fetch(`${API}/applications/${env.GITHUB_CLIENT_ID}/token`, {
		method: 'DELETE',
		headers: {
			Accept: 'application/vnd.github+json',
			Authorization: `Basic ${btoa(`${env.GITHUB_CLIENT_ID}:${env.GITHUB_CLIENT_SECRET}`)}`,
			'Content-Type': 'application/json',
			'User-Agent': USER_AGENT,
		},
		body: JSON.stringify({ access_token: token }),
	}).catch((err) => console.error('revoke github token', err));

// Exchanges an OAuth code for the user's profile. `email` is null unless GitHub reports a verified address.
export const fetchProfile = async (env, code, redirectUri) => {
	const token = await exchangeCode(env, code, redirectUri);
	try {
		const [user, emails] = await Promise.all([get(token, '/user'), get(token, '/user/emails')]);
		const verified = Array.isArray(emails) ? emails.filter((e) => e.verified && e.email) : [];
		const email = (verified.find((e) => e.primary) ?? verified[0])?.email ?? null;
		return {
			profile: { githubId: user.id, login: user.login, name: user.name || null, avatarUrl: user.avatar_url || null, email },
			token,
		};
	} catch (err) {
		await revokeToken(env, token);
		throw err;
	}
};
