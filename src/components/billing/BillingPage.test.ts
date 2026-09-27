import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { resolveBillingView } from './billingView'

const source = readFileSync(resolve('src/components/billing/BillingPage.tsx'), 'utf8')
const panelSource = readFileSync(resolve('src/components/billing/BillingPanel.tsx'), 'utf8')

describe('resolveBillingView', () => {
  it('opens authentication before attempting checkout for a signed-out visitor', () => {
    expect(source).toMatch(
      /if \(!user\) \{\s+setAuthModalOpen\(true\)\s+return\s+\}/,
    )
    expect(source).toContain('<AuthModal onClose={() => setAuthModalOpen(false)} />')
  })

  it('offers a first-party yearly switch action for active subscribers', () => {
    expect(source).toContain('BILLING_YEARLY_SWITCH_PATH')
    expect(source).not.toContain('previewSubscriptionToYearly')
    expect(source).not.toContain('switchSubscriptionToYearly')
    expect(source).toContain('page.switchYearlyAction')
  })

  it('routes active subscribers to the in-app yearly switch payment page', () => {
    expect(source).toContain('navigate(yearlySwitchHref)')
    expect(source).not.toContain('openYearlySwitchPortal')
    expect(source).not.toContain('const error = await openYearlySwitchPortal()')
  })

  it('keeps yearly switch preview and update work out of the management page', () => {
    expect(source).not.toContain('switchYearlyMessage')
    expect(source).not.toContain('setSwitchYearlyMessage')
    expect(source).not.toContain('switchSubscriptionToYearly')
  })

  it('clears only the customer portal busy state after returning from Paddle', () => {
    expect(source).toContain("window.addEventListener('pageshow', clearPortalBusy)")
    expect(source).toContain("document.addEventListener('visibilitychange', handleVisibilityChange)")
    expect(source).toContain("current === 'portal' ? null : current")
    expect(panelSource).toContain("window.addEventListener('pageshow', clearPortalBusy)")
    expect(panelSource).toContain("document.addEventListener('visibilitychange', handleVisibilityChange)")
    expect(panelSource).toContain("current === 'portal' ? null : current")
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

  it('keeps the checkout success view while webhook synchronization is pending', () => {
    expect(source).toContain('CHECKOUT_REFRESH_DELAYS')
    expect(source).toContain('checkoutPending')
    expect(source).toContain('void refreshSubscription().then(() =>')
    expect(source).toContain("checkoutSucceeded: checkoutParam === 'success' && (!leftSuccess || (checkoutPending && !isPro))")
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
