import { afterEach, describe, expect, it, vi } from 'vitest'
import { clientSubscriptionProviders, fetchSubscription, isActiveSubscription } from './billing'

const query = vi.hoisted(() => ({
  from: vi.fn(), select: vi.fn(), eq: vi.fn(), in: vi.fn(),
  order: vi.fn(), limit: vi.fn(), maybeSingle: vi.fn(),
}))
vi.mock('./supabaseClient', () => ({ supabase: query }))

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetAllMocks()
})

describe('manual subscription lookup without Paddle configuration', () => {
  it.each([undefined, 'invalid'])('queries manual grants for environment %s', async (env) => {
    vi.stubEnv('VITE_PADDLE_ENV', env)
    for (const method of ['from', 'select', 'eq', 'in', 'order', 'limit'] as const) {
      query[method].mockReturnValue(query)
    }
    query.maybeSingle.mockResolvedValue({
      data: {
        status: 'active', current_period_end: null,
        scheduled_change_action: null, scheduled_change_effective_at: null,
      },
      error: null,
    })

    const result = await fetchSubscription('manual-pro-user')

    expect(query.from).toHaveBeenCalledWith('subscriptions')
    expect(query.eq).toHaveBeenCalledWith('user_id', 'manual-pro-user')
    expect(query.in).toHaveBeenCalledWith('provider', ['manual'])
    expect(result.error).toBeNull()
    expect(isActiveSubscription(result.data?.status)).toBe(true)
  })
})

describe('subscription entitlement providers', () => {
  it('allows only manual grants when Paddle is not configured', () => {
    expect(clientSubscriptionProviders(null)).toEqual(['manual'])
  })

  it('accepts manual grants in Live without accepting Sandbox providers', () => {
    expect(clientSubscriptionProviders('live')).toEqual(['paddle_live', 'manual'])
  })

  it('keeps legacy Paddle aliases limited to Sandbox while accepting manual grants', () => {
    expect(clientSubscriptionProviders('sandbox')).toEqual([
      'paddle_sandbox',
      'paddle',
      'manual',
    ])
  })
})

describe('isActiveSubscription', () => {
  it('only grants Pro to active and trialing rows', () => {
    expect(isActiveSubscription('active')).toBe(true)
    expect(isActiveSubscription('trialing')).toBe(true)
    expect(isActiveSubscription('canceled')).toBe(false)
    expect(isActiveSubscription(null)).toBe(false)
  })
})
