import { expect, test } from '@playwright/test'

test.use({ hasTouch: true })

for (const locale of ['ko', 'en'] as const) {
  for (const width of [360, 1440]) {
    test(`${locale} ${width}: example taps explain read-only mode and reach the live calculator`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: width === 360 ? 656 : 900 })
      await page.route('https://ipapi.co/**', route => route.abort())
      await page.addInitScript(() => {
        localStorage.setItem('liqguard-welcome-intro-seen-v1', '1')
        localStorage.setItem('liqguard-privacy-preferences-v2', JSON.stringify({ analytics: false, personalizedAds: false }))
        localStorage.setItem('leverage_public_draft_migrated_v1', '1')
        localStorage.setItem('leverage_save_enabled', '1')
        localStorage.setItem('leverage_calculator_draft', JSON.stringify({
          mode: 'evaluate', positionSide: 'long', accountEval: 123456,
          contracts: 3, currentPrice: 120, contractMultiplier: 10,
          marginInputMode: 'rate', maintenanceMarginRate: 0.1, entrustedMarginRate: 0.2,
        }))
      })
      const errors: string[] = []
      page.on('pageerror', error => errors.push(error.message))
      await page.goto(`/?lang=${locale}#calculator-examples-title`)
      const liveEquity = page.locator('#calculator .fh-equity input')
      await expect(liveEquity).toHaveValue('123,456')
      const stored = await page.evaluate(() => localStorage.getItem('leverage_calculator_draft'))
      const title = locale === 'ko' ? '설명용 예제입니다' : 'This is a read-only example'
      const dialog = page.getByRole('dialog', { name: title, exact: true })
      const keepReading = locale === 'ko' ? '예제 계속 보기' : 'Keep viewing examples'
      const openCalculator = locale === 'ko' ? '실제 계산기 열기' : 'Open live calculator'
      const previews = page.locator('.calc-example__interactive-preview')

      await expect(dialog).toHaveCount(0)
      for (let step = 0; step < 4; step++) {
        const preview = previews.nth(step)
        const trigger = preview.locator('.calc-example__help-trigger')
        const field = preview.locator(step < 2 ? '.fh-equity input' : '.result-order-fields input').first()
        await field.scrollIntoViewIfNeeded()
        const bounds = (await field.boundingBox())!
        const scrollY = await page.evaluate(() => window.scrollY)
        // Tap the pixels of the disabled input, exactly as the visitor did.
        const x = bounds.x + bounds.width / 2
        const y = bounds.y + bounds.height / 2
        if (width === 360) await page.touchscreen.tap(x, y)
        else await page.mouse.click(x, y)
        await expect(dialog).toBeVisible()
        await expect(dialog.getByRole('heading', { name: title })).toBeFocused()
        await expect(dialog.getByRole('button', { name: openCalculator })).toBeInViewport()
        expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true)
        if (step === 0) await page.screenshot({ path: testInfo.outputPath('example-help.png') })
        await expect(preview.locator('fieldset')).toHaveAttribute('inert', '')
        await dialog.getByRole('button', { name: keepReading }).click()
        await expect(dialog).toHaveCount(0)
        await expect(trigger).toBeFocused()
        await expect.poll(() => page.evaluate(() => window.scrollY)).toBeCloseTo(scrollY, 0)
      }

      const trigger = previews.first().locator('.calc-example__help-trigger')
      await trigger.focus()
      await trigger.press('Enter')
      await expect(dialog).toBeVisible()
      await page.keyboard.press('Shift+Tab')
      await expect(dialog.getByRole('button', { name: openCalculator })).toBeFocused()
      await page.keyboard.press('Tab')
      await expect(dialog.getByRole('button', { name: locale === 'ko' ? '닫기' : 'Close', exact: true })).toBeFocused()
      await page.keyboard.press('Escape')
      await expect(dialog).toHaveCount(0)
      await expect(trigger).toBeFocused()
      await trigger.press('Space')
      await expect(dialog).toBeVisible()
      await dialog.getByRole('button', { name: openCalculator }).click()
      await expect(dialog).toHaveCount(0)
      await expect(page).toHaveURL(/#calculator$/)
      await expect(liveEquity).toBeFocused()
      await expect(liveEquity).toBeInViewport()
      await expect(liveEquity).toHaveValue('123,456')
      expect(await page.evaluate(() => localStorage.getItem('leverage_calculator_draft'))).toBe(stored)
      await liveEquity.fill('234567')
      await liveEquity.press('Tab')
      await expect(liveEquity).toHaveValue('234,567')
      expect(errors).toEqual([])
    })
  }
}
