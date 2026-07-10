import { createHmac } from 'node:crypto'
import { describe, it, expect } from 'vitest'
import type { BillingConfig, BillingDeps } from './billingConfig'
import { handleCheckout, handleWebhook } from './billingHandlers'

const CONFIG: BillingConfig = {
  paddleApiKey: 'pdl_api',
  webhookSecret: 'pdl_whsec',
  paddleEnv: 'sandbox',
  supabaseUrl: 'https://x.supabase.co',
  serviceRoleKey: 'svc',
  prices: { monthly: 'pri_m', yearly: 'pri_y' },
  appUrl: undefined,
}

const NOOP_DEPS = { admin: {}, fetch: async () => ({}) } as unknown as BillingDeps

function sign(rawBody: string, ts = '1700000000'): string {
  const h1 = createHmac('sha256', CONFIG.webhookSecret)
    .update(`${ts}:${rawBody}`)
    .digest('hex')
  return `ts=${ts};h1=${h1}`
}

describe('handleCheckout validation', () => {
  it('rejects when billing is not configured', async () => {
    const result = await handleCheckout(null, { plan: 'monthly', origin: 'https://a.com' }, NOOP_DEPS)
    expect(result.status).toBe(500)
    expect(result.body.error).toBe('billing_not_configured')
  })

  it('rejects an invalid plan', async () => {
    const result = await handleCheckout(CONFIG, { plan: 'weekly', origin: 'https://a.com' }, NOOP_DEPS)
    expect(result.status).toBe(400)
    expect(result.body.error).toBe('invalid_plan')
  })

  it('rejects when no redirect base can be resolved', async () => {
    const result = await handleCheckout(CONFIG, { plan: 'monthly', origin: undefined }, NOOP_DEPS)
    expect(result.status).toBe(400)
    expect(result.body.error).toBe('missing_origin')
  })

  it('requires an access token', async () => {
    const result = await handleCheckout(
      CONFIG,
      { plan: 'monthly', origin: 'https://a.com' },
      NOOP_DEPS,
    )
    expect(result.status).toBe(401)
    expect(result.body.error).toBe('missing_access_token')
  })

  it('returns a Paddle checkout payload decided by the server', async () => {
    const deps = {
      admin: {
        auth: {
          async getUser() {
            return { data: { user: { id: 'user-1', email: 'u@example.com' } }, error: null }
          },
        },
      },
      fetch: async () => ({}),
    } as unknown as BillingDeps
    const result = await handleCheckout(
      CONFIG,
      { plan: 'yearly', origin: 'https://a.com', accessToken: 'jwt' },
      deps,
    )

    expect(result.status).toBe(200)
    expect(result.body).toMatchObject({
      priceId: 'pri_y',
      customerEmail: 'u@example.com',
      successUrl: 'https://a.com/my?checkout=success',
      customData: { user_id: 'user-1', plan: 'yearly', provider: 'paddle' },
    })
  })
})

interface WebhookState {
  inserts: Record<string, unknown>[]
}

function makeWebhookDeps(state: WebhookState): BillingDeps {
  const admin = {
    from() {
      return {
        select() {
          return this
        },
        eq() {
          return this
        },
        async maybeSingle() {
          return { data: null, error: null }
        },
        async insert(row: Record<string, unknown>) {
          state.inserts.push(row)
          return { error: null }
        },
      }
    },
  }
  return { admin, fetch: async () => ({}) } as unknown as BillingDeps
}

describe('handleWebhook', () => {
  it('rejects when not configured', async () => {
    const result = await handleWebhook(null, { rawBody: '{}', signature: sign('{}') }, NOOP_DEPS)
    expect(result.status).toBe(500)
  })

  it('requires a signature and body', async () => {
    const noSig = await handleWebhook(CONFIG, { rawBody: '{}' }, NOOP_DEPS)
    expect(noSig.status).toBe(400)
    expect(noSig.body.error).toBe('missing_signature')

    const noBody = await handleWebhook(CONFIG, { signature: sign('{}') }, NOOP_DEPS)
    expect(noBody.status).toBe(400)
    expect(noBody.body.error).toBe('missing_body')
  })

  it('rejects an invalid signature', async () => {
    const deps = makeWebhookDeps({ inserts: [] })
    const result = await handleWebhook(CONFIG, { rawBody: '{}', signature: 'ts=1;h1=bad' }, deps)
    expect(result.status).toBe(400)
    expect(result.body.error).toBe('invalid_signature')
  })

  it('syncs a subscription.updated event to the DB', async () => {
    const state: WebhookState = { inserts: [] }
    const event = {
      event_type: 'subscription.updated',
      data: {
        id: 'sub_1',
        customer_id: 'ctm_1',
        status: 'active',
        current_billing_period: { ends_at: '2023-11-14T22:13:20.000Z' },
        custom_data: { user_id: 'user-1' },
      },
    }
    const rawBody = JSON.stringify(event)
    const deps = makeWebhookDeps(state)
    const result = await handleWebhook(CONFIG, { rawBody, signature: sign(rawBody) }, deps)

    expect(result.status).toBe(200)
    expect(result.body.received).toBe(true)
    expect(state.inserts).toHaveLength(1)
    expect(state.inserts[0]).toMatchObject({
      user_id: 'user-1',
      provider: 'paddle',
      status: 'active',
    })
  })

  it('ignores unrelated events with 200', async () => {
    const rawBody = JSON.stringify({ event_type: 'transaction.completed', data: {} })
    const deps = makeWebhookDeps({ inserts: [] })
    const result = await handleWebhook(CONFIG, { rawBody, signature: sign(rawBody) }, deps)
    expect(result.status).toBe(200)
  })
})
