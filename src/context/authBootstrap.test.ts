import { describe, expect, it } from 'vitest'
import { shouldHydrateAuthSession } from './authBootstrap'

describe('auth bootstrap hydration', () => {
  it('hydrates the initial signed-in session once', () => {
    expect(shouldHydrateAuthSession({
      event: 'INITIAL_SESSION',
      sessionUserId: 'user-a',
      hydratedUserId: null,
      hydratingUserId: null,
    })).toBe(true)

    expect(shouldHydrateAuthSession({
      event: 'SIGNED_IN',
      sessionUserId: 'user-a',
      hydratedUserId: null,
      hydratingUserId: 'user-a',
    })).toBe(false)
  })

  it('ignores repeated same-user sign-in and token refresh events', () => {
    expect(shouldHydrateAuthSession({
      event: 'SIGNED_IN',
      sessionUserId: 'user-a',
      hydratedUserId: 'user-a',
      hydratingUserId: null,
    })).toBe(false)
    expect(shouldHydrateAuthSession({
      event: 'TOKEN_REFRESHED',
      sessionUserId: 'user-a',
      hydratedUserId: null,
      hydratingUserId: null,
    })).toBe(false)
  })

  it('refreshes account data after a user update or account switch', () => {
    expect(shouldHydrateAuthSession({
      event: 'USER_UPDATED',
      sessionUserId: 'user-a',
      hydratedUserId: 'user-a',
      hydratingUserId: null,
    })).toBe(true)
    expect(shouldHydrateAuthSession({
      event: 'USER_UPDATED',
      sessionUserId: 'user-a',
      hydratedUserId: 'user-a',
      hydratingUserId: 'user-a',
    })).toBe(false)
    expect(shouldHydrateAuthSession({
      event: 'SIGNED_IN',
      sessionUserId: 'user-b',
      hydratedUserId: 'user-a',
      hydratingUserId: null,
    })).toBe(true)
  })

  it('still processes a signed-out session so local account state is cleared', () => {
    expect(shouldHydrateAuthSession({
      event: 'SIGNED_OUT',
      sessionUserId: null,
      hydratedUserId: 'user-a',
      hydratingUserId: null,
    })).toBe(true)
  })
})
