import { expect, test, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'

const END = '2027-09-28T09:00:00Z'
const summary = { status: 'active', plan: 'yearly', currentPeriodEnd: END,
  nextBilledAt: END, scheduledChangeAction: null, scheduledChangeEffectiveAt: null }

async function setup(page: Page, options: {
  locale?: 'ko' | 'en'; signedOut?: boolean; summary?: Record<string, unknown> | null;
  cancelError?: string; syncPending?: boolean; refreshFails?: boolean;
} = {}) {
  let calls = 0
  let release: (() => void) | undefined
  let data = options.summary === undefined ? summary : options.summary
  await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort())
  await page.addInitScript(locale => localStorage.setItem('leverage_locale', locale), options.locale ?? 'ko')
  await page.route('**/src/context/AuthContext.tsx*', route => route.fulfill({ contentType: 'application/javascript', body: `
    const user = ${options.signedOut ? 'null' : '{ id: "cancel-test" }'};
    export const useAuth = () => ({ user, loading: false, refreshSubscription: async () => { ${options.refreshFails ? 'throw new Error("offline")' : ''} } });` }))
  await page.route('**/src/db/billing.ts*', route => route.fulfill({ contentType: 'application/javascript', body: `
    export const fetchSubscriptionSummary = () => fetch('/__cancel-test/summary').then(r => r.json());
    export const cancelSubscription = () => fetch('/__cancel-test/cancel', { method: 'POST' }).then(r => r.json());` }))
  await page.route('**/__cancel-test/summary', route => route.fulfill({ json: {
    data, error: data ? null : 'subscription_lookup_failed',
  } }))
  await page.route('**/__cancel-test/cancel', async route => {
    calls++
    await new Promise<void>(resolve => { release = resolve })
    if (!options.cancelError) data = { ...summary, scheduledChangeAction: 'cancel', scheduledChangeEffectiveAt: END }
    await route.fulfill({ json: { error: options.cancelError ?? null,
      data: options.cancelError ? null : { status: 'active', effectiveAt: END, syncPending: options.syncPending ?? false } } })
  })
  await page.goto('/e2e/fixtures/billing-cancel.html')
  return { calls: () => calls, release: () => release?.(), setSummary: (value: typeof data) => { data = value } }
}

