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

  for (const viewport of [{ name: 'desktop', width: 1280, height: 900 }, { name: 'narrow-mobile', width: 360, height: 780 }]) {
    const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } })
    await page.addInitScript(() => {
      localStorage.setItem('leverage_account_setting_guard_skip', '1')
    })
    await page.goto(BASE, { waitUntil: 'networkidle' })
    await dismissDisclaimer(page)

    const head = page.locator('.input-panel__head')
    const saveRow = head.locator('.input-panel__save-row')
    const saveRowInHead = await saveRow.count()
    log(`[${viewport.name}] save row is inside .input-panel__head`, saveRowInHead === 1, `count=${saveRowInHead}`)

    const footerLeftover = await page.locator('.field-section-footer').count()
    log(`[${viewport.name}] old field-section-footer wrapper removed from DOM`, footerLeftover === 0, `count=${footerLeftover}`)

    // overlap check: head bounding box should contain both h2 and save-row without horizontal overlap causing clipping
    const headBox = await head.boundingBox()
    const h2Box = await head.locator('h2').boundingBox()
    const clearBtnBox = await head.locator('.input-panel__clear-actions').boundingBox().catch(() => null)
    const saveRowBox = await saveRow.boundingBox()
    const withinHead = headBox && saveRowBox && saveRowBox.y >= headBox.y && (saveRowBox.y + saveRowBox.height) <= (headBox.y + headBox.height + 1)
    log(`[${viewport.name}] save row fits within head bounding box`, Boolean(withinHead), `head=${JSON.stringify(headBox)} saveRow=${JSON.stringify(saveRowBox)}`)

    const noOverlapWithClearBtn = !clearBtnBox || !saveRowBox || (saveRowBox.y >= clearBtnBox.y + clearBtnBox.height - 1) || (saveRowBox.y + saveRowBox.height <= clearBtnBox.y + 1)
    log(`[${viewport.name}] save row does not visually overlap the clear button`, Boolean(noOverlapWithClearBtn), `clearBtn=${JSON.stringify(clearBtnBox)} saveRow=${JSON.stringify(saveRowBox)}`)

    // Turn on local save, verify saved-at status still shows correctly in the new location
    const localBtn = saveRow.locator('.draft-save-slot--local')
    await localBtn.click()
    const enableModalBtn = page.locator('.draft-save-modal-btn')
    const enableModalVisible = await enableModalBtn.waitFor({ state: 'visible', timeout: 2000 }).then(() => true).catch(() => false)
    if (enableModalVisible) {
      await enableModalBtn.click()
      await enableModalBtn.waitFor({ state: 'hidden', timeout: 2000 }).catch(() => {})
    }
    await fillOneField(page, '계좌 평가금액', '5555555')
    await page.waitForTimeout(900)
    const statusText = await saveRow.locator('.draft-save-status').textContent().catch(() => null)
    log(`[${viewport.name}] saved-at status renders inside the relocated save row`, Boolean(statusText && statusText.includes('이 기기에 저장됨')), `text="${statusText}"`)

    await page.close()
  }

  await browser.close()
  console.log(`\n=== Summary: ${passCount} passed, ${failCount} failed ===`)
  process.exit(failCount > 0 ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
