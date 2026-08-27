import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { resolveBillingView } from './billingView'

const source = readFileSync(resolve('src/components/billing/BillingPage.tsx'), 'utf8')

describe('resolveBillingView', () => {
  it('opens authentication before attempting checkout for a signed-out visitor', () => {
    expect(source).toMatch(
      /if \(!user\) \{\s+setAuthModalOpen\(true\)\s+return\s+\}/,
    )
    expect(source).toContain('<AuthModal onClose={() => setAuthModalOpen(false)} />')
  })

  it('keeps the billing page neutral while subscription state is loading', () => {
    expect(
      resolveBillingView({
        authLoading: true,
        checkoutSucceeded: false,
        isPro: false,
        subscriptionStatus: null,
      }),
    ).toBe('loading')
  })

  it('shows the checkout success view before the refreshed subscription arrives', () => {
    expect(
      resolveBillingView({
        authLoading: true,
        checkoutSucceeded: true,
        isPro: false,
        subscriptionStatus: null,
      }),
    ).toBe('success')
  })

  it('resolves settled subscription states without changing their existing behavior', () => {
    expect(
      resolveBillingView({
        authLoading: false,
        checkoutSucceeded: false,
        isPro: true,
        subscriptionStatus: 'active',
      }),
    ).toBe('pro')
    expect(
      resolveBillingView({
        authLoading: false,
        checkoutSucceeded: false,
        isPro: false,
        subscriptionStatus: 'past_due',
      }),
    ).toBe('failed')
    expect(
      resolveBillingView({
        authLoading: false,
        checkoutSucceeded: false,
        isPro: false,
        subscriptionStatus: null,
      }),
    ).toBe('free')
  })
})
