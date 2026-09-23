export const DASHBOARD_URL = 'https://webhooks.procd.cc';

export const CORS_ORIGINS = ['http://localhost:5173', DASHBOARD_URL];
export const CORS_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
export const CORS_HEADERS = ['Content-Type', 'Authorization', 'x-api-key'];

// Headers masked before stored requests are returned by the API.
export const SENSITIVE_HEADERS = ['authorization', 'x-api-key', 'api-key', 'token', 'authentication'];

export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 100;