for (const locale of ['ko', 'en'] as const) {
  test(`${locale} brand returns to the localized calculator without canceling`, async ({ page }) => {
    const f = await setup(page, { locale })
    const brand = page.getByRole('link', { name: 'LiqGuard', exact: true })
    await expect(brand).toHaveAttribute('href', locale === 'ko' ? '/' : '/en')
    await brand.focus()
    await expect(brand).toHaveCSS('outline-style', 'solid')
    await brand.press('Enter')
    await expect(page).toHaveURL(locale === 'ko' ? /\/$/ : /\/en$/)
    expect(f.calls()).toBe(0)
  })

  test(`${locale} canceled receipt keeps the paid access date after reload`, async ({ page }) => {
    const f = await setup(page, { locale, summary: { ...summary, scheduledChangeAction: 'cancel', scheduledChangeEffectiveAt: END } })
    const title = locale === 'ko' ? '구독이 취소되었습니다' : 'Your subscription has been canceled'
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible()
    await expect(page.locator('.billing-switch-card__header')).toContainText(locale === 'ko' ? '자동갱신이 중단되었습니다' : 'Automatic renewal is off')
    await expect(page.locator('.billing-cancel-summary')).toContainText(locale === 'ko' ? '2027년 9월 28일' : 'September 28, 2027')
    await page.reload()
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible()
    await expect(page.locator('.billing-cancel-confirm')).toHaveCount(0)
    for (const width of [1280, 390, 320]) {
      await page.setViewportSize({ width, height: 900 })
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      await page.screenshot({ path: `test-results/billing-canceled-${locale}-${width}.png`, fullPage: true })
    }
    expect(f.calls()).toBe(0)
  })

  test(`${locale} read-only local billing never offers a cancellation action`, async ({ page }) => {
    const f = await setup(page, { locale, summary: { ...summary, cancellationAvailable: false } })
    await expect(page.getByRole('alert')).toContainText(locale === 'ko' ? '구독 조회는 가능하지만' : 'You can view your subscription here')
    await expect(page.getByRole('button', { name: locale === 'ko' ? '구독 취소' : 'Cancel subscription', exact: true })).toHaveCount(0)
    await expect(page.getByRole('button', { name: locale === 'ko' ? '상태 다시 확인' : 'Check status again' })).toHaveCount(0)
    await expect(page.locator('.billing-cancel-summary')).toContainText(locale === 'ko' ? '연간' : 'Yearly')
    expect(f.calls()).toBe(0)
    for (const width of [1280, 390, 320]) {
      await page.setViewportSize({ width, height: 900 })
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      await page.screenshot({ path: `test-results/billing-cancel-read-only-${locale}-${width}.png`, fullPage: true })
    }
  })

  test(`${locale} receipt explains cancellation and stays readable at desktop and mobile widths`, async ({ page }) => {
    const f = await setup(page, { locale })
    const action = page.getByRole('button', { name: locale === 'ko' ? '구독 취소' : 'Cancel subscription', exact: true })
    await expect(action).toBeEnabled()
    await expect(page.locator('.billing-cancel-notice')).toContainText(locale === 'ko' ? '환불되지 않습니다' : 'does not refund')
    await expect(page.locator('.billing-cancel-summary')).toContainText(locale === 'ko' ? '2027년 9월 28일' : 'September 28, 2027')
    for (const width of [1280, 390, 320]) {
      await page.setViewportSize({ width, height: 900 })
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      const brand = page.locator('.billing-switch-card__brand img')
      expect(await brand.evaluate(img => (img as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
      const rows = await page.locator('.billing-cancel-summary > div').evaluateAll(items => items.map(item => {
        const label = item.querySelector('dt')!.getBoundingClientRect()
        const value = item.querySelector('dd')!.getBoundingClientRect()
        return label.right <= value.left || label.bottom <= value.top
      }))
      expect(rows.every(Boolean)).toBe(true)
      await page.screenshot({ path: `test-results/billing-cancel-${locale}-${width}.png`, fullPage: true })
    }
    expect(f.calls()).toBe(0)
    await page.getByRole('button', { name: locale === 'ko' ? '구독 유지하고 돌아가기' : 'Keep subscription & go back' }).click()
    await expect(page).toHaveURL(locale === 'ko' ? /\/billing$/ : /\/en\/billing$/)
    expect(f.calls()).toBe(0)
  })
}

test('cancel stays red when shared styles load later, but processing stays disabled gray', async ({ page }) => {
  const f = await setup(page)
  const action = page.getByRole('button', { name: '구독 취소', exact: true })
  await expect(action).toBeEnabled()
  // Production can append the shared lazy-page stylesheet after cancellation styles.
  await page.addStyleTag({ content: await readFile(new URL('../src/styles/pages.css', import.meta.url), 'utf8') })
  await expect(action).toHaveCSS('background-color', 'rgb(179, 52, 43)')
  await action.focus()
  await expect(action).toHaveCSS('background-color', 'rgb(179, 52, 43)')
  await action.hover()
  await expect(action).toHaveCSS('background-color', 'rgb(146, 42, 35)')
  await action.click()
  await expect.poll(f.calls).toBe(1)
  const processing = page.locator('.billing-cancel-confirm')
  await expect(processing).toBeDisabled()
  await expect(processing).toHaveCSS('background-color', 'rgb(233, 236, 240)')
  const brand = page.getByRole('link', { name: 'LiqGuard', exact: true })
  await expect(brand).toHaveAttribute('aria-disabled', 'true')
  await brand.dispatchEvent('click')
  await expect(page).toHaveURL(/\/e2e\/fixtures\/billing-cancel.html$/)
  f.release()
  await expect(page.getByRole('button', { name: '구독 관리로 돌아가기' })).toHaveCSS('background-color', 'rgb(36, 91, 212)')
})

test('confirmation sends one request, keeps Pro through the end date, and survives reload', async ({ page }) => {
  const f = await setup(page, { refreshFails: true })
  const action = page.getByRole('button', { name: '구독 취소', exact: true })
  await action.click()
  await expect.poll(f.calls).toBe(1)
  const processing = page.getByRole('button', { name: '구독 취소 처리 중…' })
  await expect(processing).toBeDisabled()
  await processing.dispatchEvent('click')
  expect(f.calls()).toBe(1)
  f.release()
  await expect(page.getByRole('heading', { name: '구독이 취소되었습니다' })).toBeVisible()
  await expect(page.getByRole('status')).toContainText('Pro 기능은 그대로 유지')
  await expect(action).toHaveCount(0)
  await page.reload()
  await expect(page.getByRole('heading', { name: '구독이 취소되었습니다' })).toBeVisible()
  await expect(action).toHaveCount(0)
})

test('accepted cancellation with pending sync is not presented as a failure', async ({ page }) => {
  const f = await setup(page, { syncPending: true })
  await page.getByRole('button', { name: '구독 취소', exact: true }).click()
  await expect.poll(f.calls).toBe(1)
  f.release()
  await expect(page.getByRole('status')).toContainText('취소는 접수되었습니다')
  await expect(page.getByRole('alert')).toHaveCount(0)
})

test('a failed request requires checking current status before retrying', async ({ page }) => {
  const f = await setup(page, { cancelError: 'subscription_cancel_failed' })
  await page.getByRole('button', { name: '구독 취소', exact: true }).click()
  await expect.poll(f.calls).toBe(1)
  f.release()
  await expect(page.getByRole('alert')).toContainText('취소 완료 여부를 확인하지 못했습니다')
  await expect(page.getByRole('button', { name: '구독 취소', exact: true })).toHaveCount(0)
  f.setSummary({ ...summary, scheduledChangeAction: 'cancel', scheduledChangeEffectiveAt: END })
  await page.getByRole('button', { name: '상태 다시 확인' }).click()
  await expect(page.getByRole('heading', { name: '구독이 취소되었습니다' })).toBeVisible()
  expect(f.calls()).toBe(1)
})

test('missing server configuration is not described as a subscription lookup failure', async ({ page }) => {
  const f = await setup(page, { cancelError: 'billing_not_configured' })
  await page.getByRole('button', { name: '구독 취소', exact: true }).click()
  await expect.poll(f.calls).toBe(1)
  f.release()
  await expect(page.getByRole('alert')).toContainText('현재 서버에 구독 취소 기능이 연결되지 않았습니다')
  await expect(page.getByRole('button', { name: '상태 다시 확인' })).toHaveCount(0)
})

test('cancellation network errors describe an uncertain cancellation rather than failed reads', async ({ page }) => {
  const f = await setup(page, { cancelError: 'network_error' })
  await page.getByRole('button', { name: '구독 취소', exact: true }).click()
  await expect.poll(f.calls).toBe(1)
  f.release()
  await expect(page.getByRole('alert')).toContainText('취소 완료 여부를 확인하지 못했습니다')
  await expect(page.getByRole('button', { name: '상태 다시 확인' })).toBeVisible()
})

test('missing dates, lookup failure, ended subscriptions and signed-out users cannot cancel', async ({ page }) => {
  for (const options of [
    { summary: { ...summary, currentPeriodEnd: null } },
    { summary: null }, { summary: { ...summary, status: 'canceled' } }, { signedOut: true },
  ]) {
    const f = await setup(page, options)
    await expect(page.getByRole('button', { name: '구독 관리로 돌아가기' })).toBeVisible()
    await expect(page.getByRole('button', { name: '구독 취소', exact: true })).toHaveCount(0)
    expect(f.calls()).toBe(0)
  }
})
