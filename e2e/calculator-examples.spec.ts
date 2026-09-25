import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  // Privacy preferences are independent of the examples and welcome shortcut.
  await page.addInitScript(() => {
    localStorage.setItem('liqguard-privacy-preferences-v2', JSON.stringify({ analytics: false, personalizedAds: false }))
  })
})

for (const locale of ['ko', 'en'] as const) {
  for (const width of [390, 1440]) {
    test(`${locale} ${width}px: examples switch together and preserve calculator state`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 })
      await page.route('https://ipapi.co/**', (route) => route.abort())
      await page.addInitScript(() => {
        localStorage.setItem('leverage_public_draft_migrated_v1', '1')
        localStorage.setItem('leverage_save_enabled', '1')
        localStorage.setItem('leverage_calculator_draft', JSON.stringify({
          mode: 'evaluate', positionSide: 'long', accountEval: 1_234_567,
          contracts: 3, currentPrice: 120, contractMultiplier: 10,
          marginInputMode: 'rate', maintenanceMarginRate: 0.1, entrustedMarginRate: 0.2,
        }))
      })
      const errors: string[] = []
      page.on('pageerror', (error) => errors.push(error.message))
      await page.goto(`/?lang=${locale}`)
      const section = page.locator('.calculator-examples')
      await expect(section.getByRole('heading', { name: locale === 'ko' ? '계산 예제' : 'Calculation examples', exact: true })).toBeVisible()
      await expect(section.locator('.calc-example')).toHaveCount(4)
      await expect(section.locator('.read-only-calculator')).toHaveCount(4)
      await expect(section.locator('img')).toHaveCount(0)
      const equity = page.locator('#calculator .fh-equity input')
      await expect(equity).toHaveValue('1,234,567')
      await equity.fill('2345678')
      await equity.press('Tab')
      await expect(equity).toHaveValue('2,345,678')
      await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('leverage_calculator_draft')!).accountEval)).toBe(2_345_678)
      const stored = await page.evaluate(() => localStorage.getItem('leverage_calculator_draft'))
      const inputValues = await page.locator('.calc-grid input').evaluateAll((inputs) => inputs.map((input) => (input as HTMLInputElement).value))

      const tabs = section.getByRole('tab')
      await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true')
      for (const [index, amount, liquidation] of [[0, '10,000', '170'], [1, '150,000', '3,804'], [2, '30,000', '65']] as const) {
        await tabs.nth(index).click()
        await expect(tabs.nth(index)).toHaveAttribute('aria-selected', 'true')
        await expect(section.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', await tabs.nth(index).getAttribute('id') as string)
        await expect(section.locator('.calculator-examples__context h3')).toContainText(['Asteron Technologies', 'Crestline 500', 'Westhaven Crude'][index])
        const specs = section.locator('.calculator-examples__specs')
        await expect(specs.locator('tr')).toHaveCount(9)
        await expect(specs.locator('tr').nth(0)).toContainText('USD')
        await expect(specs.locator('tr').nth(1)).toContainText(['250', '5,000', '75'][index])
        await expect(specs.locator('tr').nth(3)).toContainText(['2,500 USD', '250,000 USD', '75,000 USD'][index])
        await expect(specs.locator('tr').nth(4)).toContainText(['12% (0.12)', '8% (0.08)', '5,000 USD'][index])
        await expect(specs.locator('tr').nth(5)).toContainText(['18% (0.18)', '12% (0.12)', '6,000 USD'][index])
        await expect(specs.locator('tr').nth(6)).toContainText(amount)
        expect(await specs.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
        const filled = section.locator('.calc-example').nth(1)
        await expect(filled.locator('figcaption')).toContainText(liquidation)
        await expect(filled.locator('.fh-equity input')).toHaveValue(amount)
        await expect(filled.locator('.derived-metric-value')).toHaveText(['±1,000', '±25', '±20,000'][index])
        await expect(filled.locator('.input-panel label.field').filter({ hasText: locale === 'ko' ? '틱 사이즈' : 'Tick size' }).locator('input')).toHaveValue(['10', '0.25', '10'][index])
        await expect(filled.locator('.calc-example__focus-note')).toHaveCount(0)
        expect(await filled.locator('input').evaluateAll((els) => els.every((el) => !getComputedStyle(el).boxShadow.includes('inset')))).toBe(true)
        await expect(section.locator('.calc-example').nth(0).locator('.fh-equity input')).toHaveValue('')
        for (let step = 0; step < 4; step++) {
          const panel = section.locator('.read-only-calculator').nth(step)
          await expect(panel.locator('fieldset')).toHaveAttribute('inert', '')
          expect(await panel.locator('input').evaluateAll((inputs) => inputs.every((input) => input.matches(':disabled')))).toBe(true)
          const target = panel.locator([
            '.fh-equity input, .fh-mark input, .fh-contracts input, .fh-mult input, .fh-margin input',
            'input',
            '.result-order-fields input',
            '.result-order-fields input',
          ][step])
          expect(await target.count()).toBeGreaterThanOrEqual(2)
          expect(await target.evaluateAll((els) => els.every((el) => getComputedStyle(el).boxShadow.includes('inset') && getComputedStyle(el).boxShadow.includes('2px')))).toBe(step !== 1)
          const input = panel.locator('input').first()
          await input.evaluate((el: HTMLInputElement) => el.focus())
          await expect(input).not.toBeFocused()
          expect(await panel.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true)
        }
        const added = section.locator('.calc-example').nth(2)
        const reduced = section.locator('.calc-example').nth(3)
        // Input panels show held contracts before the displayed order is applied.
        await expect(added.locator('.derived-metric-value')).toHaveText(['±1,000', '±25', '±20,000'][index])
        await expect(reduced.locator('.derived-metric-value')).toHaveText(['±1,200', '±37.5', '±30,000'][index])
        await expect(added.locator('.result-order-fields input').first()).toHaveValue(index === 0 ? '2' : '1')
        await expect(reduced.locator('.result-order-fields input').first()).toHaveValue(index === 0 ? '-4' : '-2')
        await expect(added.locator('.result-sheet tbody tr').first()).toContainText(['189', '4,348', '70'][index])
        await expect(reduced.locator('.result-sheet tbody tr').first()).toContainText(['142', '2,174', '50'][index])
        const ids = await page.locator('[id]').evaluateAll((els) => els.map((el) => el.id))
        expect(new Set(ids).size).toBe(ids.length)
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
        await section.screenshot({ path: testInfo.outputPath(`${locale}-${width}-${index}.png`) })
      }

      await tabs.nth(2).press('ArrowRight')
      await expect(tabs.nth(0)).toBeFocused()
      await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true')
      await tabs.nth(0).press('End')
      await expect(tabs.nth(2)).toBeFocused()
      await tabs.nth(2).press('ArrowLeft')
      await expect(tabs.nth(1)).toBeFocused()
      await tabs.nth(1).press('Home')
      await expect(tabs.nth(0)).toBeFocused()
      await tabs.nth(0).press('Tab')
      await expect(section.getByRole('tabpanel')).toBeFocused()

      expect(await page.locator('.calc-grid input').evaluateAll((inputs) => inputs.map((input) => (input as HTMLInputElement).value))).toEqual(inputValues)
      expect(await page.evaluate(() => localStorage.getItem('leverage_calculator_draft'))).toBe(stored)
      // Global undo must undo the user's edit, not any of the example selections.
      await page.keyboard.press('Control+z')
      await expect(equity).toHaveValue('1,234,567')
      await page.keyboard.press('Control+Shift+z')
      await expect(equity).toHaveValue('2,345,678')
      expect(errors).toEqual([])
    })
  }
}

