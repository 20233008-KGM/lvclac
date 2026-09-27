import { createHmac } from 'node:crypto'
import { describe, it, expect, vi } from 'vitest'
import type { BillingConfig, BillingDeps } from './billingConfig'
import {
  handleCheckout,
  handlePortal,
  handleSandboxSubscription,
  handleSwitchYearly,
  handleSwitchYearlyPreview,
  handleWebhook,
} from './billingHandlers'

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

function sign(rawBody: string, ts = String(Math.floor(Date.now() / 1000))): string {
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
      customData: { user_id: 'user-1', plan: 'yearly', provider: 'paddle_sandbox' },
    })
  })
})

describe('handlePortal', () => {
  it('creates a Paddle customer portal session for subscription management', async () => {
    const fetches: Array<{ input: string; init?: { method?: string; body?: string } }> = []
    const filters: Array<{ table: string; column: string; value: unknown }> = []
    const deps = {
      admin: {
        auth: {
          async getUser() {
            return { data: { user: { id: 'user-1', email: 'u@example.com' } }, error: null }
          },
        },
        from(table: string) {
          const chain = {
            select() {
              return chain
            },
            eq(column: string, value: unknown) {
              filters.push({ table, column, value })
              return chain
            },
            in(column: string, value: unknown) {
              filters.push({ table, column, value })
              return chain
            },
            order() {
              return chain
            },
            limit() {
              return chain
            },
            async maybeSingle() {
              return {
                data: {
                  provider_customer_id: 'ctm_1',
                  provider_subscription_id: 'sub_1',
                },
                error: null,
              }
            },
          }
          return chain
        },
      },
      async fetch(input: string, init?: { method?: string; body?: string }) {
        fetches.push({ input, init })
        return {
          ok: true,
          status: 201,
          async json() {
            return {
              data: {
                urls: {
                  general: {
                    overview: 'https://customer-portal.paddle.com/session',
                  },
                  subscriptions: [{ id: 'sub_1' }],
                },
              },
            }
          },
          async text() {
            return ''
          },
        }
      },
    } as unknown as BillingDeps

    const result = await handlePortal(CONFIG, { accessToken: 'jwt' }, deps)

    expect(result.status).toBe(200)
    expect(result.body).toMatchObject({
      ok: true,
      action: 'overview',
      url: 'https://customer-portal.paddle.com/session',
    })
    expect(filters).toContainEqual({
      table: 'subscriptions',
      column: 'user_id',
      value: 'user-1',
    })
    expect(fetches[0]).toMatchObject({
      input: 'https://sandbox-api.paddle.com/customers/ctm_1/portal-sessions',
      init: {
        method: 'POST',
        body: JSON.stringify({ subscription_ids: ['sub_1'] }),
      },
    })
  })
})

interface SandboxState {
  fetches: Array<{ input: string; init?: { method?: string; body?: string } }>
  updates: Record<string, unknown>[]
  filters: Array<{ table: string; column: string; value: unknown }>
}

function makeSandboxDeps(state: SandboxState): BillingDeps {
  const admin = {
    auth: {
      async getUser() {
        return { data: { user: { id: 'user-1', email: 'u@example.com' } }, error: null }
      },
    },
    from(table: string) {
      let selected = ''
      let update: Record<string, unknown> | null = null
      const chain = {
        select(columns: string) {
          selected = columns
          return chain
        },
        update(patch: Record<string, unknown>) {
          update = patch
          state.updates.push(patch)
          return chain
        },
        eq(column: string, value: unknown) {
          state.filters.push({ table, column, value })
          return chain
        },
        in(column: string, value: unknown) {
          state.filters.push({ table, column, value })
          return chain
        },
        order() {
          return chain
        },
        limit() {
          return chain
        },
        async maybeSingle() {
          if (selected === 'provider_subscription_id') {
            return { data: { provider_subscription_id: 'sub_1' }, error: null }
          }
          if (selected === 'id,provider_event_time') {
            return { data: { id: 'row_1', provider_event_time: null }, error: null }
          }
          return { data: null, error: null }
        },
        get error() {
          return update ? null : undefined
        },
      }
      return chain
    },
  }
  return {
    admin,
    async fetch(input: string, init?: { method?: string; body?: string }) {
      state.fetches.push({ input, init })
      return {
        ok: true,
        status: 200,
        async json() {
          return {
            data: {
              id: 'sub_1',
              customer_id: 'ctm_1',
              status: 'canceled',
              current_billing_period: { ends_at: '2026-08-02T03:00:00.000Z' },
              scheduled_change: null,
            },
          }
        },
        async text() {
          return ''
        },
      }
    },
  } as unknown as BillingDeps
}

