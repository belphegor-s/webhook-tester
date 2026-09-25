export const WEBHOOK_BASE = import.meta.env.VITE_WEBHOOK_BASE_URL || 'https://hooks.procd.cc';

export const webhookUrl = (endpoint) => `${WEBHOOK_BASE}/webhook/${endpoint}`;
