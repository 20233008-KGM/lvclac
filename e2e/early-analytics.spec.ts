import { expect, test, type Page } from '@playwright/test'

test.skip(!process.env.EARLY_ANALYTICS_E2E, 'Use playwright.analytics.config.ts; vendor traffic is intercepted.')

async function prepare(page: Page, automated = false) {
  const requests: string[] = []
  const payloads: string[] = []
  await page.addInitScript((automated) => {
    Object.defineProperty(navigator, 'webdriver', { get: () => automated })
    Object.defineProperty(navigator, 'userAgentData', { get: () => undefined })
  }, automated)
  await page.route('**/*', async route => {
    const url = new URL(route.request().url())
    if (url.hostname === 'liqguard.com') {
      const response = await route.fetch({ url: `http://127.0.0.1:4185${url.pathname}${url.search}` })
      await route.fulfill({ response })
    } else if (url.hostname.endsWith('clarity.ms')) {
      requests.push('clarity')
      await route.fulfill({ contentType: 'application/javascript', body: '' })
    } else if (url.hostname.endsWith('posthog.com')) {
      requests.push('posthog')
      if (route.request().method() === 'POST') payloads.push(route.request().postData() ?? '')
      await route.fulfill({ contentType: 'application/json', body: '{}' })
    } else await route.abort()
  })
  return { requests, payloads }
}

test('untouched first-visit modal produces cookieless events and no analytics persistence', async ({ page, context }) => {
  const { requests, payloads } = await prepare(page)
  await page.goto('https://liqguard.com/?lang=en')
  await expect(page.locator('[role="dialog"]').first()).toBeVisible()
  await expect.poll(() => payloads.length).toBeGreaterThan(0)
  expect(requests).toContain('clarity')
  const storage = await page.evaluate(() => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage) }))
  expect([...storage.local, ...storage.session].filter(key => /^(ph_|_cl)|posthog-distinct/.test(key))).toEqual([])
  expect((await context.cookies()).filter(cookie => /^(_cl|ph_)/.test(cookie.name))).toEqual([])
  const queue = await page.evaluate(() => window.clarity?.q?.map(args => Array.from(args)))
  expect(queue?.[0]).toEqual(['consentv2', { analytics_Storage: 'denied', ad_Storage: 'denied' }])
  expect(queue).toContainEqual(['event', 'first_visit_gate'])
  expect(await page.locator('html').getAttribute('data-clarity-mask')).toBe('True')
})

test('explicit rejection stops early collection immediately and on reload', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 656 })
  const { payloads, requests } = await prepare(page)
  await page.addInitScript(() => localStorage.setItem('liqguard-welcome-intro-seen-v1', '1'))
  await page.goto('https://liqguard.com/?lang=en')
  await page.getByRole('button', { name: 'Reject all', exact: true }).click()
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('liqguard-privacy-preferences-v2')!).analytics)).toBe(false)
  const queue = await page.evaluate(() => window.clarity?.q?.map(args => Array.from(args)))
  expect(queue).toContainEqual(['stop'])
  requests.length = 0; payloads.length = 0
  await page.reload()
  await expect(page.locator('#calculator')).toBeVisible()
  expect(requests).toEqual([])
})

test('automated verification never loads the tracking vendors', async ({ page }) => {
  const { requests } = await prepare(page, true)
  await page.goto('https://liqguard.com/?lang=en')
  await expect(page.locator('#calculator')).toBeAttached()
  expect(requests).toEqual([])
})

test('ad identifiers are excluded from replay while cookieless events still arrive', async ({ page }) => {
  const { requests, payloads } = await prepare(page)
  await page.goto('https://liqguard.com/?lang=en&gclid=secret-ad-id')
  await expect.poll(() => payloads.length).toBeGreaterThan(0)
  expect(requests).not.toContain('clarity')
})
