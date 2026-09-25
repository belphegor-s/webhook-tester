import { List } from './List';

export const CONTACT_EMAIL = 'hello@ayushsharma.me';
export const LEGAL_UPDATED = 'September 25, 2026';

const terms = {
  path: '/terms',
  label: 'Terms',
  title: 'Terms of Service',
  intro:
    'Webhook Tester is a small, free tool for capturing and inspecting HTTP requests. These terms are short on purpose. By signing in or sending requests to an endpoint, you agree to them.',
  sections: [
    {
      title: 'The service',
      body: (
        <p>
          You create webhook endpoints, point other services at them, and every request they receive is recorded so you can inspect it. It is a personal project, offered free of charge, and meant for
          development and debugging.
        </p>
      ),
    },
    {
      title: 'Your account',
      body: (
        <>
          <p>You sign in with GitHub, and only accounts with a verified email address can get in. You are responsible for what happens under your account, including anything done with your API keys.</p>
          <p>Treat API keys like passwords. If one leaks, revoke it from the dashboard straight away.</p>
        </>
      ),
    },
    {
      title: 'Acceptable use',
      body: (
        <>
          <p>Please don&apos;t use Webhook Tester to:</p>
          <List
            items={[
              'send data you have no right to share, including other people’s personal data',
              'host, relay or distribute malware, phishing or unlawful content',
              'probe, overload or disrupt the service, or reach data in accounts that aren’t yours',
              'run production traffic you can’t afford to lose',
            ]}
          />
        </>
      ),
    },
    {
      title: 'Your data',
      body: (
        <p>
          What you send stays yours. It is stored only so it can be shown back to you, and you can delete it at any time by deleting the webhook. Because this is a testing tool, avoid sending real
          secrets or sensitive personal data to your endpoints.
        </p>
      ),
    },
    {
      title: 'Availability',
      body: (
        <p>
          There is no uptime guarantee. Features can change, limits can be introduced, and data can be lost. Accounts or endpoints that abuse the service may be suspended or removed without notice.
        </p>
      ),
    },
    {
      title: 'No warranty',
      body: (
        <p>
          The service is provided <strong>as is</strong>, without warranties of any kind. To the fullest extent the law allows, the operator is not liable for any loss or damage arising from its use.
        </p>
      ),
    },
    {
      title: 'Changes',
      body: <p>These terms may be updated from time to time. The date at the top always shows the latest revision, and continuing to use the service means you accept it.</p>,
    },
  ],
};

const privacy = {
  path: '/privacy',
  label: 'Privacy',
  title: 'Privacy Policy',
  intro:
    'Webhook Tester collects what it needs to sign you in and show you your requests, and nothing more. There are no ads, no analytics trackers, and your data is never sold.',
  sections: [
    {
      title: 'What is collected',
      body: (
        <List
          items={[
            <>
              <strong>Account.</strong> Your GitHub ID, username, name, verified email, avatar URL and sign-in times.
            </>,
            <>
              <strong>Sessions.</strong> A hash of your session token, plus the IP address and browser user agent it was created from.
            </>,
            <>
              <strong>API keys.</strong> Each key&apos;s name, prefix, a hash of the key, and when it was last used. The full key is never stored.
            </>,
            <>
              <strong>Webhooks.</strong> The name, description, endpoint and optional secret you set.
            </>,
            <>
              <strong>Captured requests.</strong> Method, headers, body, query parameters, sender IP address, user agent and time, exactly as received, plus daily request counts.
            </>,
          ]}
        />
      ),
    },
    {
      title: 'How it is used',
      body: <p>Only to run the service: signing you in, showing you your webhooks and their requests, keeping accounts secure and keeping abuse out.</p>,
    },
    {
      title: 'Who can see it',
      body: (
        <>
          <p>Your webhooks and their requests are visible only to your account. Credential headers such as <code>Authorization</code> and <code>x-api-key</code> are redacted whenever requests are shown.</p>
          <p>The operator has an admin view listing each account&apos;s profile and usage counts. It does not show the contents of your requests.</p>
        </>
      ),
    },
    {
      title: 'Cookies and storage',
      body: (
        <p>
          One cookie, <code>wt_session</code>, keeps you signed in. It is HttpOnly and lasts 30 days. Your theme choice is saved in your browser&apos;s local storage. There are no third-party cookies.
        </p>
      ),
    },
    {
      title: 'Service providers',
      body: (
        <List
          items={[
            <>
              <strong>Cloudflare</strong> runs the API, database and live updates, and keeps short-lived request logs.
            </>,
            <>
              <strong>Vercel</strong> hosts the dashboard.
            </>,
            <>
              <strong>GitHub</strong> handles sign-in and serves your avatar.
            </>,
          ]}
        />
      ),
    },
    {
      title: 'Retention',
      body: (
        <p>
          Data stays until you delete it. Deleting a webhook permanently removes its requests and stats. Sessions end when you log out and expire after 30 days. Deleting your account removes everything
          tied to it.
        </p>
      ),
    },
    {
      title: 'Your choices',
      body: (
        <p>
          Everything stored about your webhooks is visible in the dashboard, and you can delete webhooks and revoke keys yourself. To get a copy of your data or delete your account, email{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      ),
    },
    {
      title: 'Changes',
      body: <p>This policy may be updated from time to time. The date at the top always shows the latest revision.</p>,
    },
  ],
};

export const LEGAL_PAGES = { [terms.path]: terms, [privacy.path]: privacy };

export const legalPageFromPath = (path) => LEGAL_PAGES[path.replace(/\/+$/, '')] ?? null;
