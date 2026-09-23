import { Hono } from 'hono';
import { jsonResponse } from '../lib/http.js';

const health = new Hono();

health.get('/', () => jsonResponse({ status: 'ok' }));

export default health;
