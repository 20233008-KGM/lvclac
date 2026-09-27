import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = readFileSync(resolve('src/components/billing/BillingYearlySwitchPage.tsx'), 'utf8')
const appSource = readFileSync(resolve('src/App.tsx'), 'utf8')
const routesSource = readFileSync(resolve('src/config/routes.ts'), 'utf8')

describe('BillingYearlySwitchPage', () => {
  it('has a localized route for the in-app yearly switch payment guidance page', () => {
    expect(routesSource).toContain("BILLING_YEARLY_SWITCH_PATH = '/billing/switch-yearly'")
    expect(routesSource).toContain('isBillingYearlySwitchPath')
    expect(appSource).toContain('BillingYearlySwitchPage')
    expect(appSource).toContain('if (isBillingYearlySwitchPath(pathname))')
  })

  it('previews the yearly switch before enabling the subscription update', () => {
    expect(source).toContain('previewSubscriptionToYearly')
    expect(source).toContain('switchSubscriptionToYearly')
    expect(source).toContain('page.switchYearlyPreviewImmediateAmount')
    expect(source).toContain('page.switchYearlyPreviewRecurringAmount')
    expect(source).toContain('page.switchYearlyPreviewNextBilling')
    expect(source).toContain('page.switchYearlyPreviewConfirm')
  })

  it('renders a first-party white payment guidance surface instead of opening the portal', () => {
    expect(source).toContain('billing-switch-page')
    expect(source).toContain('billing-switch-card')
    expect(source).toContain('Paddle')
    expect(source).not.toContain('openYearlySwitchPortal')
    expect(source).not.toContain('/api/billing/portal')
  })
})
