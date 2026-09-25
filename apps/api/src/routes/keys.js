import { Hono } from 'hono';
import { API_KEY_PREFIX, MAX_API_KEYS_PER_USER } from '../config.js';
import { randomToken, sha256Hex } from '../lib/crypto.js';
import { errorResponse, jsonResponse, readJson } from '../lib/http.js';
import { parseId, validateApiKey } from '../lib/validate.js';
import { requireSession } from '../middleware/auth.js';
import { countApiKeys, deleteApiKey, insertApiKey, listApiKeys } from '../db/apiKeys.js';

// Mounted under /api/keys. Dashboard sessions only.
const keys = new Hono();

keys.use('*', requireSession);

keys.get('/', async (c) => {
	try {
		return jsonResponse({ data: await listApiKeys(c.env.DB, c.get('user').id) });
	} catch (err) {
		console.error('list api keys', err);
		return errorResponse('Failed to fetch API keys', 500);
	}
});

// The plaintext key is returned exactly once; only its hash is stored.
keys.post('/', async (c) => {
	const body = await readJson(c);
	if (!body) return errorResponse('Invalid request data', 400);

	const { fields, errors } = validateApiKey(body);
	if (errors.length) return errorResponse(errors[0], 400);

	const userId = c.get('user').id;
	try {
		if ((await countApiKeys(c.env.DB, userId)) >= MAX_API_KEYS_PER_USER) {
			return errorResponse(`You can have at most ${MAX_API_KEYS_PER_USER} API keys`, 400);
		}

		const key = `${API_KEY_PREFIX}${randomToken(32)}`;
		const row = await insertApiKey(c.env.DB, { userId, name: fields.name, prefix: key.slice(0, API_KEY_PREFIX.length + 6), keyHash: await sha256Hex(key) });
		return jsonResponse({ ...row, key }, 201);
	} catch (err) {
		console.error('create api key', err);
		return errorResponse('Failed to create API key', 500);
	}
});

keys.delete('/:id', async (c) => {
	const id = parseId(c.req.param('id'));
	if (!id) return errorResponse('Invalid API key id', 400);

	try {
		const deleted = await deleteApiKey(c.env.DB, c.get('user').id, id);
		return deleted ? jsonResponse({ message: 'API key revoked' }) : errorResponse('API key not found', 404);
	} catch (err) {
		console.error('delete api key', err);
		return errorResponse('Failed to revoke API key', 500);
	}
});

export default keys;
