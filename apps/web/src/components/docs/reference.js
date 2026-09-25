import { WEBHOOK_BASE } from '../../lib/config';

// Single source for the public API reference: the /docs page renders all of it and the API keys dialog lists the endpoints.
// Text fields may wrap inline code in backticks; see <Rich> in DocsPage.

export const API_BASE = WEBHOOK_BASE;
export const KEY_ENV = 'WHK_API_KEY';

export const METHOD_TEXT = { GET: 'text-info', POST: 'text-success', PUT: 'text-warning', PATCH: 'text-warning', DELETE: 'text-destructive' };

const ENDPOINT = 'k3v9x2m7q1p8r4t6w0y5za';

const webhook = {
  id: 42,
  name: 'Stripe events',
  endpoint: ENDPOINT,
  description: 'Payments in test mode',
  is_active: 1,
  created_at: '2026-09-20 08:14:03',
  updated_at: '2026-09-24 17:02:51',
  has_secret: false,
};

const request = {
  id: 1287,
  webhook_id: 42,
  method: 'POST',
  headers: '{"content-type":"application/json","authorization":"<redacted>","user-agent":"Stripe/1.0"}',
  body: '{"type":"invoice.paid","id":"evt_1Q"}',
  query_params: '{"source":"stripe"}',
  ip_address: '203.0.113.7',
  user_agent: 'Stripe/1.0',
  status_code: 200,
  response_time: 38,
  created_at: '2026-09-25 09:41:12',
};

const page = (data, total) => ({ data, total, totalPages: Math.ceil(total / 50), limit: 50, offset: 0 });

const paginationParams = [
  { name: 'limit', in: 'query', type: 'integer', desc: 'Items per page, 1 to 100. Defaults to 50.' },
  { name: 'offset', in: 'query', type: 'integer', desc: 'Items to skip. Defaults to 0.' },
];

export const GROUPS = [
  { id: 'account', title: 'Account', blurb: 'Check which account a key belongs to.' },
  { id: 'webhooks', title: 'Webhooks', blurb: 'Create, list, update and delete endpoints.' },
  { id: 'requests', title: 'Requests', blurb: 'Read the requests an endpoint has captured.' },
  { id: 'stats', title: 'Stats', blurb: 'Daily request counts per webhook.' },
  { id: 'realtime', title: 'Realtime', blurb: 'Stream account events as they happen.' },
  { id: 'delivery', title: 'Delivery', blurb: 'The public URL that captures requests.' },
];

