export const jsonResponse = (data, status = 200) =>
	new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});

export const errorResponse = (message, status) => jsonResponse({ error: message }, status);

// Parses a JSON request body, returning null instead of throwing on malformed input.
export const readJson = async (c) => {
	try {
		return await c.req.json();
	} catch {
		return null;
	}
};
