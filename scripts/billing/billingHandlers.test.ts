import { describe, it, expect } from 'vitest'
import type { BillingConfig, BillingDeps } from './billingConfig'
import { handleCheckout, handleWebhook } from './billingHandlers'

const CONFIG: BillingConfig = {
  stripeSecretKey: 'sk',
  webhookSecret: 'whsec',
  supabaseUrl: 'https://x.supabase.co',
  serviceRoleKey: 'svc',
  prices: { monthly: 'price_m', yearly: 'price_y' },
  appUrl: undefined,
}

const NOOP_DEPS = { stripe: {}, admin: {} } as unknown as BillingDeps

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
})

interface WebhookState {
  inserts: Record<string, unknown>[]
}

function makeWebhookDeps(event: unknown, state: WebhookState): BillingDeps {
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
  const stripe = {
    webhooks: {
      constructEvent: (_body: unknown, signature: string) => {
        if (signature === 'bad') throw new Error('signature mismatch')
        return event
      },
    },
  }
  return { admin, stripe } as unknown as BillingDeps
}

describe('handleWebhook', () => {
  it('rejects when not configured', async () => {
    const result = await handleWebhook(null, { rawBody: '{}', signature: 'x' }, NOOP_DEPS)
    expect(result.status).toBe(500)
  })

  it('requires a signature and body', async () => {
    const noSig = await handleWebhook(CONFIG, { rawBody: '{}' }, NOOP_DEPS)
    expect(noSig.status).toBe(400)
    expect(noSig.body.error).toBe('missing_signature')

    const noBody = await handleWebhook(CONFIG, { signature: 'x' }, NOOP_DEPS)
    expect(noBody.status).toBe(400)
    expect(noBody.body.error).toBe('missing_body')
  })

  it('rejects an invalid signature', async () => {
    const deps = makeWebhookDeps({}, { inserts: [] })
    const result = await handleWebhook(CONFIG, { rawBody: '{}', signature: 'bad' }, deps)
    expect(result.status).toBe(400)
    expect(result.body.error).toContain('invalid_signature')
  })

  it('syncs a subscription.updated event to the DB', async () => {
    const state: WebhookState = { inserts: [] }
    const event = {
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_1',
          customer: 'cus_1',
          status: 'active',
          current_period_end: 1_700_000_000,
          metadata: { user_id: 'user-1' },
        },
      },
    }
    const deps = makeWebhookDeps(event, state)
    const result = await handleWebhook(CONFIG, { rawBody: '{}', signature: 'good' }, deps)

    expect(result.status).toBe(200)
    expect(result.body.received).toBe(true)
    expect(state.inserts).toHaveLength(1)
    expect(state.inserts[0]).toMatchObject({ user_id: 'user-1', status: 'active' })
  })

  it('ignores unrelated events with 200', async () => {
    const deps = makeWebhookDeps({ type: 'invoice.paid', data: { object: {} } }, { inserts: [] })
    const result = await handleWebhook(CONFIG, { rawBody: '{}', signature: 'good' }, deps)
    expect(result.status).toBe(200)
  })
})
