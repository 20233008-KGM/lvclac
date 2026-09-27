import { describe, expect, it, vi } from 'vitest'
import { handleSubscriptionSummary } from './billingHandlers'
import type { BillingConfig, BillingDeps } from './billingConfig'

const config: BillingConfig = {
  paddleApiKey: 'test-key', webhookSecret: 'test-secret', paddleEnv: 'live',
  supabaseUrl: 'https://example.supabase.co', serviceRoleKey: 'test-service',
  prices: { monthly: 'pri_month', yearly: 'pri_year' },
}

function fixture(data: Record<string, unknown> | null, options: { owned?: boolean; authorized?: boolean; ok?: boolean } = {}) {
  const chain = {
    select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: options.owned === false ? null : { provider_subscription_id: 'sub_owned' }, error: null }),
  }
  const fetch = vi.fn().mockResolvedValue({ ok: options.ok !== false, status: options.ok === false ? 403 : 200, json: async () => ({ data }) })
  const deps = {
    admin: { auth: { getUser: async () => ({ data: { user: options.authorized === false ? null : { id: 'owner' } }, error: null }) }, from: () => chain }, fetch,
  } as unknown as BillingDeps
  return { deps, fetch, chain }
}

const monthly = {
  status: 'active', currency_code: 'USD', items: [{ price: { id: 'pri_month' }, quantity: 1 }],
  next_billed_at: '2026-10-27T00:00:00Z', current_billing_period: { ends_at: '2026-10-27T00:00:00Z' }, scheduled_change: null,
  recurring_transaction_details: { totals: { total: '550', grand_total: '450', currency_code: 'USD' } },
}

describe('read-only subscription summary', () => {
  it('requires a valid login and an owned subscription before contacting Paddle', async () => {
    for (const [token, options, status] of [
      [undefined, {}, 401], ['invalid', { authorized: false }, 401], ['valid', { owned: false }, 400],
    ] as const) {
      const { deps, fetch } = fixture(monthly, options)
      expect((await handleSubscriptionSummary(config, { accessToken: token }, deps)).status).toBe(status)
      expect(fetch).not.toHaveBeenCalled()
    }
  })

  it('reads only the owner in the current environment and returns recurring tax-inclusive totals', async () => {
    const { deps, fetch, chain } = fixture(monthly)
    const result = await handleSubscriptionSummary(config, { accessToken: 'valid' }, deps)
    expect(chain.eq).toHaveBeenCalledWith('user_id', 'owner')
    expect(chain.in).toHaveBeenCalledWith('provider', ['paddle_live'])
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch).toHaveBeenCalledWith('https://api.paddle.com/subscriptions/sub_owned?include=recurring_transaction_details', {
      method: 'GET', headers: { authorization: 'Bearer test-key' },
    })
    expect(result.body.summary).toMatchObject({ plan: 'monthly', recurringAmount: '550', currencyCode: 'USD', canSwitchYearly: true })
    expect(JSON.stringify(result.body)).not.toContain('sub_owned')
    expect(JSON.stringify(result.body)).not.toContain('test-key')
  })

  it('distinguishes yearly, canceled, scheduled and unknown plans without offering an invalid switch', async () => {
    for (const override of [
      { items: [{ price: { id: 'pri_year' } }] },
      { status: 'canceled', next_billed_at: null },
      { scheduled_change: { action: 'cancel', effective_at: '2026-10-27T00:00:00Z' } },
      { items: [{ price: { id: 'pri_unknown' } }] },
      { items: [...monthly.items, ...monthly.items] },
    ]) {
      const { deps } = fixture({ ...monthly, ...override })
      const result = await handleSubscriptionSummary(config, { accessToken: 'valid' }, deps)
      expect(result.body.summary?.canSwitchYearly).toBe(false)
    }
  })

  it('preserves a verified zero and treats missing or invalid amounts as unknown', async () => {
    for (const [amount, expected] of [['0', '0'], [null, null], ['NaN', null], ['-1', null]] as const) {
      const { deps } = fixture({ ...monthly, recurring_transaction_details: { totals: { total: amount } } })
      expect((await handleSubscriptionSummary(config, { accessToken: 'valid' }, deps)).body.summary?.recurringAmount).toBe(expected)
    }
  })

  it('returns unavailable instead of inventing a price when Paddle fails or sends an invalid payload', async () => {
    for (const [data, options] of [[monthly, { ok: false }], [null, {}]] as const) {
      const { deps } = fixture(data, options)
      const result = await handleSubscriptionSummary(config, { accessToken: 'valid' }, deps)
      expect(result.status).toBe(502)
      expect(result.body.summary).toBeUndefined()
    }
  })
})
