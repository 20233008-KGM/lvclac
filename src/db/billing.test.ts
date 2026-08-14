import { describe, expect, it } from 'vitest'
import { clientSubscriptionProviders, isActiveSubscription } from './billing'

describe('subscription entitlement providers', () => {
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
