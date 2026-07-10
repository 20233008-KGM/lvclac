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

  // location check: save toggle should be back under the margin section, not the header
  const inHead = await page.locator('.input-panel__head .draft-save').count()
  const inFooter = await page.locator('.field-section-footer .draft-save').count()
  log('save toggle is NOT inside the input panel header', inHead === 0, `count=${inHead}`)
  log('save toggle is back inside the margin section footer', inFooter === 1, `count=${inFooter}`)

  const localBtn = page.locator('.draft-save-slot--local')
  await localBtn.click()
  const enableModalBtn = page.locator('.draft-save-modal-btn')
  const enableModalVisible = await enableModalBtn.waitFor({ state: 'visible', timeout: 2000 }).then(() => true).catch(() => false)
  if (enableModalVisible) {
    await enableModalBtn.click()
    await enableModalBtn.waitFor({ state: 'hidden', timeout: 2000 }).catch(() => {})
  }
  await fillOneField(page, '계좌 평가금액', '7654321')
  await page.waitForTimeout(900)

  const statusText = await page.locator('.draft-save-status').textContent().catch(() => null)
  log('status text uses checkmark + 8-digit compact timestamp, no location label', Boolean(statusText && /^✓\s?\d{8}$/.test(statusText.trim())), `text="${statusText}"`)

  const slotsBox = await page.locator('.draft-save-slots').boundingBox()
  const statusBox = await page.locator('.draft-save-status').boundingBox()
  const sameRow = slotsBox && statusBox && Math.abs(slotsBox.y - statusBox.y) < 6
  log('status text sits on the same row as the slot icons (inline, not stacked)', Boolean(sameRow), `slots.y=${slotsBox?.y} status.y=${statusBox?.y}`)

  await browser.close()
  console.log(`\n=== Summary: ${passCount} passed, ${failCount} failed ===`)
  process.exit(failCount > 0 ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