describe('handleSandboxSubscription', () => {
  it('is unavailable outside Paddle Sandbox', async () => {
    const result = await handleSandboxSubscription(
      { ...CONFIG, paddleEnv: 'live' },
      { accessToken: 'jwt', action: 'cancel_now' },
      NOOP_DEPS,
    )
    expect(result.status).toBe(404)
    expect(result.body.error).toBe('sandbox_control_unavailable')
  })

  it('requires a signed-in user', async () => {
    const result = await handleSandboxSubscription(
      CONFIG,
      { action: 'cancel_now' },
      NOOP_DEPS,
    )
    expect(result.status).toBe(401)
    expect(result.body.error).toBe('missing_access_token')
  })

  it('immediately cancels only the signed-in user subscription and syncs it', async () => {
    const state: SandboxState = { fetches: [], updates: [], filters: [] }
    const result = await handleSandboxSubscription(
      CONFIG,
      { accessToken: 'jwt', action: 'cancel_now' },
      makeSandboxDeps(state),
    )

    expect(result.status).toBe(200)
    expect(result.body.action).toBe('cancel_now')
    expect(state.filters).toContainEqual({
      table: 'subscriptions',
      column: 'user_id',
      value: 'user-1',
    })
    expect(state.filters).toContainEqual({
      table: 'subscriptions',
      column: 'provider',
      value: ['paddle_sandbox', 'paddle'],
    })
    expect(state.fetches).toHaveLength(1)
    expect(state.fetches[0]).toMatchObject({
      input: 'https://sandbox-api.paddle.com/subscriptions/sub_1/cancel',
      init: { method: 'POST', body: JSON.stringify({ effective_from: 'immediately' }) },
    })
    expect(state.updates[0]).toMatchObject({
      provider_subscription_id: 'sub_1',
      status: 'canceled',
      scheduled_change_action: null,
      scheduled_change_effective_at: null,
    })
  })

  it('can refresh the current Paddle state without canceling it', async () => {
    const state: SandboxState = { fetches: [], updates: [], filters: [] }
    const result = await handleSandboxSubscription(
      CONFIG,
      { accessToken: 'jwt', action: 'sync' },
      makeSandboxDeps(state),
    )
    expect(result.status).toBe(200)
    expect(state.fetches[0]).toMatchObject({
      input: 'https://sandbox-api.paddle.com/subscriptions/sub_1',
      init: { method: 'GET' },
    })
  })
})

interface SwitchYearlyState {
  fetches: Array<{ input: string; init?: { method?: string; body?: string } }>
  updates: Record<string, unknown>[]
  filters: Array<{ table: string; column: string; value: unknown }>
  currentPriceId: string
  currentStatus?: string
}

