const encoder = new TextEncoder();

const toBase64Url = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

// URL-safe random token from a CSPRNG (32 bytes = 256 bits by default).
export const randomToken = (bytes = 32) => toBase64Url(crypto.getRandomValues(new Uint8Array(bytes)));

// Tokens and API keys are high-entropy, so a fast hash is sufficient for at-rest storage.
export const sha256Hex = async (value) => {
	const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
	return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
};

export const timingSafeCompare = (provided, expected) => {
	const providedBytes = encoder.encode(provided);
	const expectedBytes = encoder.encode(expected);

	// Compare lengths without short-circuit, then content via timingSafeEqual
	const lengthMatch = providedBytes.length === expectedBytes.length;
	const maxLen = Math.max(providedBytes.length, expectedBytes.length);
	const a = new Uint8Array(maxLen);
	const b = new Uint8Array(maxLen);
	a.set(providedBytes);
	b.set(expectedBytes);

	return crypto.subtle.timingSafeEqual(a, b) && lengthMatch;
};