export const ENDPOINTS = [
  {
    id: 'get-me',
    group: 'account',
    method: 'GET',
    path: '/api/auth/me',
    title: 'Get the current account',
    summary: 'Returns the account the key belongs to. Handy as a quick check that a key works.',
    example: { path: '/api/auth/me' },
    response: {
      status: 200,
      body: {
        user: { id: 7, github_id: 1024, login: 'octocat', name: 'Mona Lisa', email: 'mona@example.com', avatar_url: 'https://avatars.githubusercontent.com/u/1024', created_at: '2026-09-01 10:00:00', is_admin: false },
        auth_type: 'api_key',
      },
    },
  },
  {
    id: 'list-webhooks',
    group: 'webhooks',
    method: 'GET',
    path: '/api/webhooks',
    title: 'List webhooks',
    summary: 'Returns your webhooks, newest first, with how many requests each has received and when the last one arrived.',
    params: paginationParams,
    example: { path: '/api/webhooks', query: { limit: 20 } },
    response: { status: 200, body: page([{ ...webhook, total_requests: 128, last_request: '2026-09-25 09:41:12' }], 1) },
  },
  {
    id: 'create-webhook',
    group: 'webhooks',
    method: 'POST',
    path: '/api/webhooks',
    title: 'Create a webhook',
    summary: 'Creates an endpoint with a random, unguessable slug. Requests to its delivery URL are recorded straight away.',
    params: [
      { name: 'name', in: 'body', type: 'string', required: true, desc: 'Up to 100 characters.' },
      { name: 'description', in: 'body', type: 'string', desc: 'Up to 500 characters.' },
      { name: 'secret', in: 'body', type: 'string', desc: 'Up to 256 characters. When set, deliveries must carry it in the `Authorization` header.' },
    ],
    example: { method: 'POST', path: '/api/webhooks', body: { name: 'Stripe events', description: 'Payments in test mode' } },
    response: { status: 201, body: webhook },
  },
  {
    id: 'get-webhook',
    group: 'webhooks',
    method: 'GET',
    path: '/api/webhooks/{endpoint}',
    title: 'Get a webhook',
    summary: 'Looks a webhook up by its endpoint slug, the last part of its delivery URL.',
    params: [{ name: 'endpoint', in: 'path', type: 'string', required: true, desc: 'The endpoint slug, e.g. `' + ENDPOINT + '`.' }],
    example: { path: `/api/webhooks/${ENDPOINT}` },
    response: { status: 200, body: webhook },
  },
  {
    id: 'update-webhook',
    group: 'webhooks',
    method: 'PATCH',
    path: '/api/webhooks/{id}',
    title: 'Update a webhook',
    summary: 'Changes only the fields you send. `PUT` is accepted as an alias. Pausing a webhook makes its delivery URL answer `403`.',
    params: [
      { name: 'id', in: 'path', type: 'integer', required: true, desc: 'The numeric webhook id.' },
      { name: 'name', in: 'body', type: 'string', desc: 'Up to 100 characters. Can’t be empty.' },
      { name: 'description', in: 'body', type: 'string | null', desc: 'Send `null` to clear it.' },
      { name: 'secret', in: 'body', type: 'string | null', desc: 'Send `null` to remove it.' },
      { name: 'is_active', in: 'body', type: 'boolean', desc: '`false` pauses deliveries, `true` resumes them.' },
    ],
    example: { method: 'PATCH', path: '/api/webhooks/42', body: { is_active: false } },
    response: { status: 200, body: { ...webhook, is_active: 0, updated_at: '2026-09-25 09:45:00' } },
  },
  {
    id: 'delete-webhook',
    group: 'webhooks',
    method: 'DELETE',
    path: '/api/webhooks/{id}',
    title: 'Delete a webhook',
    summary: 'Deletes the webhook together with every request and stat it recorded. This can’t be undone.',
    params: [{ name: 'id', in: 'path', type: 'integer', required: true, desc: 'The numeric webhook id.' }],
    example: { method: 'DELETE', path: '/api/webhooks/42' },
    response: { status: 200, body: { message: 'Webhook deleted successfully' } },
  },
  {
    id: 'list-requests',
    group: 'requests',
    method: 'GET',
    path: '/api/webhooks/{endpoint}/requests',
    title: 'List captured requests',
    summary:
      'Returns the requests a webhook received, newest first. `headers` and `query_params` are JSON-encoded strings and `body` is the raw body. Credential headers such as `authorization` and `x-api-key` come back as `<redacted>`.',
    params: [{ name: 'endpoint', in: 'path', type: 'string', required: true, desc: 'The endpoint slug.' }, ...paginationParams],
    example: { path: `/api/webhooks/${ENDPOINT}/requests`, query: { limit: 10 } },
    response: { status: 200, body: page([request], 128) },
  },
  {
    id: 'get-stats',
    group: 'stats',
    method: 'GET',
    path: '/api/webhooks/{id}/stats',
    title: 'Get daily stats',
    summary: 'Returns one row per day that saw traffic, newest first. The response is a plain array, not a paginated envelope.',
    params: [
      { name: 'id', in: 'path', type: 'integer', required: true, desc: 'The numeric webhook id.' },
      { name: 'days', in: 'query', type: 'integer', desc: 'How far back to look, 1 to 365. Defaults to 7.' },
      ...paginationParams,
    ],
    example: { path: '/api/webhooks/42/stats', query: { days: 30 } },
    response: {
      status: 200,
      body: [{ id: 311, webhook_id: 42, date: '2026-09-25', total_requests: 64, success_requests: 64, failed_requests: 0, avg_response_time: 0 }],
    },
  },
  {
    id: 'stream',
    group: 'realtime',
    method: 'GET',
    path: '/api/stream',
    title: 'Stream events',
    summary:
      'Opens a Server-Sent Events stream for your account. Events carry ids only, so fetch the details from the REST endpoints. Streams are recycled every 10 minutes: reconnect when one ends.',
    events: [
      { name: 'ready', desc: 'The stream is live.' },
      { name: 'ping', desc: 'Heartbeat, every 20 seconds.' },
      { name: 'request', desc: 'A webhook captured a request: `webhook_id`, `endpoint`, `request_id`.' },
      { name: 'webhook.created', desc: 'A webhook was created: `webhook_id`, `endpoint`.' },
      { name: 'webhook.updated', desc: 'A webhook was changed: `webhook_id`, `endpoint`.' },
      { name: 'webhook.deleted', desc: 'A webhook was deleted: `webhook_id`.' },
    ],
    example: { path: '/api/stream', stream: true },
    response: {
      status: 200,
      contentType: 'text/event-stream',
      text: `event: ready\ndata: {"at":"2026-09-25T09:41:00.000Z"}\n\nevent: request\ndata: {"type":"request","webhook_id":42,"endpoint":"${ENDPOINT}","request_id":1287}`,
    },
  },
  {
    id: 'deliver',
    group: 'delivery',
    method: 'ANY',
    path: '/webhook/{endpoint}',
    title: 'Send a request',
    public: true,
    summary:
      'The URL you give to other services. `POST`, `PUT`, `PATCH`, `DELETE` and every other method are recorded with their headers, query and raw body. `GET` is not recorded: opening the URL in a browser redirects to the dashboard.',
    params: [
      { name: 'endpoint', in: 'path', type: 'string', required: true, desc: 'The endpoint slug.' },
      { name: 'Authorization', in: 'header', type: 'string', desc: 'Required only when the webhook has a secret. The header must contain the secret, e.g. `Bearer <secret>`.' },
    ],
    example: { method: 'POST', path: `/webhook/${ENDPOINT}`, query: { source: 'stripe' }, body: { type: 'invoice.paid', id: 'evt_1Q' }, noAuth: true },
    response: { status: 200, body: { message: 'Webhook received successfully', webhook: 'Stripe events', timestamp: '2026-09-25T09:41:12.482Z' } },
    errors: [
      { status: 401, desc: 'The secret is missing or wrong.' },
      { status: 403, desc: 'The webhook is paused.' },
      { status: 404, desc: 'No webhook has this endpoint.' },
    ],
  },
];

