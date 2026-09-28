import { expect, test } from '@playwright/test'

for (const width of [390, 1440]) {
  for (const country of ['KR', 'US', 'JP', 'DE', 'GB', 'SG', '']) {
    test(`${width}px paid landing ${country || 'unknown'} ignores stale language`, async ({ browser, baseURL }) => {
      const locale = country === 'KR' ? 'ko' : 'en'
      const context = await browser.newContext({ locale: 'ko-KR', viewport: { width, height: 900 } })
      if (country) await context.addCookies([{ name: 'leverage_geo_country', value: country, url: baseURL! }])
      await context.addInitScript((oldLocale) => {
        localStorage.setItem('leverage_locale', oldLocale)
        sessionStorage.setItem('leverage_locale_detected', oldLocale)
      }, locale === 'en' ? 'ko' : 'en')
      const page = await context.newPage()
      await page.route('https://ipapi.co/**', (route) => route.abort())
      await page.goto('/?gclid=locale_qa')
      await expect(page.locator('html')).toHaveAttribute('lang', locale)
      await expect(page.locator('#calculator')).toBeVisible()
      await expect(page.getByRole('heading', { level: 1, name: locale === 'ko' ? '선물 계산기' : 'Futures Calculator', exact: true })).toBeVisible()
      await expect(page).toHaveTitle(locale === 'ko' ? /선물/ : /Futures/)
      await context.close()
    })
  }
}

test('campaign language beats region and remains correct after reload', async ({ browser, baseURL }) => {
  for (const locale of ['ko', 'en']) {
    const context = await browser.newContext({ locale: locale === 'ko' ? 'en-US' : 'ko-KR' })
    await context.addCookies([{ name: 'leverage_geo_country', value: locale === 'ko' ? 'US' : 'KR', url: baseURL! }])
    const page = await context.newPage()
    await page.goto(`${locale === 'en' ? '/en' : '/'}?lang=${locale}&gclid=locale_qa`)
    await expect(page.locator('#calculator')).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('lang', locale)
    await page.reload()
    await expect(page.locator('#calculator')).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('lang', locale)
    await context.close()
  }
})
