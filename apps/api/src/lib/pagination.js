import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../config.js';

const toInt = (value, fallback) => {
	const n = parseInt(value ?? '', 10);
	return Number.isFinite(n) ? n : fallback;
};

export const parsePagination = (c) => {
	const limit = Math.min(Math.max(toInt(c.req.query('limit'), DEFAULT_PAGE_SIZE), 1), MAX_PAGE_SIZE);
	const offset = Math.max(toInt(c.req.query('offset'), 0), 0);
	return { limit, offset };
};

export const paginated = (data, total, { limit, offset }) => ({
	data,
	total,
	totalPages: Math.ceil(total / limit),
	limit,
	offset,
});
