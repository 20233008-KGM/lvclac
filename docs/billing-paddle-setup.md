# Paddle Billing Setup

This is the active billing setup guide for the Paddle Billing integration.

For the production launch, treat Paddle setup as two tracks:

- Technical setup: checkout, webhook, portal, Supabase subscription sync.
- Business setup: company, tax, refund/contact information, payout account.

Paddle can be tested in sandbox before the corporation is finished. Live sales should wait until the legal name, payout/tax profile, support email, refund terms, and required Korean commerce filings are ready.

## Environment

Server-only variables:

```text
PADDLE_API_KEY=pdl_...
PADDLE_WEBHOOK_SECRET=pdl_ntfset_...
PADDLE_ENV=sandbox
PADDLE_PRICE_MONTHLY=pri_...
PADDLE_PRICE_YEARLY=pri_...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
APP_URL=https://your-domain.com
```

Client variables:

```text
VITE_PADDLE_CLIENT_TOKEN=test_...
VITE_PADDLE_ENV=sandbox
```

Use `live` for both Paddle env values only after the live API key, client token,
prices, and webhook destination are configured.

## Routes

```text
POST /api/billing/checkout
POST /api/billing/summary
POST /api/billing/switch-yearly-preview
POST /api/billing/switch-yearly
POST /api/billing/cancel-subscription
POST /api/billing/portal
POST /api/billing/sandbox-subscription
POST /api/billing/webhook
```

The webhook route must receive the raw body and the `Paddle-Signature` header.
Local Vite dev middleware exposes the same `/api/billing/*` paths.

## Local Subscription Reads

Run this once per checkout to read Live subscriptions without copying server secrets:

```bash
npm run billing:setup -- --environment production
npm run dev
# A different port works with the same settings:
npm run dev -- --port 5174
```

Prerequisites: Node 22.18+ or 24+, the installed Vercel CLI (`vercel login`),
and this checkout linked to the correct Vercel project (`vercel link`).
The command downloads the selected Vercel environment to a temporary ignored file,
selects public Paddle/Supabase settings, and removes the download. If Vercel omits
the Supabase public anon key, an existing local key is reused only when its project
URL matches. Missing keys, Live/Sandbox mismatches, and untrusted origins are rejected.

The generated `.env.development.local` is git-ignored. Restart existing dev servers
after setup. Normal `npm run dev` and `npx vite` in this checkout use these settings
on any available port. New checkouts/machines need their own one-time setup.
Custom `--mode` or `--config` commands must explicitly load equivalent settings.

`BILLING_DEV_READ_ORIGIN` enables only `summary` and `switch-yearly-preview` forwarding.
The local server sends the signed-in user's bearer token to the trusted deployed
API over HTTPS; the deployed API still authenticates the user and checks ownership.
Responses are not cached. Local cookies, server secrets, request bodies, arbitrary
paths, and redirects are not forwarded. Only `https://liqguard.com` for Live and
`https://devpilgrm.liqguard.com` for Sandbox are accepted.

This requires internet access and a healthy deployed billing API. Each browser
origin (host and port) has its own login session, so sign in on a new port before
expecting account data. Client `VITE_PADDLE_ENV` also selects the matching subscription
provider; an absent value intentionally does not guess Live from existing rows.

Checkout, plan changes, portal creation, and webhooks are **not** proxied. Testing
those locally requires the complete matching server environment listed above,
preferably Sandbox. Cancellation is also local-only by default. The local summary
explicitly reports cancellation as unavailable until matching native server
credentials or the explicit cancellation forwarding option below are configured.
Mismatched Paddle environments or Supabase projects disable native billing while
read forwarding is enabled. Native local checkout returns to the requesting
host/port instead of the deployed `APP_URL`. For fully local Sandbox testing, remove
`BILLING_DEV_READ_ORIGIN` and set both client/server Paddle environments to Sandbox.

### Optional Cancellation Forwarding

After deploying `/api/billing/cancel-subscription`, explicitly opt in per checkout:

```bash
npm run billing:setup -- --environment production --allow-cancellation
```

This sets the server-only `BILLING_DEV_ALLOW_CANCELLATION=true`. With the existing
trusted `BILLING_DEV_READ_ORIGIN`, Vite forwards only the cancellation endpoint in
addition to reads. It sends the user's bearer token and an empty body: caller-supplied
subscription IDs, immediate cancellation options, cookies, and secrets are discarded.
The deployed API authenticates the user, selects their own subscription in the
correct environment, and always uses `next_billing_period`. Refunds are not requested.
There is no automatic retry of a cancellation request; after a transport failure,
the page checks the current subscription state before another explicit attempt.

**Live mode affects real subscriptions.** Opening the page or checking status is
read-only; pressing the final cancellation button schedules the actual cancellation.
Returning to setup without `--allow-cancellation` resets the option to `false`.
Neither local environment files nor this opt-in are uploaded in Vercel deployments.

## Flow

```text
Free user -> checkout endpoint -> Paddle.js overlay checkout
Paddle webhook -> subscriptions row upsert with provider='paddle'
active/trialing status -> Pro access
Pro user -> portal endpoint -> Paddle portal session URL
```

## Dashboard checklist

1. Create a Paddle sandbox account and keep sandbox/live values separate.
2. Create one subscription product.
3. Create monthly and yearly prices, then copy both `pri_...` IDs.
4. Create a client-side token and put it in `VITE_PADDLE_CLIENT_TOKEN`.
5. Create a notification destination for `/api/billing/webhook`.
6. Copy the notification destination secret into `PADDLE_WEBHOOK_SECRET`.
7. Set the default payment link/domain before live checkout testing.
8. Run one sandbox payment and confirm the Supabase `subscriptions` row changes to `provider='paddle'` and `status='active'` or `trialing`.
9. Confirm the customer portal button opens a Paddle portal session for an active subscriber.

## Manual inputs

These cannot be safely filled by the agent:

| Input | Why | Estimate |
| --- | --- | --- |
| Paddle API key and client-side token | Account secret or account-bound token | 0:15 |
| Paddle price IDs | Must come from the correct sandbox/live catalog | 0:15 |
| Webhook destination secret | Server-only secret | 0:10 |
| Test card approval in checkout | Human-owned payment/testing step | 0:20 |
| Live payout/tax profile | Business identity and bank information | 0:40 |

## Current verification commands

```bash
npm.cmd test -- scripts/billing/billingHandlers.test.ts scripts/billing/subscriptionSync.test.ts
npm.cmd exec tsc -- --noEmit
```

## References

- Paddle overlay checkout: https://developer.paddle.com/build/checkout/build-overlay-checkout/
- Paddle webhook signature verification: https://developer.paddle.com/webhooks/about/signature-verification/
- Paddle customer portal sessions: https://developer.paddle.com/api-reference/customer-portals/create-customer-portal-session/
- Paddle custom data: https://developer.paddle.com/build/transactions/custom-data/
