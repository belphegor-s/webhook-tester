# Webhook Tester

Create webhook endpoints, then capture and inspect every request they receive.

| Path       | What                                   | Deployed to                               |
| ---------- | -------------------------------------- | ----------------------------------------- |
| `apps/api` | Hono API + ingest on Cloudflare Workers, D1 storage | Cloudflare Worker `webhook-tester` at `hooks.procd.cc` |
| `apps/web` | React + Vite dashboard                 | Vercel at `webhooks.procd.cc`             |

Each app keeps its own `package.json` and lockfile, so both deploy exactly as before.

## How auth works

- Users sign in with **GitHub OAuth**. Only accounts with a **verified email address** get in (primary verified email preferred, else any verified one).
- The dashboard proxies `/api/*` to the worker (`apps/web/vercel.json` rewrite in production, Vite `server.proxy` in development). The worker's session cookie (`wt_session`, HttpOnly, `SameSite=Lax`, `Secure` on https) is therefore first-party to the dashboard. Cookie-authenticated writes must also pass an Origin check against `APP_URL`.
- Sessions last 30 days and are stored as SHA-256 hashes in D1. Logging out deletes the session row.
- Each account owns its webhooks, their requests and stats, and its **API keys**. Other accounts get `404` for anything they don't own.
- API keys (`whk_…`) are created in the dashboard (account menu → API keys). The full key is shown once; only its hash is stored. Send it as `x-api-key: whk_…` or `Authorization: Bearer whk_…`. Keys can use every `/api/webhooks…` route, but can't list, create or revoke keys.
- `POST/PUT/… /webhook/:endpoint` (ingest) and `/health` stay public.

### Realtime

`GET /api/stream` is a Server-Sent Events stream for the caller's account (session or API key). Each account has one `RealtimeHub` Durable Object holding its open streams. Ingest and the webhook routes publish into it after each write.

| Event | Data |
| --- | --- |
| `ready` | stream is live (sent first) |
| `ping` | heartbeat, every 20s |
| `request` | `{ webhook_id, endpoint, request_id }` |
| `webhook.created`, `webhook.updated`, `webhook.deleted` | `{ webhook_id, endpoint }` |

Events are notifications only; clients refetch through the REST API, so nothing large or sensitive goes over the stream. An account keeps up to 20 open streams, and when a 21st opens, the oldest is closed. Streams are also recycled every 10 minutes. `EventSource` reconnects automatically, and the dashboard resyncs after a reconnect. The dashboard falls back to 5s polling whenever the stream isn't confirmed live.

```sh
curl -N https://hooks.procd.cc/api/stream -H "x-api-key: whk_..."
```

### API

| Method | Path | Auth |
| --- | --- | --- |
| GET | `/api/auth/github/login?next=/path` | public, starts OAuth |
| GET | `/api/auth/github/callback` | public, OAuth redirect URI |
| GET | `/api/auth/me` | session or key |
| POST | `/api/auth/logout` | session |
| GET, POST | `/api/keys` | session |
| DELETE | `/api/keys/:id` | session |
| GET, POST | `/api/webhooks` | session or key |
| GET | `/api/webhooks/:endpoint` | session or key |
| PATCH, PUT, DELETE | `/api/webhooks/:id` | session or key |
| GET | `/api/webhooks/:endpoint/requests` | session or key |
| GET | `/api/webhooks/:id/stats` | session or key |
| GET | `/api/stream` | session or key (SSE) |
| ANY | `/webhook/:endpoint` | public (webhook secret if set) |

## Local development

```sh
npm run install:all

# 1. GitHub OAuth app for dev: https://github.com/settings/developers → New OAuth App
#    Homepage URL:  http://localhost:5173
#    Callback URL:  http://localhost:5173/api/auth/github/callback
cp apps/api/.dev.vars.example apps/api/.dev.vars   # fill GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET
cp apps/web/.env.example apps/web/.env             # optional

npm run db:migrate:local
npm run dev:api    # worker on :8787
npm run dev:web    # dashboard on :5173, proxies /api to :8787
```

## Production rollout (first deploy of accounts)

Run these in order. Deploy the worker and the dashboard back to back: the old dashboard's password login stops working as soon as the new worker is live.

1. **GitHub OAuth app (production)**, Homepage `https://webhooks.procd.cc`, Callback `https://webhooks.procd.cc/api/auth/github/callback`.
2. **Worker secrets**
   ```sh
   cd apps/api
   npx wrangler secret put GITHUB_CLIENT_ID
   npx wrangler secret put GITHUB_CLIENT_SECRET
   ```
   `APP_URL` is a plain var in `wrangler.jsonc`.
3. **Migrate D1**: `npm run db:migrate:remote`. `0001_initial.sql` uses `IF NOT EXISTS`, so it is a no-op on the existing database; `0002` adds `users`, `sessions`, `api_keys` and `webhooks.user_id`.
4. **Deploy the worker**: `npm run deploy:api`.
5. **Vercel**: point the project at this repository with **Root Directory `apps/web`** (framework preset Vite). Remove the old env vars `APP_PASSWORD`, `TOKEN_SECRET` and `API_KEY`; keep `VITE_WEBHOOK_BASE_URL`. Deploy.
6. **Claim the webhooks created before accounts existed.** They keep receiving deliveries but are hidden until assigned. Sign in once, then:
   ```sh
   cd apps/api
   npx wrangler d1 execute webhook-db --remote --command \
     "UPDATE webhooks SET user_id = (SELECT id FROM users WHERE login = '<your-github-login>') WHERE user_id IS NULL"
   ```
7. Optional cleanup: `npx wrangler secret delete API_KEY` (the global key is no longer read).
