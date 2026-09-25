const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';

// 22 random base36 characters from a CSPRNG (same shape as the previous Math.random ids).
export const generateEndpoint = (length = 22) => {
	const bytes = crypto.getRandomValues(new Uint8Array(length));
	let out = '';
	for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
	return out;
};