test('fresh visit shows blank calculator and all example steps without a dialog', async ({ page }) => {
  await page.route('https://ipapi.co/**', (route) => route.abort())
  await page.goto('/?lang=ko')
  await expect(page.locator('.calculator-examples .calc-example')).toHaveCount(4)
  await expect(page.locator('#calculator .fh-equity input')).toHaveValue('')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.getByRole('tab', { name: '원자재선물', exact: true }).click()
  await expect(page.locator('#calculator .fh-equity input')).toHaveValue('')
})

for (const locale of ['ko', 'en']) {
  for (const width of [390, 1440]) {
    test(`${locale} ${width}: new visitor shortcut scrolls once and stays hidden after reload`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.route('https://ipapi.co/**', (route) => route.abort())
      await page.goto(`/?lang=${locale}`)
      const link = page.locator('.header-welcome-btn')
      const stored = await page.evaluate(() => JSON.stringify(localStorage))
      await link.focus()
      await link.press('Enter')
      await expect(page).toHaveURL(/#calculator-examples-title$/)
      await expect(page.locator('#calculator-examples-title')).toBeFocused()
      await expect.poll(() => page.locator('.calculator-examples__eyebrow').evaluate((el) => {
        const top = el.getBoundingClientRect().top
        return top >= 24 && top < 60
      })).toBe(true)
      await expect(page.getByRole('dialog')).toHaveCount(0)
      await expect(link).toHaveCount(0)
      expect(await page.evaluate(() => localStorage.getItem('liqguard-examples-viewed-v1'))).toBe('1')
      expect(await page.evaluate(() => {
        const values = { ...localStorage }
        delete values['liqguard-examples-viewed-v1']
        return JSON.stringify(values)
      })).toBe(stored)
      await page.reload()
      await expect(link).toHaveCount(0)
      // A fresh browser identity uses the reduced-motion path on pointer activation.
      await page.evaluate(() => localStorage.clear())
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto(`/?lang=${locale}`)
      await link.click()
      await expect(page.locator('#calculator-examples-title')).toBeFocused()
      await expect(page.getByRole('dialog')).toHaveCount(0)
      await expect.poll(() => page.locator('#calculator-examples-title').evaluate((el) =>
        Math.abs(el.getBoundingClientRect().top - 72),
      )).toBeLessThanOrEqual(2)
    })
  }
}

