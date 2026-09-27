import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  clientSubscriptionProviders,
  cancelSubscription,
  fetchSubscription,
  isActiveSubscription,
  previewSubscriptionToYearly,
  startCheckout,
  switchSubscriptionToYearly,
} from './billing'

const query = vi.hoisted(() => ({
  from: vi.fn(), select: vi.fn(), eq: vi.fn(), in: vi.fn(),
  order: vi.fn(), limit: vi.fn(), maybeSingle: vi.fn(),
  auth: { getSession: vi.fn() },
}))
vi.mock('./supabaseClient', () => ({ supabase: query }))

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
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

describe('cancelSubscription', () => {
  it('authenticates without accepting a client-selected subscription or cancellation mode', async () => {
    query.auth.getSession.mockResolvedValue({ data: { session: { access_token: 'jwt-token' } } })
    const cancellation = { status: 'active', effectiveAt: '2027-09-28T09:00:00Z', syncPending: false }
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ cancellation }) })
    vi.stubGlobal('fetch', fetchMock)
    expect(await cancelSubscription()).toEqual({ data: cancellation, error: null })
    expect(fetchMock).toHaveBeenCalledWith('/api/billing/cancel-subscription', {
      method: 'POST', headers: { 'content-type': 'application/json', Authorization: 'Bearer jwt-token' }, body: '{}',
    })
  })

  it('rejects incomplete success responses', async () => {
    query.auth.getSession.mockResolvedValue({ data: { session: null } })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ cancellation: { status: 'active', effectiveAt: null } }) }))
    expect((await cancelSubscription()).error).toBe('subscription_payload_missing')
  })
})

describe('switchSubscriptionToYearly', () => {
  it('previews the yearly switch before the app commits the subscription update', async () => {
    query.auth.getSession.mockResolvedValue({
      data: { session: { access_token: 'jwt-token' } },
    })
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      async json() {
        return {
          ok: true,
          preview: {
            action: 'preview_yearly',
            amount: '3300',
            currencyCode: 'USD',
            recurringAmount: '4800',
            nextBilledAt: '2027-01-15T00:00:00.000Z',
          },
        }
      },
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await previewSubscriptionToYearly()

    expect(fetchMock).toHaveBeenCalledWith('/api/billing/switch-yearly-preview', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: 'Bearer jwt-token',
      },
      body: JSON.stringify({}),
    })
    expect(result.preview?.amount).toBe('3300')
    expect(result.error).toBeNull()
  })

  it('posts to the yearly switch endpoint with the signed-in session token', async () => {
    query.auth.getSession.mockResolvedValue({
      data: { session: { access_token: 'jwt-token' } },
    })
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      async json() {
        return { ok: true, action: 'switched_to_yearly' }
      },
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await switchSubscriptionToYearly()

    expect(fetchMock).toHaveBeenCalledWith('/api/billing/switch-yearly', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: 'Bearer jwt-token',
      },
      body: JSON.stringify({}),
    })
    expect(result).toEqual({ action: 'switched_to_yearly', error: null })
  })
})

describe('Paddle overlay checkout history', () => {
  let checkoutRun = 0

  function installCheckoutWindow() {
    const listeners: Record<string, Array<(event: unknown) => void>> = {}
    const paddle = {
      Initialize: vi.fn(),
      Checkout: { open: vi.fn(), close: vi.fn() },
    }
    const fakeWindow = {
      Paddle: paddle,
      location: { pathname: '/billing', search: '', hash: '' },
      history: {
        state: null as Record<string, unknown> | null,
        pushState: vi.fn((state: Record<string, unknown> | null) => {
          fakeWindow.history.state = state
        }),
        back: vi.fn(() => {
          for (const listener of listeners.popstate ?? []) listener({ state: null })
        }),
      },
      addEventListener: vi.fn((type: string, listener: (event: unknown) => void) => {
        listeners[type] = [...(listeners[type] ?? []), listener]
      }),
      removeEventListener: vi.fn(),
    }
    vi.stubGlobal('window', fakeWindow)
    return { fakeWindow, listeners, paddle }
  }

  async function openCheckout() {
    checkoutRun += 1
    vi.stubEnv('VITE_PADDLE_CLIENT_TOKEN', `client-token-${checkoutRun}`)
    vi.stubEnv('VITE_PADDLE_ENV', 'live')
    query.auth.getSession.mockResolvedValue({
      data: { session: { access_token: 'jwt-token' } },
    })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        async json() {
          return {
            ok: true,
            priceId: 'pri_monthly',
            successUrl: 'https://liqguard.com/my?checkout=success',
          }
        },
      }),
    )

    return startCheckout('monthly')
  }

  it('closes the Paddle overlay when the browser back button pops the checkout marker', async () => {
    const { fakeWindow, listeners, paddle } = installCheckoutWindow()

    await expect(openCheckout()).resolves.toBeNull()
    expect(fakeWindow.history.pushState).toHaveBeenCalledWith(
      { paddleCheckoutOverlay: true },
      '',
      '/billing',
    )

    listeners.popstate?.[0]?.({ state: null })

    expect(paddle.Checkout.close).toHaveBeenCalledTimes(1)
  })

  it('removes the checkout history marker when Paddle is closed with its own close button', async () => {
    const { fakeWindow, paddle } = installCheckoutWindow()

    await expect(openCheckout()).resolves.toBeNull()
    const initializeOptions = paddle.Initialize.mock.calls[0]?.[0] as {
      eventCallback?: (event: { name: string }) => void
    }
    initializeOptions.eventCallback?.({ name: 'checkout.closed' })

    expect(fakeWindow.history.back).toHaveBeenCalledTimes(1)
    expect(paddle.Checkout.close).not.toHaveBeenCalled()
  })
})
