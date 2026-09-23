export const parseId = (value) => {
	const id = Number(value);
	return Number.isInteger(id) && id > 0 ? id : null;
};

// Returns the trimmed string, null for empty/null, or undefined when absent. Pushes messages into `errors`.
const text = (value, field, errors, { required = false, max = 500 } = {}) => {
	if (value === undefined || value === null) {
		if (required) errors.push(`${field} is required`);
		return value;
	}
	if (typeof value !== 'string') {
		errors.push(`${field} must be a string`);
		return undefined;
	}
	const trimmed = value.trim();
	if (required && !trimmed) {
		errors.push(`${field} is required`);
		return undefined;
	}
	if (trimmed.length > max) {
		errors.push(`${field} must be at most ${max} characters`);
		return undefined;
	}
	return trimmed || null;
};

// Accepts true/false (and 1/0 for older callers); stored as 1/0 in SQLite.
const boolean = (value, field, errors) => {
	if (value === undefined) return undefined;
	if (typeof value === 'boolean') return value ? 1 : 0;
	if (value === 0 || value === 1) return value;
	errors.push(`${field} must be a boolean`);
	return undefined;
};

export const validateCreate = (body) => {
	const errors = [];
	const fields = {
		name: text(body?.name, 'name', errors, { required: true, max: 100 }),
		description: text(body?.description, 'description', errors),
		secret: text(body?.secret, 'secret', errors, { max: 256 }),
	};
	return { fields, errors };
};

// Every field is optional; only the ones present are validated and applied.
export const validateUpdate = (body) => {
	const errors = [];
	const fields = {
		name: body?.name === undefined ? undefined : text(body.name, 'name', errors, { required: true, max: 100 }),
		description: text(body?.description, 'description', errors),
		secret: text(body?.secret, 'secret', errors, { max: 256 }),
		is_active: boolean(body?.is_active, 'is_active', errors),
	};
	return { fields, errors };
};