function makeSwitchYearlyDeps(state: SwitchYearlyState): BillingDeps {
  const admin = {
    auth: {
      async getUser() {
        return { data: { user: { id: 'user-1', email: 'u@example.com' } }, error: null }
      },
    },
    from(table: string) {
      let selected = ''
      let update: Record<string, unknown> | null = null
      const chain = {
        select(columns: string) {
          selected = columns
          return chain
        },
        update(patch: Record<string, unknown>) {
          update = patch
          state.updates.push(patch)
          return chain
        },
        eq(column: string, value: unknown) {
          state.filters.push({ table, column, value })
          return chain
        },
        in(column: string, value: unknown) {
          state.filters.push({ table, column, value })
          return chain
        },
        order() {
          return chain
        },
        limit() {
          return chain
        },
        async maybeSingle() {
          if (selected === 'provider_subscription_id') {
            return { data: { provider_subscription_id: 'sub_1' }, error: null }
          }
          if (selected === 'id,provider_event_time') {
            return { data: { id: 'row_1', provider_event_time: null }, error: null }
          }
          return { data: null, error: null }
        },
        get error() {
          return update ? null : undefined
        },
      }
      return chain
    },
  }
  return {
    admin,
    async fetch(input: string, init?: { method?: string; body?: string }) {
      state.fetches.push({ input, init })
      return {
        ok: true,
        status: 200,
        async json() {
          const isPatch = init?.method === 'PATCH'
          return {
            data: {
              id: 'sub_1',
              customer_id: 'ctm_1',
              status: 'active',
              current_billing_period: { ends_at: '2027-01-15T00:00:00.000Z' },
              scheduled_change: null,
              items: [
                {
                  price: { id: isPatch ? CONFIG.prices.yearly : state.currentPriceId },
                  quantity: 1,
                },
              ],
            },
          }
        },
        async text() {
          return ''
        },
      }
    },
  } as unknown as BillingDeps
}

