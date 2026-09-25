// Public dashboard origin. Overridden per environment with the APP_URL var (wrangler.jsonc / .dev.vars).
export const DEFAULT_APP_URL = 'https://webhooks.procd.cc';

export const appUrl = (env) => (env?.APP_URL || DEFAULT_APP_URL).replace(/\/+$/, '');

export const CORS_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
export const CORS_HEADERS = ['Content-Type', 'Authorization', 'x-api-key'];
export const corsOrigins = (env) => ['http://localhost:5173', appUrl(env)];

// Headers masked before stored requests are returned by the API.
export const SENSITIVE_HEADERS = ['authorization', 'x-api-key', 'api-key', 'token', 'authentication'];

export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 100;

export const SESSION_COOKIE = 'wt_session';
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

export const OAUTH_STATE_COOKIE = 'wt_oauth_state';
export const OAUTH_STATE_TTL_SECONDS = 60 * 10;
export const OAUTH_CALLBACK_PATH = '/api/auth/github/callback';

export const API_KEY_PREFIX = 'whk_';
export const MAX_API_KEYS_PER_USER = 20;
