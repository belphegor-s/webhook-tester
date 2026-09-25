import { Hono } from 'hono';
import { errorResponse, jsonResponse } from '../lib/http.js';
import { paginated, parsePagination } from '../lib/pagination.js';
import { requireAdmin } from '../middleware/auth.js';
import { countUsers, getDailyRequests, getTotals, listUsers } from '../db/admin.js';

// Mounted under /api/admin. Read-only, platform-wide. Non-admins get 404 so the surface isn't advertised.
const admin = new Hono();

admin.use('*', requireAdmin);

const DAILY_DAYS = 14;

// Oldest-first series with a zero for every day without traffic.
const fillDays = (rows, days) => {
	const byDate = new Map(rows.map((r) => [r.date, r.requests]));
	const today = new Date();
	return Array.from({ length: days }, (_, i) => {
		const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - (days - 1 - i)));
		const date = d.toISOString().slice(0, 10);
		return { date, requests: byDate.get(date) ?? 0 };
	});
};

admin.get('/overview', async (c) => {
	try {
		const [totals, daily] = await Promise.all([getTotals(c.env.DB), getDailyRequests(c.env.DB, DAILY_DAYS)]);
		return jsonResponse({ totals, daily: fillDays(daily, DAILY_DAYS) });
	} catch (err) {
		console.error('admin overview', err);
		return errorResponse('Failed to load overview', 500);
	}
});

admin.get('/users', async (c) => {
	const page = parsePagination(c);
	const search = (c.req.query('q') || '').trim().slice(0, 100);
	try {
		const [total, rows] = await Promise.all([countUsers(c.env.DB, search), listUsers(c.env.DB, search, page)]);
		return jsonResponse(paginated(rows, total, page));
	} catch (err) {
		console.error('admin users', err);
		return errorResponse('Failed to load users', 500);
	}
});

export default admin;
