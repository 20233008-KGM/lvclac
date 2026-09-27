import { describe, expect, it, vi } from 'vitest'
import type { BillingConfig, BillingDeps } from './billingConfig'
import { handleCancelSubscription } from './billingHandlers'

const CONFIG: BillingConfig = {
  paddleApiKey: 'test', webhookSecret: 'test', paddleEnv: 'live',
  supabaseUrl: 'https://test.supabase.co', serviceRoleKey: 'test',
  prices: { monthly: 'pri_m', yearly: 'pri_y' },
}
const END = '2027-09-28T09:00:00.000Z'
const ACTIVE = { id: 'sub_owned', customer_id: 'ctm_owned', status: 'active',
  current_billing_period: { ends_at: END }, scheduled_change: null }
const SCHEDULED = { ...ACTIVE, scheduled_change: { action: 'cancel', effective_at: END } }

function fixture(options: {
  noUser?: boolean; noSubscription?: boolean; syncError?: boolean;
  current?: Record<string, unknown>; updated?: Record<string, unknown>; lookupError?: boolean; cancelError?: boolean;
} = {}) {
  const filters: Array<[string, unknown]> = []
  const updates: Record<string, unknown>[] = []
  const from = vi.fn(() => {
    let selected = ''
    const chain = {
      select(value: string) { selected = value; return chain },
      eq(key: string, value: unknown) { filters.push([key, value]); return chain },
      in(key: string, value: unknown) { filters.push([key, value]); return chain },
      order() { return chain }, limit() { return chain }, or() { return chain },
      update(value: Record<string, unknown>) { updates.push(value); return chain },
      async maybeSingle() {
        return { data: selected === 'provider_subscription_id'
          ? options.noSubscription ? null : { provider_subscription_id: 'sub_owned' }
          : { id: 'row_owned', provider_event_time: null }, error: null }
      },
      get error() { return options.syncError ? { message: 'db unavailable' } : null },
    }
    return chain
  })
  const fetch = vi.fn(async (_input: string, init?: { method?: string }) => {
    const failed = init?.method === 'GET' ? options.lookupError : options.cancelError
    return { ok: !failed, status: failed ? 503 : 200, text: async () => '',
      json: async () => ({ data: init?.method === 'GET' ? options.current ?? ACTIVE : options.updated ?? SCHEDULED }) }
  })
  const deps = { admin: { from, auth: { getUser: async () => ({
    data: { user: options.noUser ? null : { id: 'user_owned' } }, error: null,
  }) } }, fetch } as unknown as BillingDeps
  return { deps, fetch, from, filters, updates }
}

describe('end-of-period cancellation', () => {
  it('rejects unauthenticated requests before lookup or Paddle calls', async () => {
    const f = fixture({ noUser: true })
    expect((await handleCancelSubscription(CONFIG, {}, f.deps)).status).toBe(401)
    expect((await handleCancelSubscription(CONFIG, { accessToken: 'invalid' }, f.deps)).status).toBe(401)
    expect(f.from).not.toHaveBeenCalled()
    expect(f.fetch).not.toHaveBeenCalled()
  })

  it.each(['live', 'sandbox'] as const)('uses only the authenticated owner in %s and retains access', async paddleEnv => {
    const f = fixture()
    const result = await handleCancelSubscription({ ...CONFIG, paddleEnv }, { accessToken: 'jwt' }, f.deps)
    expect(f.filters).toContainEqual(['user_id', 'user_owned'])
    expect(f.filters).toContainEqual(['provider', paddleEnv === 'live' ? ['paddle_live'] : ['paddle_sandbox', 'paddle']])
    expect(f.fetch).toHaveBeenLastCalledWith(
      `${paddleEnv === 'live' ? 'https://api.paddle.com' : 'https://sandbox-api.paddle.com'}/subscriptions/sub_owned/cancel`,
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ effective_from: 'next_billing_period' }) }),
    )
    expect(result.body.cancellation).toEqual({ status: 'active', effectiveAt: END, syncPending: false })
    expect(f.updates[0]).toMatchObject({ status: 'active', current_period_end: END,
      scheduled_change_action: 'cancel', scheduled_change_effective_at: END })
  })

  it('never contacts Paddle without an owned subscription', async () => {
    const f = fixture({ noSubscription: true })
    expect((await handleCancelSubscription(CONFIG, { accessToken: 'jwt' }, f.deps)).body.error).toBe('no_subscription')
    expect(f.fetch).not.toHaveBeenCalled()
  })

  it.each([SCHEDULED, { ...ACTIVE, status: 'canceled' }])('repeated cancellation is a read and sync only', async current => {
    const f = fixture({ current })
    expect((await handleCancelSubscription(CONFIG, { accessToken: 'jwt' }, f.deps)).body.ok).toBe(true)
    expect(f.fetch).toHaveBeenCalledTimes(1)
  })

  it.each([
    { ...ACTIVE, status: 'paused' }, { ...ACTIVE, status: 'past_due' },
    { ...ACTIVE, scheduled_change: { action: 'pause', effective_at: END } },
    { ...ACTIVE, id: 'sub_other_user' },
  ])('does not mutate unsupported or mismatched subscription state', async current => {
    const f = fixture({ current })
    expect((await handleCancelSubscription(CONFIG, { accessToken: 'jwt' }, f.deps)).body.ok).toBe(false)
    expect(f.fetch).toHaveBeenCalledTimes(1)
    expect(f.updates).toHaveLength(0)
  })

  it('reports accepted cancellation even when the DB mirror cannot refresh', async () => {
    const f = fixture({ syncError: true })
    const result = await handleCancelSubscription(CONFIG, { accessToken: 'jwt' }, f.deps)
    expect(result.body.cancellation).toEqual({ status: 'active', effectiveAt: END, syncPending: true })
  })

  it.each([{ lookupError: true }, { cancelError: true }, { updated: ACTIVE }])('never invents success on a failed or incomplete response', async options => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const f = fixture(options)
      expect((await handleCancelSubscription(CONFIG, { accessToken: 'jwt' }, f.deps)).body.ok).toBe(false)
      expect(f.updates).toHaveLength(0)
    } finally { log.mockRestore() }
  })
})
