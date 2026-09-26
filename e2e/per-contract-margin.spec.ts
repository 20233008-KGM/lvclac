import { expect, test, type Page } from '@playwright/test'

// All financial inputs go through the real UI. Storage is read only to verify
// persisted full-precision values; expected results never import app helpers.
const field = (page: Page, key: string) => page.locator(`#calculator [data-analytics-key="${key}"] input`)
const orderCount = (page: Page) => page.locator('#calculator .result-order-field--contracts input')
const orderPrice = (page: Page) => page.locator('#calculator .result-order-field--price input')
const previewButton = (page: Page) => page.locator('#calculator').getByRole('button', { name: 'Enter로 주문 시나리오 진입', exact: true })
const applyButton = (page: Page) => page.locator('#calculator').getByRole('button', { name: '계좌에 확정', exact: true })
const integerDisplay = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 0 })

async function fill(page: Page, key: string, value: number) {
  const input = field(page, key)
  await input.click()
  await input.fill(String(value))
  await input.press('Tab')
}

async function setup(page: Page, side = 'long', equity = 60_000, entry = 75) {
  await page.goto('/?lang=ko')
  await page.locator('#calculator').getByRole('button', { name: side === 'long' ? '롱' : '숏', exact: true }).click()
  await page.locator('#calculator').getByRole('button', { name: '계약당', exact: true }).click()
  for (const [key, value] of Object.entries({
    account_equity: equity, entry_price: entry, contracts: 2,
    contract_multiplier: 1000, current_price: 75,
    maintenance_margin_per_contract: 6000, entry_margin_per_contract: 9000,
    tick_size: 0.001,
  })) await fill(page, key, value)
}

async function draft(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('leverage_calculator_draft') ?? '{}'))
}

async function checkAccount(page: Page, n: number, equity: number, entry: number, sign: number) {
  await expect.poll(async () => Number((await field(page, 'account_equity').inputValue()).replaceAll(',', ''))).toBeCloseTo(equity, 7)
  await expect(field(page, 'contracts')).toHaveValue(String(n))
  await expect.poll(async () => Number((await field(page, 'entry_price').inputValue()).replaceAll(',', ''))).toBeCloseTo(entry, 9)
  const result = page.locator('#calculator .result-panel').first()
  await expect(result.locator('.result-hero-card').first()).toContainText(n ? integerDisplay(75 - sign * (equity - n * 6000) / (n * 1000)) : '-')
  await expect(result).toContainText(integerDisplay(equity - n * 9000))
  await expect(result).toContainText(integerDisplay(n * 6000))
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('liqguard-welcome-intro-seen-v1', '1')
    localStorage.setItem('leverage-welcome-completed-v1', '1')
    localStorage.setItem('leverage-disclaimer-skip-v3', '1')
    localStorage.setItem('liqguard-privacy-preferences-v2', JSON.stringify({ analytics: false, personalizedAds: false }))
    localStorage.setItem('leverage_public_draft_migrated_v1', '1')
    localStorage.setItem('leverage_locale', 'ko')
    localStorage.setItem('leverage_save_enabled', '1')
    localStorage.setItem('leverage_save_storage_mode', 'local')
    localStorage.setItem('leverage_account_setting_guard_skip', '1')
  })
  await page.route('https://ipapi.co/**', (route) => route.abort())
})

for (const side of ['long', 'short']) {
  test(`${side}: independent cash ledger matches add → partial close → re-add → full close in the UI`, async ({ page }) => {
    await setup(page, side)
    const sign = side === 'long' ? 1 : -1
    let cash = 60000, n = 2, entry = 75
    for (const [order, price] of [[2, 75.25], [-1, 76.125], [1, 74.625], [-4, 73.75]]) {
      if (order < 0) cash += sign * (price - entry) * -order * 1000
      if (order > 0) entry = (entry * n + price * order) / (n + order)
      n += order
      if (n === 0) entry = 0
      const equity = cash + sign * (75 - entry) * n * 1000
      await orderCount(page).fill(String(order))
      await orderPrice(page).fill(String(price))
      await orderPrice(page).press('Tab')
      await previewButton(page).click()
      await checkAccount(page, n, equity, entry, sign)
      await applyButton(page).click()
      await checkAccount(page, n, equity, entry, sign)
      await expect.poll(async () => (await draft(page)).accountEval).toBeCloseTo(equity, 7)
      await expect.poll(async () => (await draft(page)).contracts).toBe(n)
      await page.reload()
      await checkAccount(page, n, equity, entry, sign)
    }
  })
}