describe('handleSwitchYearly', () => {
  it('requires a signed-in user', async () => {
    const result = await handleSwitchYearly(CONFIG, {}, NOOP_DEPS)

    expect(result.status).toBe(401)
    expect(result.body.error).toBe('missing_access_token')
  })

  it('switches a monthly subscription to yearly with immediate proration credit', async () => {
    const state: SwitchYearlyState = {
      fetches: [],
      updates: [],
      filters: [],
      currentPriceId: CONFIG.prices.monthly,
    }
    const result = await handleSwitchYearly(
      CONFIG,
      { accessToken: 'jwt' },
      makeSwitchYearlyDeps(state),
    )

    expect(result.status).toBe(200)
    expect(result.body.action).toBe('switched_to_yearly')
    expect(state.filters).toContainEqual({
      table: 'subscriptions',
      column: 'user_id',
      value: 'user-1',
    })
    expect(state.fetches).toHaveLength(2)
    expect(state.fetches[0]).toMatchObject({
      input: 'https://sandbox-api.paddle.com/subscriptions/sub_1',
      init: { method: 'GET' },
    })
    expect(state.fetches[1]).toMatchObject({
      input: 'https://sandbox-api.paddle.com/subscriptions/sub_1',
      init: { method: 'PATCH' },
    })
    expect(JSON.parse(state.fetches[1].init?.body ?? '{}')).toEqual({
      proration_billing_mode: 'prorated_immediately',
      on_payment_failure: 'prevent_change',
      items: [{ price_id: CONFIG.prices.yearly, quantity: 1 }],
    })
    expect(state.updates[0]).toMatchObject({
      provider_subscription_id: 'sub_1',
      status: 'active',
    })
  })

  it('previews the prorated yearly switch before charging the saved payment method', async () => {
    const state: SwitchYearlyState = {
      fetches: [],
      updates: [],
      filters: [],
      currentPriceId: CONFIG.prices.monthly,
    }
    const result = await handleSwitchYearlyPreview(
      CONFIG,
      { accessToken: 'jwt' },
      makeSwitchYearlyDeps(state),
    )

    expect(result.status).toBe(200)
    expect(result.body.action).toBe('preview_yearly')
    expect(state.fetches).toHaveLength(2)
    expect(state.fetches[1]).toMatchObject({
      input: 'https://sandbox-api.paddle.com/subscriptions/sub_1/preview',
      init: { method: 'PATCH' },
    })
    expect(JSON.parse(state.fetches[1].init?.body ?? '{}')).toEqual({
      proration_billing_mode: 'prorated_immediately',
      on_payment_failure: 'prevent_change',
      items: [{ price_id: CONFIG.prices.yearly, quantity: 1 }],
    })
    expect(state.updates).toHaveLength(0)
  })

  it('logs Paddle lookup failures with the response reason', async () => {
    const state: SwitchYearlyState = {
      fetches: [],
      updates: [],
      filters: [],
      currentPriceId: CONFIG.prices.monthly,
    }
    const deps = makeSwitchYearlyDeps(state)
    deps.fetch = async (input, init) => {
      state.fetches.push({ input, init })
      return {
        ok: false,
        status: 403,
        async json() {
          return { error: { code: 'forbidden' }, meta: { request_id: 'req_1' } }
        },
        async text() {
          return ''
        },
      }
    }
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const result = await handleSwitchYearlyPreview(CONFIG, { accessToken: 'jwt' }, deps)

    expect(result.status).toBe(502)
    expect(result.body).toMatchObject({
      ok: false,
      error: 'subscription_lookup_failed',
      reason: 'forbidden',
    })
    expect(errorSpy).toHaveBeenCalledWith(
      'paddle_subscription_change_failed',
      expect.objectContaining({
        phase: 'subscription_lookup',
        status: 403,
        reason: 'forbidden',
        requestId: 'req_1',
        subscriptionId: 'sub_1',
      }),
    )
    errorSpy.mockRestore()
  })

  it('does not create another charge when the subscription is already yearly', async () => {
    const state: SwitchYearlyState = {
      fetches: [],
      updates: [],
      filters: [],
      currentPriceId: CONFIG.prices.yearly,
    }
    const result = await handleSwitchYearly(
      CONFIG,
      { accessToken: 'jwt' },
      makeSwitchYearlyDeps(state),
    )

    expect(result.status).toBe(200)
    expect(result.body.action).toBe('already_yearly')
    expect(state.fetches).toHaveLength(1)
    expect(state.updates).toHaveLength(0)
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
        in() {
          return this
        },
        order() {
          return this
        },
        limit() {
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

  it('rejects a correctly signed payload outside the replay tolerance', async () => {
    const deps = makeWebhookDeps({ inserts: [] })
    const staleTimestamp = String(Math.floor(Date.now() / 1000) - 6)
    const result = await handleWebhook(
      CONFIG,
      { rawBody: '{}', signature: sign('{}', staleTimestamp) },
      deps,
    )
    expect(result.status).toBe(400)
    expect(result.body.error).toBe('invalid_signature')
  })

  it('accepts any valid h1 while Paddle rotates webhook secrets', async () => {
    const deps = makeWebhookDeps({ inserts: [] })
    const rawBody = JSON.stringify({ event_type: 'transaction.completed', data: {} })
    const valid = sign(rawBody)
    const signature = `${valid};h1=${'0'.repeat(64)}`
    const result = await handleWebhook(CONFIG, { rawBody, signature }, deps)
    expect(result.status).toBe(200)
  })

  it('syncs a subscription.updated event to the DB', async () => {
    const state: WebhookState = { inserts: [] }
    const event = {
      event_type: 'subscription.updated',
      occurred_at: '2023-11-14T22:13:20.000Z',
      data: {
        id: 'sub_1',
        customer_id: 'ctm_1',
        status: 'active',
        current_billing_period: { ends_at: '2023-11-14T22:13:20.000Z' },
        scheduled_change: {
          action: 'cancel',
          effective_at: '2023-11-14T22:13:20.000Z',
        },
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
      provider: 'paddle_sandbox',
      status: 'active',
      scheduled_change_action: 'cancel',
      scheduled_change_effective_at: '2023-11-14T22:13:20.000Z',
      provider_event_time: '2023-11-14T22:13:20.000Z',
    })
  })

  it('ignores unrelated events with 200', async () => {
    const rawBody = JSON.stringify({ event_type: 'transaction.completed', data: {} })
    const deps = makeWebhookDeps({ inserts: [] })
    const result = await handleWebhook(CONFIG, { rawBody, signature: sign(rawBody) }, deps)
    expect(result.status).toBe(200)
  })
})
