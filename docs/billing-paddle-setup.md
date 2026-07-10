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
POST /api/billing/portal
POST /api/billing/webhook
```

The webhook route must receive the raw body and the `Paddle-Signature` header.
Local Vite dev middleware exposes the same `/api/billing/*` paths.

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
