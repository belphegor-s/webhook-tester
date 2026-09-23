import { SENSITIVE_HEADERS } from '../config.js';

// Never expose webhook secrets over the API.
export const sanitizeWebhook = (webhook) => {
	if (!webhook) return webhook;
	const { secret, ...rest } = webhook;
	return { ...rest, has_secret: Boolean(secret) };
};

export const sanitizeRequest = (request) => {
	let headers;
	try {
		headers = JSON.parse(request.headers || '{}');
	} catch {
		headers = {};
	}

	for (const key of SENSITIVE_HEADERS) {
		if (headers[key]) headers[key] = '<redacted>';
	}

	return { ...request, headers: JSON.stringify(headers) };
};
