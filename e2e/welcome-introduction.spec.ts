import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.route('https://ipapi.co/**', (route) => route.abort())
})

test('first visit, focus containment, dismissal and replay preserve calculator and consent state', async ({ page }) => {
  await page.goto('/?lang=ko')
  const dialog = page.getByRole('dialog', { name: 'LiqGuard에 오신 것을 환영합니다', exact: true })
  await expect(dialog).toBeVisible()
  const position = dialog.getByRole('table', { name: '가상 포지션 · S&P 500 마이크로 선물' })
  await expect(position).toBeVisible()
  await expect(position.getByRole('row')).toHaveCount(2)
  await expect(position.getByRole('columnheader')).toHaveText(['포지션', '평가금', '진입/현재 (pt)', '유지증거금'])
  await expect(position.getByRole('cell')).toHaveText(['롱 10계약', '$60,000', '6,000 / 6,000', '$15,000'])
  await expect(dialog.locator('.result-hero-value')).toHaveText(['6,000', '5,100', '-15%'])
  await expect(dialog.locator('.result-sheet').getByRole('columnheader')).toHaveText(['항목', '주문 전', '주문 후'])
  await expect(dialog.locator('.welcome-introduction__after')).toHaveText(['-13.2%', '5,209.1'])
  await expect(page.getByRole('dialog')).toHaveCount(1)
  await expect(page.locator('.privacy-notice')).toHaveCount(0)
  await expect(dialog.getByRole('heading', { level: 2 })).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(dialog.getByRole('button', { name: '내 포지션 계산하기' })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(dialog.getByRole('button', { name: '내 포지션 계산하기' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(page.locator('.privacy-notice')).toBeVisible()
  await expect(page.locator('#calculator .fh-equity input')).toHaveValue('')
  expect(await page.evaluate(() => ({
    intro: localStorage.getItem('liqguard-welcome-intro-seen-v1'),
    welcome: localStorage.getItem('leverage-welcome-completed-v1'),
    skip: localStorage.getItem('leverage-disclaimer-skip-v3'),
    ack: sessionStorage.getItem('leverage-disclaimer-ack-v3'),
    storage: localStorage.getItem('leverage-public-save-consent-v1'),
    privacy: localStorage.getItem('liqguard-privacy-preferences-v2'),
  }))).toEqual({ intro: '1', welcome: null, skip: null, ack: null, storage: null, privacy: null })
  await page.reload()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  const replay = page.getByRole('button', { name: '서비스 둘러보기', exact: true })
  await replay.click()
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: '내 포지션 계산하기' }).click()
  await expect(dialog).toHaveCount(0)
  await expect(replay).toBeFocused()
})

test('a returning user can force a preview without changing stored inputs or consent', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('leverage-disclaimer-skip-v3', '1')
    localStorage.setItem('leverage-public-save-consent-v1', 'off')
    localStorage.setItem('liqguard-welcome-intro-seen-v1', '1')
    localStorage.setItem('leverage_public_draft_migrated_v1', '1')
    localStorage.setItem('leverage_save_enabled', '1')
    localStorage.setItem('leverage_calculator_draft', JSON.stringify({
      mode: 'evaluate', positionSide: 'long', orderPriceLinked: false, accountEval: 123456,
      currentPrice: 120, contracts: 3, contractMultiplier: 10,
      marginInputMode: 'rate', maintenanceMarginRate: 0.1, entrustedMarginRate: 0.2,
      evalSnapshotSide: 'long',
    }))
  })
  await page.goto('/?lang=ko')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.goto('/?lang=ko&welcome=1#calculator')
  await expect(page.locator('.trust-modal--introduction')).toBeVisible()
  const stored = await page.evaluate(() => localStorage.getItem('leverage_calculator_draft'))
  await page.getByRole('button', { name: '내 포지션 계산하기' }).click()
  await expect(page).toHaveURL(/\?lang=ko#calculator$/)
  await expect(page.locator('#calculator .fh-equity input')).toHaveValue('123,456')
  expect(await page.evaluate(() => localStorage.getItem('leverage_calculator_draft'))).toBe(stored)
  await page.reload()
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

for (const locale of ['ko', 'en']) {
  for (const [width, height] of [[320, 568], [375, 667], [390, 844], [667, 375], [1440, 900]]) {
    test(`${locale} ${width}x${height}: content fits and the main action stays reachable`, async ({ page }, testInfo) => {
      const errors: string[] = []
      page.on('pageerror', (error) => errors.push(error.message))
      await page.setViewportSize({ width, height })
      await page.goto(`/?lang=${locale}&welcome=1`)
      const dialog = page.locator('.trust-modal--introduction')
      await expect(dialog).toBeVisible()
      await expect(dialog.locator('.result-hero-label')).toHaveText(locale === 'ko'
        ? ['현재가 (pt)', '청산가 (pt)', '청산 여유']
        : ['Current price (pt)', 'Liquidation price (pt)', 'Liquidation buffer'])
      await expect(dialog.locator('.result-hero-value')).toHaveText(['6,000', '5,100', '-15%'])
      expect(await dialog.locator('.result-hero-label, .result-hero-value').evaluateAll((items) =>
        items.every((item) => item.scrollWidth <= item.clientWidth),
      )).toBe(true)
      expect(await dialog.locator('.result-hero-value').evaluateAll((items) => {
        const tops = items.map((item) => item.getBoundingClientRect().top)
        return Math.max(...tops) - Math.min(...tops) < 1
      })).toBe(true)
      await expect(dialog.locator('.trust-modal__close')).toHaveCount(0)
      expect(await dialog.getByRole('heading', { level: 2 }).evaluate((element) =>
        element.scrollWidth <= element.clientWidth &&
        element.getBoundingClientRect().height <= parseFloat(getComputedStyle(element).lineHeight) + 1,
      )).toBe(true)
      expect(await dialog.locator('.trust-modal__intro').evaluate((element) =>
        element.scrollWidth <= element.clientWidth &&
        element.getBoundingClientRect().height <= parseFloat(getComputedStyle(element).lineHeight) + 1,
      )).toBe(true)
      const bounds = await dialog.boundingBox()
      expect(bounds!.x).toBeGreaterThanOrEqual(15)
      expect(bounds!.y).toBeGreaterThanOrEqual(15)
      expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(height - 15)
      expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
      expect(await dialog.locator('.trust-modal__body').evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
      expect(await dialog.locator('th, td').evaluateAll((cells) => cells.every((cell) => cell.scrollWidth <= cell.clientWidth))).toBe(true)
      await expect(dialog.locator('.welcome-introduction__start')).toBeInViewport()
      await dialog.locator('.welcome-introduction__takeaway').scrollIntoViewIfNeeded()
      await expect(dialog.locator('.welcome-introduction__takeaway')).toBeInViewport()
      await dialog.screenshot({ path: testInfo.outputPath('welcome.png') })
      await dialog.locator('.welcome-introduction__start').click()
      await expect(dialog).toHaveCount(0)
      expect(errors).toEqual([])
    })
  }
}
