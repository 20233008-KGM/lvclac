import { expect, test, type Page } from '@playwright/test'

const preview = {
  action: 'preview_yearly', amount: '4304', currencyCode: 'USD',
  recurringAmount: '4800', nextBilledAt: '2027-09-27T09:00:00Z',
}

async function setup(page: Page, options: {
  locale?: 'ko' | 'en'
  signedOut?: boolean
  preview?: Record<string, unknown> | null
  previewError?: string
  switchError?: string
} = {}) {
  let calls = 0
  let releasePayment: (() => void) | undefined
  // Keep all fixture traffic local: these tests never contact Paddle or Supabase.
  await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1'
    ? route.continue() : route.abort())
  await page.addInitScript(locale => localStorage.setItem('leverage_locale', locale), options.locale ?? 'ko')
  await page.route('**/src/context/AuthContext.tsx*', route => route.fulfill({
    contentType: 'application/javascript',
    body: `const user = ${options.signedOut ? 'null' : '{ id: "billing-test" }'};
      export const useAuth = () => ({ user, loading: false, refreshSubscription: async () => {} });`,
  }))
  await page.route('**/src/db/billing.ts*', route => route.fulfill({
    contentType: 'application/javascript',
    body: `export const previewSubscriptionToYearly = () => fetch('/__billing-test/preview').then(r => r.json());
      export const switchSubscriptionToYearly = () => fetch('/__billing-test/switch', { method: 'POST' }).then(r => r.json());`,
  }))
  await page.route('**/__billing-test/preview', route => route.fulfill({ json: {
    preview: options.preview === undefined ? preview : options.preview,
    error: options.previewError ?? null,
  } }))
  await page.route('**/__billing-test/switch', async route => {
    calls++
    await new Promise<void>(resolve => { releasePayment = resolve })
    await route.fulfill({ json: { action: 'switched_to_yearly', error: options.switchError ?? null } })
  })
  await page.goto('/e2e/fixtures/billing-switch.html')
  return { calls: () => calls, release: () => releasePayment?.() }
}

test('requires explicit consent, preserves policy access, and sends one payment request', async ({ page }) => {
  const billing = await setup(page)
  const pay = page.getByRole('button', { name: 'US$43.04 결제하고 전환' })
  const consent = page.getByRole('checkbox')
  await expect(pay).toBeDisabled()
  await expect(consent).not.toBeChecked()
  await pay.dispatchEvent('click')
  expect(billing.calls()).toBe(0)
  const terms = page.getByRole('link', { name: '이용약관', exact: true })
  await expect(terms).toHaveAttribute('href', '/terms')
  await expect(terms).toHaveAttribute('target', '_blank')
  await expect(page.getByRole('link', { name: '환불 정책' })).toHaveAttribute('href', '/refund-policy')
  await expect(page.getByRole('link', { name: 'Paddle 구매자 약관' })).toHaveAttribute('href', 'https://www.paddle.com/legal/buyer-terms')
  await consent.focus()
  await page.keyboard.press('Space')
  await expect(pay).toBeEnabled()
  await consent.uncheck()
  await expect(pay).toBeDisabled()
  await consent.check()
  await page.reload()
  await expect(consent).not.toBeChecked()
  await expect(pay).toBeDisabled()
  await consent.check()
  await pay.click()
  await expect.poll(billing.calls).toBe(1)
  const processing = page.getByRole('button', { name: '연간 전환 처리 중…' })
  await expect(processing).toBeDisabled()
  await expect(consent).toBeDisabled()
  await expect(page.getByRole('button', { name: '취소' })).toBeDisabled()
  await processing.dispatchEvent('click')
  expect(billing.calls()).toBe(1)
  billing.release()
  await expect(page.getByRole('status')).toContainText('연간 구독으로 전환했습니다')
  await expect(consent).toHaveCount(0)
})

for (const locale of ['ko', 'en'] as const) {
  test(`${locale} receipt remains readable at desktop and narrow mobile widths`, async ({ page }) => {
    await setup(page, { locale })
    await expect(page.getByRole('checkbox')).toBeVisible()
    for (const width of [1280, 390, 320]) {
      await page.setViewportSize({ width, height: 950 })
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      const card = page.locator('.billing-switch-card')
      await expect(card).toContainText(locale === 'ko' ? 'US$43.04' : '$43.04')
      await expect(card).toContainText(locale === 'ko' ? '2027년 9월 27일' : 'September 27, 2027')
      await page.screenshot({ path: `test-results/billing-switch-${locale}-${width}.png`, fullPage: true })
    }
    if (locale === 'en') {
      await expect(page.getByRole('link', { name: 'Terms of service', exact: true })).toHaveAttribute('href', '/en/terms')
      await expect(page.getByRole('link', { name: 'Refund policy', exact: true })).toHaveAttribute('href', '/en/refund-policy')
    }
  })
}

test('missing payment details cannot be confirmed or mistaken for zero', async ({ page }) => {
  await setup(page, { preview: { ...preview, amount: null } })
  await page.getByRole('checkbox').check()
  await expect(page.getByRole('button', { name: '연간으로 전환', exact: true })).toBeDisabled()
  await expect(page.locator('.billing-switch-receipt__note')).toContainText('결제 금액을 확인하지 못했습니다')
})

test('a confirmed zero charge can still switch after consent', async ({ page }) => {
  await setup(page, { preview: { ...preview, amount: '0' } })
  const action = page.getByRole('button', { name: '연간으로 전환', exact: true })
  await expect(action).toBeDisabled()
  await page.getByRole('checkbox').check()
  await expect(action).toBeEnabled()
  await expect(page.locator('.billing-switch-summary__primary')).toContainText('US$0.00')
})

test('preview errors and signed-out access offer no payment action', async ({ page }) => {
  await setup(page, { previewError: 'subscription_preview_failed', preview: null })
  await expect(page.getByRole('status')).toContainText('결제 금액을 계산하지 못했습니다')
  await expect(page.getByRole('checkbox')).toHaveCount(0)
  await expect(page.locator('.billing-switch-actions__primary')).toHaveCount(0)
  await setup(page, { signedOut: true })
  await expect(page.getByRole('status')).toContainText('로그인 세션을 확인하지 못했습니다')
  await expect(page.locator('.billing-switch-actions__primary')).toHaveCount(0)
})

test('payment failure shows the error without leaving an active payment button', async ({ page }) => {
  const billing = await setup(page, { switchError: 'subscription_update_failed' })
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'US$43.04 결제하고 전환' }).click()
  await expect.poll(billing.calls).toBe(1)
  billing.release()
  await expect(page.getByRole('status')).toContainText('연간 전환 결제를 완료하지 못했습니다')
  await expect(page.locator('.billing-switch-actions__primary')).toHaveCount(0)
  await expect(page.getByRole('button', { name: '취소' })).toBeEnabled()
})
