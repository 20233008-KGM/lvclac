import { chromium } from 'playwright'

const BASE = 'http://localhost:5174'

async function dismissDisclaimer(page) {
  const overlay = page.locator('.disclaimer-overlay')
  if (await overlay.isVisible().catch(() => false)) {
    const ackCheckbox = overlay.locator('label.disclaimer-modal-ack input[type="checkbox"]')
    await ackCheckbox.check()
    const btn = overlay.getByRole('button', { name: '동의하고 시작' })
    await btn.click()
    await page.waitForTimeout(150)
  }
}

async function fillOneField(page, label, value) {
  const input = page.locator('label.field', { hasText: label }).locator('input').first()
  await input.fill(value)
  await input.blur()
}

let passCount = 0
let failCount = 0
function log(step, ok, detail) {
  if (ok) passCount++
  else failCount++
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${step}${detail ? ' | ' + detail : ''}`)
}

async function main() {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  await page.addInitScript(() => {
    localStorage.setItem('leverage_account_setting_guard_skip', '1')
  })
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await dismissDisclaimer(page)

  const localBtn = page.locator('.draft-save-slot--local')
  await localBtn.click()
  const enableModalBtn = page.locator('.draft-save-modal-btn')
  const enableModalVisible = await enableModalBtn.waitFor({ state: 'visible', timeout: 2000 }).then(() => true).catch(() => false)
  if (enableModalVisible) {
    await enableModalBtn.click()
    await enableModalBtn.waitFor({ state: 'hidden', timeout: 2000 }).catch(() => {})
  }

  await fillOneField(page, '계좌 평가금액', '12345678')
  await page.waitForTimeout(900)

  const statusEl = page.locator('.draft-save-status')
  const text = await statusEl.textContent().catch(() => null)
  const color = await statusEl.evaluate((el) => getComputedStyle(el).color).catch(() => null)
  const dimColor = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--color-text-dim').trim())
  const successColor = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--color-success').trim())

  log('status text uses short time format (no full date/seconds for today)', Boolean(text && /\d{1,2}:\d{2}/.test(text) && !/\d{4}\.\s*\d{1,2}\.\s*\d{1,2}\./.test(text)), `text="${text}"`)
  log('status color is the dim/muted tone, not success green', color !== null && color !== `rgb(${successColor})` , `color="${color}" dim="${dimColor}" success="${successColor}"`)

  await browser.close()
  console.log(`\n=== Summary: ${passCount} passed, ${failCount} failed ===`)
  process.exit(failCount > 0 ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
