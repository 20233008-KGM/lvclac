import { describe, expect, it } from 'vitest'
import { isCancellationScheduled, subscriptionAccessEnd } from './subscriptionPresentation'

describe('subscription cancellation presentation', () => {
  const base = {
    status: 'active',
    currentPeriodEnd: '2027-08-02T00:00:00.000Z',
    scheduledChangeAction: null,
    scheduledChangeEffectiveAt: null,
  }

  it('distinguishes an active subscription with a scheduled cancellation', () => {
    const subscription = {
      ...base,
      scheduledChangeAction: 'cancel',
      scheduledChangeEffectiveAt: '2027-08-02T00:00:00.000Z',
    }
    expect(isCancellationScheduled(subscription)).toBe(true)
    expect(subscriptionAccessEnd(subscription)).toBe('2027-08-02T00:00:00.000Z')
  })

  it('keeps a normal active subscription on the renewal date path', () => {
    expect(isCancellationScheduled(base)).toBe(false)
    expect(subscriptionAccessEnd(base)).toBe(base.currentPeriodEnd)
  })
})
