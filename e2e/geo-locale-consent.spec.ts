import { expect, test, type Browser, type Page } from '@playwright/test'

const BASE_URL = 'http://127.0.0.1:4174'
const GEO_ENDPOINT = 'https://ipapi.co/country_code/'

const STORAGE_KEY = 'leverage_locale'
const SESSION_DETECTED_KEY = 'leverage_locale_detected'
const GEO_COOKIE = 'leverage_geo_country'
const PRIVACY_PREFERENCES_KEY = 'liqguard-privacy-preferences-v2'

interface LocaleScenario {
  name: string
  locale: string
  path?: string
  local?: Record<string, string>
  session?: Record<string, string>
  country?: string
  expected: 'ko' | 'en'
}

async function createScenarioPage(browser: Browser, scenario: LocaleScenario): Promise<Page> {
  const context = await browser.newContext({ locale: scenario.locale })
  if (scenario.country) {
    await context.addCookies([
      { name: GEO_COOKIE, value: scenario.country, url: BASE_URL },
    ])
  }
  await context.addInitScript(
    ({ local, session }) => {
      for (const [key, value] of Object.entries(local ?? {})) {
        window.localStorage.setItem(key, value)
      }
      for (const [key, value] of Object.entries(session ?? {})) {
        window.sessionStorage.setItem(key, value)
      }
    },
    { local: scenario.local, session: scenario.session },
  )

  const page = await context.newPage()
  await page.route(GEO_ENDPOINT, (route) => route.abort())
  await page.goto(`${BASE_URL}${scenario.path ?? '/'}`)
  return page
}

async function readLatestConsentUpdate(page: Page): Promise<Record<string, string> | null> {
  return page.evaluate(() => {
    const dataLayer = (window as Window & { dataLayer?: unknown[] }).dataLayer ?? []
    const updates = dataLayer
      .map((entry) => {
        if (Array.isArray(entry)) return entry
        if (entry && typeof entry === 'object' && 'length' in entry) {
          return Array.from(entry as ArrayLike<unknown>)
        }
        return []
      })
      .filter(
        (entry): entry is [string, string, Record<string, string>] =>
          entry[0] === 'consent' && entry[1] === 'update',
      )
    return updates.at(-1)?.[2] ?? null
  })
}

test.describe('locale priority', () => {
  const scenarios: LocaleScenario[] = [
    {
      name: 'URL override beats every automatic and saved signal',
      locale: 'ko-KR',
      path: '/?lang=en',
      local: { [STORAGE_KEY]: 'ko' },
      session: { [SESSION_DETECTED_KEY]: 'ko' },
      country: 'KR',
      expected: 'en',
    },
    {
      name: 'manual choice beats session and country',
      locale: 'ko-KR',
      local: { [STORAGE_KEY]: 'en' },
      session: { [SESSION_DETECTED_KEY]: 'ko' },
      country: 'KR',
      expected: 'en',
    },
    {
      name: 'session detection beats the country cookie',
      locale: 'ko-KR',
      session: { [SESSION_DETECTED_KEY]: 'en' },
      country: 'KR',
      expected: 'en',
    },
    {
      name: 'Korean country cookie beats an English browser',
      locale: 'en-US',
      country: 'KR',
      expected: 'ko',
    },
    {
      name: 'Korean browser is the final fallback',
      locale: 'ko-KR',
      expected: 'ko',
    },
  ]

  for (const scenario of scenarios) {
    test(scenario.name, async ({ browser }) => {
      const page = await createScenarioPage(browser, scenario)
      await expect(page.locator('html')).toHaveAttribute('lang', scenario.expected)
      await page.context().close()
    })
  }

  test('a late geo response does not overwrite a manual language choice', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'en-US' })
    await context.addInitScript(() => {
      localStorage.setItem('leverage-disclaimer-skip-v3', '1')
      localStorage.setItem('leverage-public-save-consent-v1', 'off')
    })
    const page = await context.newPage()
    let releaseGeo: (() => void) | undefined
    let markGeoStarted: (() => void) | undefined
    const geoStarted = new Promise<void>((resolve) => {
      markGeoStarted = resolve
    })
    const geoReleased = new Promise<void>((resolve) => {
      releaseGeo = resolve
    })

    await page.route(GEO_ENDPOINT, async (route) => {
      markGeoStarted?.()
      await geoReleased
      await route.fulfill({ status: 200, body: 'US' })
    })

    await page.goto(BASE_URL)
    await geoStarted
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')

    await page.getByRole('button', { name: '한국어' }).click()
    await expect(page.locator('html')).toHaveAttribute('lang', 'ko')
    releaseGeo?.()

    await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY))
      .toBe('ko')
    await expect(page.locator('html')).toHaveAttribute('lang', 'ko')
    await context.close()
  })
})

test.describe('privacy and cookie choices', () => {
  test('stores granular choices and sends matching Consent Mode updates', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'ko-KR' })
    await context.addInitScript(() => {
      localStorage.setItem('leverage-disclaimer-skip-v3', '1')
      localStorage.setItem('leverage-public-save-consent-v1', 'off')
      localStorage.setItem('leverage_locale', 'ko')
    })
    const page = await context.newPage()
    await page.route(GEO_ENDPOINT, (route) => route.abort())
    await page.goto(BASE_URL)

    const privacyButton = page.getByRole('button', { name: '개인정보·쿠키 설정' })
    await privacyButton.click()

    const analytics = page.getByRole('switch', { name: '서비스 이용 분석' })
    const personalizedAds = page.getByRole('switch', { name: '맞춤 광고' })
    await expect(analytics).not.toBeChecked()
    await expect(personalizedAds).not.toBeChecked()
    await page.getByRole('button', { name: '선택 저장' }).click()

    await expect.poll(() => page.evaluate(
      (key) => localStorage.getItem(key),
      PRIVACY_PREFERENCES_KEY,
    )).toBe(JSON.stringify({ analytics: false, personalizedAds: false }))
    await expect.poll(() => readLatestConsentUpdate(page)).toEqual({
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
    })

    await privacyButton.click()
    await analytics.locator('..').click()
    await personalizedAds.locator('..').click()
    await expect(analytics).toBeChecked()
    await expect(personalizedAds).toBeChecked()
    await page.getByRole('button', { name: '선택 저장' }).click()

    await expect.poll(() => page.evaluate(
      (key) => localStorage.getItem(key),
      PRIVACY_PREFERENCES_KEY,
    )).toBe(JSON.stringify({ analytics: true, personalizedAds: true }))
    await expect.poll(() => readLatestConsentUpdate(page)).toEqual({
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
      analytics_storage: 'granted',
    })

    await privacyButton.click()
    await personalizedAds.locator('..').click()
    await expect(personalizedAds).not.toBeChecked()
    await page.getByRole('button', { name: '선택 저장' }).click()
    await expect.poll(() => readLatestConsentUpdate(page)).toEqual({
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'granted',
    })

    await page.reload()
    await privacyButton.click()
    await expect(analytics).toBeChecked()
    await expect(personalizedAds).not.toBeChecked()
    await context.close()
  })
})