export const ERRORS = [
  { status: 400, title: 'Bad request', desc: 'The body isn’t valid JSON, a field failed validation, or an id isn’t a positive integer.' },
  { status: 401, title: 'Unauthorized', desc: 'No credentials were sent, or the API key is invalid or revoked.' },
  { status: 403, title: 'Forbidden', desc: 'The endpoint needs a dashboard session, such as key management.' },
  { status: 404, title: 'Not found', desc: 'The webhook doesn’t exist or belongs to another account.' },
  { status: 500, title: 'Server error', desc: 'Something failed on our side. Retrying is safe for reads.' },
];

// Language samples. The key is read from an environment variable so snippets are safe to paste into scripts.
export const LANGUAGES = [
  { id: 'curl', label: 'cURL', grammar: 'bash' },
  { id: 'javascript', label: 'JavaScript', grammar: 'javascript' },
  { id: 'python', label: 'Python', grammar: 'python' },
];

const urlFor = ({ path, query }) => {
  const qs = query ? `?${new URLSearchParams(query)}` : '';
  return `${API_BASE}${path}${qs}`;
};

const indent = (text, pad) => text.replace(/\n/g, `\n${pad}`);

const curl = (ex) => {
  const method = ex.method ?? 'GET';
  const lines = [`curl ${ex.stream ? '-N ' : ''}${method === 'GET' ? '' : `-X ${method} `}"${urlFor(ex)}"`];
  if (!ex.noAuth) lines.push(`-H "x-api-key: $${KEY_ENV}"`);
  if (ex.body) lines.push('-H "Content-Type: application/json"', `-d '${JSON.stringify(ex.body)}'`);
  return lines.join(' \\\n  ');
};

const javascript = (ex) => {
  const method = ex.method ?? 'GET';
  if (ex.stream) {
    return `const res = await fetch("${urlFor(ex)}", {
  headers: { "x-api-key": process.env.${KEY_ENV} },
});

const decoder = new TextDecoder();
for await (const chunk of res.body) {
  process.stdout.write(decoder.decode(chunk, { stream: true }));
}`;
  }
  const headers = [];
  if (!ex.noAuth) headers.push(`"x-api-key": process.env.${KEY_ENV}`);
  if (ex.body) headers.push('"Content-Type": "application/json"');
  const opts = [];
  if (method !== 'GET') opts.push(`method: "${method}"`);
  if (headers.length) opts.push(`headers: {\n    ${headers.join(',\n    ')},\n  }`);
  if (ex.body) opts.push(`body: JSON.stringify(${indent(JSON.stringify(ex.body, null, 2), '  ')})`);
  const init = opts.length ? `, {\n  ${opts.join(',\n  ')},\n}` : '';
  return `const res = await fetch("${urlFor(ex)}"${init});\nconst data = await res.json();`;
};

const pyLiteral = (value) =>
  JSON.stringify(value, null, 4)
    .replace(/\btrue\b/g, 'True')
    .replace(/\bfalse\b/g, 'False')
    .replace(/\bnull\b/g, 'None');

const python = (ex) => {
  const method = (ex.method ?? 'GET').toLowerCase();
  const head = ex.noAuth ? 'import requests' : 'import os\nimport requests';
  const args = [`"${API_BASE}${ex.path}"`];
  if (ex.query) args.push(`params=${pyLiteral(ex.query).replace(/\n\s*/g, ' ').replace(/{ /, '{').replace(/ }/, '}')}`);
  if (!ex.noAuth) args.push(`headers={"x-api-key": os.environ["${KEY_ENV}"]}`);
  if (ex.body) args.push(`json=${indent(pyLiteral(ex.body), '    ')}`);
  if (ex.stream) {
    args.push('stream=True');
    return `${head}\n\nwith requests.get(\n    ${args.join(',\n    ')},\n) as res:\n    for line in res.iter_lines(decode_unicode=True):\n        print(line)`;
  }
  return `${head}\n\nres = requests.${method}(\n    ${args.join(',\n    ')},\n)\ndata = res.json()`;
};

const GENERATORS = { curl, javascript, python };

export const snippet = (lang, example) => GENERATORS[lang](example);

export const responseText = ({ body, text }) => text ?? JSON.stringify(body, null, 2);
