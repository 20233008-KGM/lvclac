import { chromium } from 'playwright'

const BASE = 'http://localhost:5174'

let passCount = 0
let failCount = 0
function log(step, ok, detail) {
  if (ok) passCount++
  else failCount++
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${step}${detail ? ' | ' + detail : ''}`)
}

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

async function fillBaseline(page) {
  const fields = [
    ['계좌 평가금액', '10000000'],
    ['약정금액 (1계약)', '250000'],
    ['보유 계약수', '2'],
    ['현재가', '35000'],
    ['틱 사이즈', '5'],
    ['계약 승수', '1'],
    ['유지증거금률', '0.25'],
    ['개시증거금률 (위탁)', '0.35'],
  ]
  for (const [label, value] of fields) {
    const input = page.locator('label.field', { hasText: label }).locator('input').first()
    await input.fill(value)
    await input.blur()
  }
}

function parseNum(s) {
  if (s == null) return undefined
  const cleaned = s.replace(/,/g, '').trim()
  if (cleaned === '') return undefined
  return Number(cleaned)
}

async function readCurrentPrice(page) {
  const input = page.locator('label.field', { hasText: '현재가' }).locator('input').first()
  return parseNum(await input.inputValue())
}

async function readAccountEval(page) {
  const input = page.locator('label.field', { hasText: '계좌 평가금액' }).locator('input').first()
  return parseNum(await input.inputValue())
}

async function main() {
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()
  page.on('pageerror', (err) => console.log('  [page error]', err.message))
  await page.addInitScript(() => {
    localStorage.setItem('leverage_account_setting_guard_skip', '1')
  })
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await dismissDisclaimer(page)
  await fillBaseline(page)
  await page.waitForTimeout(300)

  const priceField = page.locator('label.field', { hasText: '현재가' })
  const upBtn = priceField.locator('.number-stepper__btn').first()
  const box = await upBtn.boundingBox()
  if (!box) {
    console.log('FATAL: could not locate current price stepper up button (tickSize field may not have applied)')
    await browser.close()
    process.exit(1)
  }
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2

  // ===== Test 1: single tap -> Ctrl+Z restores original =====
  const priceBefore1 = await readCurrentPrice(page)
  const evalBefore1 = await readAccountEval(page)
  await page.mouse.move(cx, cy)
  await page.mouse.down()
  await page.mouse.up()
  await page.waitForTimeout(100)
  const priceAfterTap = await readCurrentPrice(page)
  const evalAfterTap = await readAccountEval(page)
  log('T1: single tap changes current price', priceAfterTap !== priceBefore1, `before=${priceBefore1} after=${priceAfterTap}`)

  await page.keyboard.press('Control+z')
  await page.waitForTimeout(150)
  const priceAfterUndo1 = await readCurrentPrice(page)
  const evalAfterUndo1 = await readAccountEval(page)
  log('T1: Ctrl+Z restores current price after single tap', priceAfterUndo1 === priceBefore1, `expected=${priceBefore1} got=${priceAfterUndo1}`)
  log('T1: Ctrl+Z restores accountEval after single tap', evalAfterUndo1 === evalBefore1, `expected=${evalBefore1} got=${evalAfterUndo1}`)

  await page.keyboard.press('Control+Shift+Z')
  await page.waitForTimeout(150)
  const priceAfterRedo1 = await readCurrentPrice(page)
  const evalAfterRedo1 = await readAccountEval(page)
  log('T1: Ctrl+Shift+Z reapplies current price after undo', priceAfterRedo1 === priceAfterTap, `expected=${priceAfterTap} got=${priceAfterRedo1}`)
  log('T1: Ctrl+Shift+Z reapplies accountEval after undo', evalAfterRedo1 === evalAfterTap, `expected=${evalAfterTap} got=${evalAfterRedo1}`)

  // ===== Test 2: press-and-hold (multiple ticks) -> Ctrl+Z restores pre-hold value =====
  const priceBefore2 = await readCurrentPrice(page)
  const evalBefore2 = await readAccountEval(page)
  await page.mouse.move(cx, cy)
  await page.mouse.down()
  await page.waitForTimeout(650) // > HOLD_DELAY_MS(400) + a couple HOLD_INTERVAL_MS(80) ticks
  await page.mouse.up()
  await page.waitForTimeout(100)
  const priceAfterHold = await readCurrentPrice(page)
  const ticksMoved = priceBefore2 != null && priceAfterHold != null ? Math.round((priceAfterHold - priceBefore2) / 5) : 0
  log('T2: hold moves multiple ticks (>1)', Math.abs(ticksMoved) > 1, `before=${priceBefore2} after=${priceAfterHold} ticks=${ticksMoved}`)

  await page.keyboard.press('Control+z')
  await page.waitForTimeout(150)
  const priceAfterUndo2 = await readCurrentPrice(page)
  const evalAfterUndo2 = await readAccountEval(page)
  log('T2: Ctrl+Z restores pre-hold price (not just last tick)', priceAfterUndo2 === priceBefore2, `expected=${priceBefore2} got=${priceAfterUndo2}`)
  log('T2: Ctrl+Z restores pre-hold accountEval', evalAfterUndo2 === evalBefore2, `expected=${evalBefore2} got=${evalAfterUndo2}`)

  // ===== Test 3: drag scrub (multiple ticks) -> Ctrl+Z restores pre-drag value =====
  const priceBefore3 = await readCurrentPrice(page)
  const evalBefore3 = await readAccountEval(page)
  await page.mouse.move(cx, cy)
  await page.mouse.down()
  await page.mouse.move(cx, cy - 20, { steps: 3 })
  await page.mouse.move(cx, cy - 60, { steps: 5 })
  await page.mouse.move(cx, cy - 100, { steps: 5 })
  await page.mouse.up()
  await page.waitForTimeout(100)
  const priceAfterDrag = await readCurrentPrice(page)
  const dragTicks = priceBefore3 != null && priceAfterDrag != null ? Math.round((priceAfterDrag - priceBefore3) / 5) : 0
  log('T3: drag moves multiple ticks (>1)', Math.abs(dragTicks) > 1, `before=${priceBefore3} after=${priceAfterDrag} ticks=${dragTicks}`)

  await page.keyboard.press('Control+z')
  await page.waitForTimeout(150)
  const priceAfterUndo3 = await readCurrentPrice(page)
  const evalAfterUndo3 = await readAccountEval(page)
  log('T3: Ctrl+Z restores pre-drag price (not just last tick)', priceAfterUndo3 === priceBefore3, `expected=${priceBefore3} got=${priceAfterUndo3}`)
  log('T3: Ctrl+Z restores pre-drag accountEval', evalAfterUndo3 === evalBefore3, `expected=${evalBefore3} got=${evalAfterUndo3}`)

  // ===== Test 4: two consecutive drags, single Ctrl+Z reverts only the second =====
  const priceBefore4 = await readCurrentPrice(page)
  // drag A
  await page.mouse.move(cx, cy)
  await page.mouse.down()
  await page.mouse.move(cx, cy - 20, { steps: 3 })
  await page.mouse.move(cx, cy - 60, { steps: 5 })
  await page.mouse.up()
  await page.waitForTimeout(100)
  const priceAfterDragA = await readCurrentPrice(page)
  log('T4: drag A moved price', priceAfterDragA !== priceBefore4, `before=${priceBefore4} afterA=${priceAfterDragA}`)

  // drag B (separate gesture, new pointerdown)
  await page.mouse.move(cx, cy)
  await page.mouse.down()
  await page.mouse.move(cx, cy - 20, { steps: 3 })
  await page.mouse.move(cx, cy - 60, { steps: 5 })
  await page.mouse.up()
  await page.waitForTimeout(100)
  const priceAfterDragB = await readCurrentPrice(page)
  log('T4: drag B moved price further', priceAfterDragB !== priceAfterDragA, `afterA=${priceAfterDragA} afterB=${priceAfterDragB}`)

  await page.keyboard.press('Control+z')
  await page.waitForTimeout(150)
  const priceAfterSingleUndo = await readCurrentPrice(page)
  log(
    'T4: single Ctrl+Z after two drags reverts ONLY drag B (lands on post-drag-A value)',
    priceAfterSingleUndo === priceAfterDragA,
    `expected(post-dragA)=${priceAfterDragA} got=${priceAfterSingleUndo}`,
  )
  log(
    'T4: single Ctrl+Z does NOT wipe drag A entirely (should not equal pre-drag-A value, unless dragA==0 ticks)',
    priceAfterDragA === priceBefore4 || priceAfterSingleUndo !== priceBefore4,
    `pre-dragA=${priceBefore4} afterSingleUndo=${priceAfterSingleUndo}`,
  )

  // ===== Test 5: contracts field (unrelated NumberStepper) still works with 1-arg onChange =====
  const contractsField = page.locator('label.field', { hasText: '보유 계약수' })
  const contractsUpBtn = contractsField.locator('.number-stepper__btn').first()
  const cBox = await contractsUpBtn.boundingBox()
  const contractsInput = contractsField.locator('input').first()
  const contractsBefore = parseNum(await contractsInput.inputValue())
  await page.mouse.move(cBox.x + cBox.width / 2, cBox.y + cBox.height / 2)
  // first click on a guard-locked baseline field only unlocks (skip flag auto-confirms); does not bump
  await page.mouse.down()
  await page.mouse.up()
  await page.waitForTimeout(100)
  await page.mouse.down()
  await page.mouse.up()
  await page.waitForTimeout(100)
  const contractsAfter = parseNum(await contractsInput.inputValue())
  log('T5: contracts stepper (no gesture/undo logic) still increments normally', contractsAfter === (contractsBefore ?? 0) + 1, `before=${contractsBefore} after=${contractsAfter}`)

  // ===== Test 6: setupComplete=false path (rollPnlOnChange=false) -- plain currentPrice change, no crash =====
  await context.close()
  const context2 = await browser.newContext()
  const page2 = await context2.newPage()
  page2.on('pageerror', (err) => { console.log('  [page error T6]', err.message); failCount++ })
  await page2.goto(BASE, { waitUntil: 'networkidle' })
  await dismissDisclaimer(page2)
  // Only fill current price + tickSize, leave setup incomplete
  const priceInput2 = page2.locator('label.field', { hasText: '현재가' }).locator('input').first()
  await priceInput2.fill('35000')
  await priceInput2.blur()
  const tickInput2 = page2.locator('label.field', { hasText: '틱 사이즈' }).locator('input').first()
  await tickInput2.fill('5')
  await tickInput2.blur()
  await page2.waitForTimeout(200)

  const priceField2 = page2.locator('label.field', { hasText: '현재가' })
  const upBtn2 = priceField2.locator('.number-stepper__btn').first()
  const box2 = await upBtn2.boundingBox()
  const priceBefore6 = parseNum(await priceInput2.inputValue())
  await page2.mouse.move(box2.x + box2.width / 2, box2.y + box2.height / 2)
  await page2.mouse.down()
  await page2.waitForTimeout(650)
  await page2.mouse.up()
  await page2.waitForTimeout(100)
  const priceAfter6 = parseNum(await priceInput2.inputValue())
  log('T6: setupComplete=false — hold on current price stepper works without crash/regression', priceAfter6 !== priceBefore6, `before=${priceBefore6} after=${priceAfter6}`)
  // Ctrl+Z should be a no-op here since rollPnlOnChange=false never sets markPriceUndoSnapshot
  await page2.keyboard.press('Control+z')
  await page2.waitForTimeout(150)
  const priceAfterUndo6 = parseNum(await priceInput2.inputValue())
  log('T6: Ctrl+Z is a no-op when setup incomplete (no markPriceUndoSnapshot path)', priceAfterUndo6 === priceAfter6, `expected(unchanged)=${priceAfter6} got=${priceAfterUndo6}`)

  await context2.close()
  await browser.close()

  console.log(`\n=== Summary: ${passCount} passed, ${failCount} failed ===`)
  process.exit(failCount > 0 ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