test('live tick PnL preserves fractional amounts below one', async ({ page }) => {
  await page.route('https://ipapi.co/**', (route) => route.abort())
  await page.addInitScript(() => {
    localStorage.setItem('leverage_public_draft_migrated_v1', '1')
    localStorage.setItem('leverage_save_enabled', '1')
    localStorage.setItem('leverage_calculator_draft', JSON.stringify({
      mode: 'evaluate', positionSide: 'long', contracts: 8, tickSize: 0.01, contractMultiplier: 10,
    }))
  })
  await page.goto('/?lang=ko')
  await expect(page.locator('#calculator .derived-metric-value')).toHaveText('±0.8')
})

for (const locale of ['ko', 'en']) {
  test(`${locale}: release notes show updated dates and link back to examples`, async ({ page }, testInfo) => {
    await page.route('https://ipapi.co/**', (route) => route.abort())
    const prefix = locale === 'en' ? '/en' : ''
    await page.goto(`${prefix}/updates?lang=${locale}`)
    const rows = page.locator('.updates-table tbody tr')
    await expect(rows.first()).toContainText('1.2.3')
    await expect(rows.first().locator('time')).toHaveAttribute('datetime', '2026-09-25')
    await expect(rows.nth(1)).toContainText('1.2.2')
    await expect(rows.nth(1).locator('time')).toHaveAttribute('datetime', '2026-09-18')
    await rows.first().locator('a').click()
    await expect(page.locator('.updates-detail__meta time')).toHaveAttribute('datetime', '2026-09-25')
    await page.locator('a[href$="#calculator-examples-title"]').click()
    await expect(page.locator('.calculator-examples')).toHaveCount(1)
    await expect(page.locator('#calculator')).toHaveCount(1)
    await page.locator('#calculator-examples-title').scrollIntoViewIfNeeded()
    await page.screenshot({ path: testInfo.outputPath(`${locale}-release-landing.png`) })
  })
}

test('fresh privacy choice remains independent from the examples shortcut', async ({ browser }) => {
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.route('https://ipapi.co/**', (route) => route.abort())
  await page.goto('/?lang=ko')
  await expect(page.getByRole('dialog', { name: '개인정보 및 쿠키 설정' })).toBeVisible()
  await page.getByRole('button', { name: '동의하지 않고 계속', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('liqguard-privacy-preferences-v2')!)))
    .toEqual({ analytics: false, personalizedAds: false })
  await page.locator('.header-welcome-btn').click()
  await expect(page.locator('#calculator-examples-title')).toBeFocused()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await context.close()
})

for (const [key, value] of [
  ['leverage-welcome-completed-v1', '1'],
  ['leverage-disclaimer-skip-v3', '1'],
  ['leverage_calculator_draft', '{"accountEval":10000}'],
  ['liqguard-examples-viewed-v1', '1'],
]) {
  test(`returning visitor hides shortcut with ${key}`, async ({ page }) => {
    await page.addInitScript(({ key, value }) => localStorage.setItem(key, value), { key, value })
    await page.route('https://ipapi.co/**', (route) => route.abort())
    await page.goto('/?lang=ko')
    await expect(page.locator('.calculator-examples')).toBeVisible()
    await expect(page.locator('.header-welcome-btn')).toHaveCount(0)
  })
}
