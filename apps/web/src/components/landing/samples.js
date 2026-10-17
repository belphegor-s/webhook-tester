// Illustrative deliveries for the landing hero: the field animates them and the inspector lists them. Nothing here is real traffic.

export const METHOD_COLOR = { POST: '--success', PUT: '--warning', PATCH: '--warning', DELETE: '--destructive' };

const SAMPLES = [
  {
    method: 'POST',
    event: 'invoice.paid',
    agent: 'Stripe/1.0',
    query: { source: 'stripe' },
    headers: { 'content-type': 'application/json; charset=utf-8', 'stripe-signature': 't=1760693612,v1=5257a8…', 'user-agent': 'Stripe/1.0' },
    body: { id: 'evt_1QK2v8', type: 'invoice.paid', data: { object: { amount_paid: 4900, currency: 'usd', customer: 'cus_R2x9' } } },
  },
  {
    method: 'POST',
    event: 'push',
    agent: 'GitHub-Hookshot/8f3c2a1',
    query: {},
    headers: { 'content-type': 'application/json', 'x-github-event': 'push', 'x-github-delivery': '7b1e0c52-…', 'user-agent': 'GitHub-Hookshot/8f3c2a1' },
    body: { ref: 'refs/heads/main', after: '9fceb02', commits: [{ message: 'Fix retry backoff', author: { username: 'octocat' } }] },
  },
  {
    method: 'POST',
    event: 'orders/create',
    agent: 'Shopify-Captain-Hook',
    query: { shop: 'demo' },
    headers: { 'content-type': 'application/json', 'x-shopify-topic': 'orders/create', 'x-shopify-hmac-sha256': 'XWmrwMey…', 'user-agent': 'Shopify-Captain-Hook' },
    body: { id: 820982911, total_price: '59.00', currency: 'EUR', line_items: [{ title: 'Field notebook', quantity: 2 }] },
  },
  {
    method: 'PUT',
    event: 'config.sync',
    agent: 'curl/8.7.1',
    query: { env: 'staging' },
    headers: { 'content-type': 'application/json', authorization: 'Bearer ••••••••', 'user-agent': 'curl/8.7.1' },
    body: { flags: { new_checkout: true, retries: 3 }, revision: 214 },
  },
  {
    method: 'PATCH',
    event: 'user.updated',
    agent: 'node-fetch/3.3.2',
    query: {},
    headers: { 'content-type': 'application/json', 'x-request-id': 'req_4f2a91', 'user-agent': 'node-fetch/3.3.2' },
    body: { id: 'usr_82', changes: { plan: ['free', 'pro'] } },
  },
  {
    method: 'POST',
    event: 'message.received',
    agent: 'TwilioProxy/1.1',
    query: {},
    headers: { 'content-type': 'application/x-www-form-urlencoded', 'x-twilio-signature': 'Rm9vYmFy…', 'user-agent': 'TwilioProxy/1.1' },
    body: 'From=%2B15005550006&Body=Order+shipped%3F&MessageSid=SM1f0e',
  },
  {
    method: 'DELETE',
    event: 'session.revoked',
    agent: 'python-requests/2.32.3',
    query: { reason: 'logout' },
    headers: { 'x-api-version': '2026-09-01', 'user-agent': 'python-requests/2.32.3' },
    body: '',
  },
  {
    method: 'POST',
    event: 'event_callback',
    agent: 'Slackbot 1.0',
    query: {},
    headers: { 'content-type': 'application/json', 'x-slack-signature': 'v0=a2114d57…', 'user-agent': 'Slackbot 1.0 (+https://api.slack.com/robots)' },
    body: { type: 'event_callback', event: { type: 'app_mention', text: '<@U0LAN0Z89> deploy?' } },
  },
];

// Mostly POSTs, like real webhook traffic.
const WEIGHTS = [5, 4, 4, 1.5, 1.5, 3, 1, 3];
const TOTAL = WEIGHTS.reduce((a, b) => a + b, 0);

const IPS = ['203.0.113.7', '198.51.100.24', '192.0.2.61', '203.0.113.140', '198.51.100.9'];

let sequence = 1280;
let lastIndex = -1;

// A fresh delivery, shaped like a captured request row.
export function nextSample() {
  let index;
  do {
    let roll = Math.random() * TOTAL;
    index = WEIGHTS.findIndex((w) => (roll -= w) < 0);
  } while (index === lastIndex);
  lastIndex = index;
  const s = SAMPLES[index];
  sequence += 1;
  return {
    ...s,
    id: sequence,
    colorVar: METHOD_COLOR[s.method] ?? '--info',
    ip: IPS[sequence % IPS.length],
    ms: 18 + Math.round(Math.random() * 40),
    size: typeof s.body === 'string' ? s.body.length : JSON.stringify(s.body).length,
    receivedAt: Date.now(),
  };
}

// The rows already in the feed when the page opens, oldest last.
export const seedSamples = (count) =>
  Array.from({ length: count }, (_, i) => ({ ...nextSample(), receivedAt: Date.now() - (i + 1) * 7000 - Math.round(Math.random() * 4000) })).map((s, i, all) => ({
    ...s,
    id: all[0].id - i,
  }));
