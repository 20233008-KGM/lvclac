import { describe, expect, it } from 'vitest'
import { shouldShowSandboxSubscriptionReset } from './sandboxSubscriptionResetVisibility'

describe('shouldShowSandboxSubscriptionReset', () => {
  it('shows for any signed-in Sandbox account with an active subscription', () => {
    expect(shouldShowSandboxSubscriptionReset('sandbox', 'qa-user', 'active')).toBe(true)
    expect(shouldShowSandboxSubscriptionReset('sandbox', 'qa-user', 'trialing')).toBe(true)
  })

  it('stays hidden without a signed-in active subscription', () => {
    expect(shouldShowSandboxSubscriptionReset('sandbox', undefined, 'active')).toBe(false)
    expect(shouldShowSandboxSubscriptionReset('sandbox', 'qa-user', 'canceled')).toBe(false)
    expect(shouldShowSandboxSubscriptionReset('sandbox', 'qa-user', null)).toBe(false)
  })

  it('stays hidden outside Paddle Sandbox', () => {
    expect(shouldShowSandboxSubscriptionReset('live', 'qa-user', 'active')).toBe(false)
    expect(shouldShowSandboxSubscriptionReset(undefined, 'qa-user', 'active')).toBe(false)
  })
})
