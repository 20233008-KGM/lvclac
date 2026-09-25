import { expect, test } from '@playwright/test'

const products = [
  { price: 250, multiplier: 10, count: 10, added: 12, margins: [300, 450], rate: ['170', '189', '142'], fixed: ['180', '197', '155'], tick: '±1,000' },
  { price: 5000, multiplier: 50, count: 2, added: 3, margins: [20000, 30000], rate: ['3,804', '4,348', '2,174'], fixed: ['3,900', '4,400', '2,400'], tick: '±25' },
  { price: 75, multiplier: 1000, count: 2, added: 3, margins: [5000, 6000], rate: ['64', '70', '48'], fixed: ['65', '70', '50'], tick: '±20,000' },
]

for (const locale of ['ko', 'en']) {
  for (const width of [390, 1440]) {
    test(`${locale} ${width}: all nine margin examples stay isolated and support keyboard selection`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 })
      await page.route('https://ipapi.co/**', (route) => route.abort())
      await page.addInitScript(() => {
        localStorage.setItem('liqguard-privacy-preferences-v2', JSON.stringify({ analytics: false, personalizedAds: false }))
        localStorage.setItem('leverage_public_draft_migrated_v1', '1')
        localStorage.setItem('leverage_save_enabled', '1')
        localStorage.setItem('leverage_calculator_draft', JSON.stringify({
          mode: 'evaluate', positionSide: 'long', accountEval: 1234567,
          contracts: 3, currentPrice: 120, contractMultiplier: 10,
          marginInputMode: 'rate', maintenanceMarginRate: 0.1, entrustedMarginRate: 0.2,
        }))
      })
      const errors: string[] = []
      page.on('pageerror', (error) => errors.push(error.message))
      await page.goto(`/?lang=${locale}`)
      const liveEquity = page.locator('#calculator .fh-equity input')
      await liveEquity.fill('2345678')
      await liveEquity.press('Tab')
      await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('leverage_calculator_draft')!).accountEval)).toBe(2345678)
      const stored = await page.evaluate(() => JSON.stringify({ ...localStorage }))
      const liveValues = await page.locator('#calculator input').evaluateAll((els) => els.map((el) => (el as HTMLInputElement).value))
      const section = page.locator('.calculator-examples')
      const tabs = section.getByRole('tab')
      const radios = section.getByRole('radio')
      await expect(radios).toHaveCount(3)
      await expect(radios.nth(0)).toBeChecked()
      await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true')
      for (const [modeIndex, mode] of ['rate', 'perContract', 'total'].entries()) {
        await radios.nth(modeIndex).click()
        for (const [index, product] of products.entries()) {
          await tabs.nth(index).click()
          await expect(radios.nth(modeIndex)).toBeChecked()
          const steps = section.locator('.calc-example')
          await expect(steps).toHaveCount(4)
          const firstMargins = steps.nth(0).locator('.fh-margin input')
          await expect(firstMargins).toHaveCount(2)
          for (const field of await firstMargins.all()) await expect(field).toHaveValue('')
          const filled = steps.nth(1)
          const inputs = filled.locator('.fh-margin input')
          await expect(inputs).toHaveCount(2)
          for (let i = 0; i < 2; i++) {
            const expected = mode === 'rate' ? product.margins[i] / (product.price * product.multiplier)
              : product.margins[i] * (mode === 'total' ? product.count : 1)
            const actual = Number((await inputs.nth(i).inputValue()).replaceAll(',', ''))
            expect(actual).toBeCloseTo(expected, 7)
            const row = section.locator('.calculator-examples__specs tr').nth(4 + i)
            await expect(row).toContainText(mode === 'rate' ? '%' : 'USD')
            if (mode !== 'rate') await expect(row).toContainText(expected.toLocaleString('en-US'))
            if (mode === 'total') {
              await expect(steps.nth(3).locator('.fh-margin input').nth(i))
                .toHaveValue((product.margins[i] * product.added).toLocaleString('en-US'))
            }
          }
          const prices = mode === 'perContract' ? product.fixed : product.rate
          await expect(filled.locator('figcaption')).toContainText(prices[0])
          await expect(steps.nth(2).locator('.result-sheet tbody tr').first()).toContainText(prices[1])
          await expect(steps.nth(3).locator('.result-sheet tbody tr').first()).toContainText(prices[2])
          await expect(filled.locator('.derived-metric-value')).toHaveText(product.tick)
          await expect(filled.locator('.calc-example__focus-note')).toHaveCount(0)
          for (const [stepIndex, step] of (await steps.all()).entries()) {
            await expect(step.locator(`.field-section--margin-${mode}`)).toHaveCount(1)
            await expect(step.locator('fieldset')).toHaveAttribute('inert', '')
            expect(await step.locator('input').evaluateAll((els) => els.every((el) => el.matches(':disabled')))).toBe(true)
            const targets = step.locator(stepIndex >= 2 ? '.result-order-fields input' : '.fh-margin input')
            expect(await targets.evaluateAll((els) => els.every((el) => getComputedStyle(el).boxShadow.includes('inset')))).toBe(stepIndex !== 1)
          }
          await expect(steps.nth(0).locator('.calc-example__focus-note')).toContainText(
            locale === 'ko' ? ['유지증거금률', '계약당 유지증거금', '유지증거금 총액'][modeIndex]
              : ['maintenance margin rate', 'maintenance margin per contract', 'total maintenance margin'][modeIndex],
          )
          if (mode === 'total') {
            await expect(section.locator('#example-margin-description')).toContainText(locale === 'ko' ? '가격 비례형' : 'price-proportional')
            await expect(section.locator('caption')).toContainText(locale === 'ko' ? '최초 보유분' : 'starting position')
          }
          expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
          expect(await section.locator('.read-only-calculator').evaluateAll((els) => els.every((el) => el.scrollWidth <= el.clientWidth + 1))).toBe(true)
        }
      }
      await section.locator('.calculator-examples__margin').scrollIntoViewIfNeeded()
      await page.screenshot({ path: testInfo.outputPath(`${locale}-${width}-total.png`) })
      await radios.nth(2).focus()
      await radios.nth(2).press('ArrowRight')
      await expect(radios.nth(0)).toBeFocused()
      await expect(radios.nth(0)).toBeChecked()
      await radios.nth(0).press('ArrowDown')
      await expect(radios.nth(1)).toBeChecked()
      await radios.nth(1).press('ArrowUp')
      await expect(radios.nth(0)).toBeChecked()
      await radios.nth(0).press('End')
      await expect(radios.nth(2)).toBeChecked()
      await radios.nth(2).press('ArrowLeft')
      await expect(radios.nth(1)).toBeChecked()
      await radios.nth(1).press('Home')
      await radios.nth(0).press('Space')
      await expect(radios.nth(0)).toBeChecked()
      await radios.nth(0).press('Tab')
      await expect(section.getByRole('tabpanel')).toBeFocused()
      expect(await page.locator('#calculator input').evaluateAll((els) => els.map((el) => (el as HTMLInputElement).value))).toEqual(liveValues)
      expect(await page.evaluate(() => JSON.stringify({ ...localStorage }))).toBe(stored)
      await page.keyboard.press('Control+z')
      await expect(liveEquity).toHaveValue('1,234,567')
      await page.keyboard.press('Control+Shift+z')
      await expect(liveEquity).toHaveValue('2,345,678')
      await radios.nth(2).click()
      await page.reload()
      await expect(radios.nth(0)).toBeChecked()
      await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true')
      await expect(page.locator('.header-how-btn')).toBeVisible()
      await expect(page.locator('.header-welcome-btn')).toHaveCount(0)
      expect(errors).toEqual([])
    })
  }
}