test('decimal prices, cash and small ticks survive blur, step, drag and local reload', async ({ page }) => {
  await setup(page)
  await fill(page, 'entry_price', 75.25)
  await fill(page, 'account_equity', 60000.5)
  await fill(page, 'maintenance_margin_per_contract', 6000.5)
  await fill(page, 'current_price', 75.25)
  await expect(field(page, 'current_price')).toHaveValue('75.25')
  const current = page.locator('#calculator [data-analytics-key="current_price"]')
  await current.getByRole('button', { name: /증가/ }).click()
  await expect.poll(async () => Number((await field(page, 'current_price').inputValue()).replaceAll(',', ''))).toBeCloseTo(75.251, 10)
  const button = current.locator('.number-stepper__btn').first()
  const box = (await button.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 - 10)
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 - 22)
  await page.mouse.up()
  await expect.poll(async () => (await draft(page)).currentPrice).toBeCloseTo(75.253, 10)
  await page.reload()
  await expect(field(page, 'tick_size')).toHaveValue('0.001')
  await expect(field(page, 'entry_price')).toHaveValue('75.25')
  await expect(field(page, 'maintenance_margin_per_contract')).toHaveValue('6,000.5')
  // Exercise the price input branch without a stepper as well.
  await fill(page, 'tick_size', 0)
  await orderPrice(page).fill('75.125')
  await orderPrice(page).press('Tab')
  await expect(orderPrice(page)).toHaveValue('75.125')
  await fill(page, 'current_price', 75.375)
  await expect(field(page, 'current_price')).toHaveValue('75.375')
})

test('over-reduction is blocked before preview and after editing an active preview', async ({ page }) => {
  await setup(page)
  await orderCount(page).fill('-3')
  await orderPrice(page).fill('75')
  await expect(previewButton(page)).toBeDisabled()
  await orderPrice(page).press('Enter')
  await expect(field(page, 'contracts')).toHaveValue('2')
  await orderCount(page).fill('-1')
  await previewButton(page).click()
  await expect(field(page, 'contracts')).toHaveValue('1')
  await orderCount(page).fill('-3')
  await expect(applyButton(page)).toBeDisabled()
  await orderPrice(page).press('Enter')
  await expect(field(page, 'contracts')).toHaveValue('2')
  await page.keyboard.press('Escape')
  await expect(field(page, 'contracts')).toHaveValue('2')
  await expect.poll(async () => (await draft(page)).contracts).toBe(2)
})

test('direction switch and adverse-fill warning use the actual equity', async ({ page }) => {
  await setup(page, 'long', 27000, 70)
  const short = page.locator('#calculator').getByRole('button', { name: '숏', exact: true })
  await short.click() // unlock if needed
  if (!(await short.getAttribute('class'))?.includes('active')) await short.click()
  await expect(field(page, 'account_equity')).toHaveValue('7,000')
  await checkAccount(page, 2, 7000, 70, -1)
  await page.locator('#calculator').getByRole('button', { name: '롱', exact: true }).click()
  await expect(field(page, 'account_equity')).toHaveValue('27,000')
  await orderCount(page).fill('1')
  await orderPrice(page).fill('76')
  await orderPrice(page).press('Tab')
  await expect(page.locator('#calculator .order-blocked-badge')).toHaveText('주문불가')
  await previewButton(page).click()
  await expect(field(page, 'account_equity')).toHaveValue('26,000')
  await expect(page.locator('#calculator .result-panel').first()).toContainText('-1,000')
})

test('fixed total margins follow confirmation, undo, reload and full close', async ({ page }) => {
  await setup(page)
  const totalMode = page.locator('#calculator').getByRole('button', { name: '총액', exact: true })
  await totalMode.click()
  if (await totalMode.getAttribute('aria-pressed') !== 'true') await totalMode.click()
  await fill(page, 'maintenance_margin_total', 12000)
  await fill(page, 'entry_margin_total', 18000)
  await orderCount(page).fill('1')
  await orderPrice(page).fill('75.25')
  await previewButton(page).click()
  await page.getByRole('button', { name: /계약당 고정이에요/ }).click()
  await checkAccount(page, 3, 59750, 225.25 / 3, 1)
  await applyButton(page).click()
  await expect(field(page, 'maintenance_margin_total')).toHaveValue('18,000')
  await expect(field(page, 'entry_margin_total')).toHaveValue('27,000')
  await page.locator('#calculator .input-panel__head h2').click()
  await page.keyboard.press('Control+z')
  await expect(field(page, 'contracts')).toHaveValue('2')
  await expect(field(page, 'maintenance_margin_total')).toHaveValue('12,000')
  await page.keyboard.press('Control+Shift+z')
  await expect(field(page, 'contracts')).toHaveValue('3')
  await expect(field(page, 'maintenance_margin_total')).toHaveValue('18,000')
  await expect.poll(async () => (await draft(page)).maintenanceMargin).toBe(18000)
  await page.reload()
  await checkAccount(page, 3, 59750, 225.25 / 3, 1)
  await orderCount(page).fill('-3')
  await orderPrice(page).fill('76')
  await previewButton(page).click()
  await applyButton(page).click()
  await checkAccount(page, 0, 62750, 0, 1)
  await expect(field(page, 'maintenance_margin_total')).toHaveValue('0')
  await expect(field(page, 'entry_margin_total')).toHaveValue('0')
  await orderCount(page).fill('1')
  await orderPrice(page).fill('75')
  await expect(previewButton(page)).toBeDisabled()
})
