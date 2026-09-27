import { expect, test, type Page } from '@playwright/test'

const subscription = { provider: 'paddle_live', status: 'active', currentPeriodEnd: '2026-10-27T00:00:00Z', scheduledChangeAction: null, scheduledChangeEffectiveAt: null }
const summary = { ...subscription, plan: 'monthly', recurringAmount: '550', currencyCode: 'USD', nextBilledAt: '2026-10-27T00:00:00Z', canSwitchYearly: true }

async function setup(page: Page, options: {
  locale?: 'ko' | 'en'; subscription?: Record<string, unknown>; summary?: Record<string, unknown> | null; authLoading?: boolean
} = {}) {
  let portalCalls = 0
  let summaryCalls = 0
  await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort())
  await page.addInitScript(locale => localStorage.setItem('leverage_locale', locale), options.locale ?? 'en')
  await page.route('**/src/context/AuthContext.tsx*', route => route.fulfill({ contentType: 'application/javascript', body: `
    const user = { id: 'billing-test' };
    const subscription = ${JSON.stringify(options.subscription ?? subscription)};
    export const useAuth = () => ({ user, loading: ${options.authLoading ?? false}, isPro: true, subscription, refreshSubscription: async () => {} });` }))
  await page.route('**/src/db/billing.ts*', route => route.fulfill({ contentType: 'application/javascript', body: `
    export const fetchSubscriptionSummary = () => fetch('/__billing-test/summary').then(r => r.json());
    export const openBillingPortal = () => fetch('/__billing-test/portal', { method: 'POST' }).then(() => 'network_error');
    export const startCheckout = async () => 'unexpected_checkout';
    export const controlSandboxSubscription = async () => null;` }))
  await page.route('**/__billing-test/summary', route => {
    summaryCalls++
    return route.fulfill({ json: { data: options.summary === undefined ? summary : options.summary, error: options.summary === null ? 'subscription_lookup_failed' : null } })
  })
  await page.route('**/__billing-test/portal', route => { portalCalls++; return route.fulfill({ json: {} }) })
  await page.goto('/e2e/fixtures/billing-management.html')
  return { portalCalls: () => portalCalls, summaryCalls: () => summaryCalls }
}

for (const locale of ['ko', 'en'] as const) {
  test(`${locale} management prioritizes real billing details and stays readable on mobile`, async ({ page }) => {
    await setup(page, { locale })
    await expect(page.locator('.billing-management-amount')).toContainText('5.50')
    await expect(page.locator('.billing-management-heading')).not.toContainText('Upgrade to Pro')
    const details = page.locator('.billing-management-benefits')
    await expect(details).not.toHaveAttribute('open')
    for (const width of [1280, 390, 320]) {
      await page.setViewportSize({ width, height: 950 })
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      const boxes = await page.locator('.billing-management-facts > div').evaluateAll(items => items.map(item => item.getBoundingClientRect().toJSON()))
      expect(boxes.every(box => box.x >= 0 && box.right <= width)).toBe(true)
      await page.screenshot({ path: `test-results/billing-management-${locale}-${width}.png`, fullPage: true })
    }
    await details.locator('summary').focus()
    await page.keyboard.press('Enter')
    await expect(details).toHaveAttribute('open', '')
    await expect(details).toContainText('50,000')
    await expect(page.getByRole('link', { name: locale === 'ko' ? '환불 정책' : 'Refund policy' })).toHaveAttribute('href', locale === 'ko' ? '/refund-policy' : '/en/refund-policy')
    await page.getByRole('button', { name: locale === 'ko' ? '연간으로 전환' : 'Switch to yearly' }).click()
    await expect(page).toHaveURL(locale === 'ko' ? /\/billing\/switch-yearly$/ : /\/en\/billing\/switch-yearly$/)
  })
}

test('keeps one billing portal action and a visible cancellation entry with recoverable errors', async ({ page }) => {
  const calls = await setup(page)
  await page.getByRole('button', { name: 'Open billing portal' }).click()
  await expect.poll(calls.portalCalls).toBe(1)
  await expect(page.locator('.billing-management-message')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Open billing portal' })).toBeEnabled()
  await page.getByRole('button', { name: 'Cancel subscription' }).click()
  await expect.poll(calls.portalCalls).toBe(2)
})

test('yearly plan and scheduled cancellation show the correct amount, end date and actions', async ({ page }) => {
  await setup(page, { summary: { ...summary, plan: 'yearly', recurringAmount: '4800', canSwitchYearly: false, scheduledChangeAction: 'cancel', scheduledChangeEffectiveAt: '2027-09-27T00:00:00Z', nextBilledAt: null } })
  await expect(page.locator('.billing-management-status')).toContainText('Cancellation scheduled')
  await expect(page.locator('.billing-management-facts')).toContainText('$48.00')
  await expect(page.locator('.billing-management-facts')).toContainText('Access ends on')
  await expect(page.locator('.billing-management-facts')).toContainText('2027')
  await expect(page.locator('.billing-management-facts')).not.toContainText('Next billing date')
  await expect(page.getByRole('button', { name: 'Switch to yearly' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Manage cancellation' })).toBeVisible()
})

test('manual Pro has no invented charge, renewal, or Paddle actions', async ({ page }) => {
  const calls = await setup(page, { subscription: { ...subscription, provider: 'manual', currentPeriodEnd: null } })
  await expect(page.locator('.billing-management-facts')).toContainText('Complimentary access')
  await expect(page.locator('.billing-management-facts')).toContainText('No automatic renewal')
  await expect(page.locator('.billing-management')).not.toContainText('$')
  await expect(page.getByRole('button')).toHaveCount(0)
  expect(calls.summaryCalls()).toBe(0)
})

test('failed lookup preserves known Pro status without inventing a monthly price', async ({ page }) => {
  await setup(page, { summary: null })
  await expect(page.locator('.billing-management-status')).toHaveText('Active')
  await expect(page.getByRole('status')).toContainText('Some billing details are unavailable')
  await expect(page.locator('.billing-management-facts')).not.toContainText('$')
  await expect(page.getByRole('button', { name: 'Switch to yearly' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Open billing portal' })).toBeEnabled()
})

test('zero and zero-decimal currencies format correctly without implying a missing renewal', async ({ page }) => {
  await setup(page, { summary: { ...summary, currencyCode: 'JPY', recurringAmount: '500', nextBilledAt: null } })
  await expect(page.locator('.billing-management-amount')).toHaveText('¥500/ mo')
  await expect(page.locator('.billing-management-facts > div').last()).toContainText('Check billing portal')
  await setup(page, { summary: { ...summary, recurringAmount: '0' } })
  await expect(page.locator('.billing-management-amount')).toHaveText('$0.00/ mo')
})

test('authentication loading does not flash a Pro price or upgrade pitch', async ({ page }) => {
  await setup(page, { authLoading: true })
  await expect(page.getByRole('status')).toBeVisible()
  await expect(page.locator('.billing-management')).toHaveCount(0)
  await expect(page.locator('.billing-up')).toHaveCount(0)
})
