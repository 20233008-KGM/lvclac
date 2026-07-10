import { chromium } from 'playwright'
import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'

const BASE = 'http://localhost:5174'
const TEST_PASSWORD = 'QaTest12345!'

const envText = fs.readFileSync('.env', 'utf8')
const env = {}
for (const line of envText.split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m) env[m[1]] = m[2].trim()
}
const adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

let TEST_EMAIL = null
let TEST_USER_ID = null
async function createPreConfirmedTestUser() {
  TEST_EMAIL = `qa-savedat-admin-${Date.now()}@example.com`
  const { data, error } = await adminClient.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: { nickname: 'QaSavedAt' },
  })
  if (error) throw new Error(`admin createUser failed: ${error.message}`)
  TEST_USER_ID = data.user.id
}

async function cleanupTestUser() {
  if (!TEST_USER_ID) return
  await adminClient.auth.admin.deleteUser(TEST_USER_ID)
  console.log(`Cleaned up test user ${TEST_EMAIL} (${TEST_USER_ID})`)
}

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

async function waitForText(locator, substring, timeoutMs = 6000) {
  const start = Date.now()
  let last = null
  while (Date.now() - start < timeoutMs) {
    last = await locator.textContent().catch(() => null)
    if (last && last.includes(substring)) return last
    await new Promise((r) => setTimeout(r, 200))
  }
  return last
}

async function fillOneField(page, label, value) {
  const input = page.locator('label.field', { hasText: label }).locator('input').first()
  await input.fill(value)
  await input.blur()
}

function statusEl(page) {
  return page.locator('.draft-save-status')
}

async function main() {
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()
  page.on('pageerror', (err) => { console.log('  [page error]', err.message); failCount++ })
  await page.addInitScript(() => {
    localStorage.setItem('leverage_account_setting_guard_skip', '1')
  })
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await dismissDisclaimer(page)

  // ===== Scenario 1: local save ON -> change input -> "이 기기에 저장됨 · [시각]" =====
  const localBtn = page.locator('.draft-save-slot--local')
  await localBtn.click()
  // may open enable-modal on first activation
  const enableModalBtn = page.locator('.draft-save-modal-btn')
  const enableModalVisible = await enableModalBtn.waitFor({ state: 'visible', timeout: 2000 }).then(() => true).catch(() => false)
  if (enableModalVisible) {
    await enableModalBtn.click()
    await enableModalBtn.waitFor({ state: 'hidden', timeout: 2000 }).catch(() => {})
  }

  const beforeChange = new Date()
  await fillOneField(page, '계좌 평가금액', '12345678')
  await page.waitForTimeout(900) // clear the 500ms persist debounce fully before asserting a settled value

  const text1 = await statusEl(page).textContent().catch(() => null)
  log('S1: local save shows "이 기기에 저장됨" status', Boolean(text1 && text1.includes('이 기기에 저장됨')), `text="${text1}"`)
  log('S1: status includes a timestamp separator " · "', Boolean(text1 && text1.includes(' · ')), `text="${text1}"`)

  const savedAtLS = await page.evaluate(() => localStorage.getItem('leverage_calculator_draft_saved_at'))
  log('S1: localStorage draft-saved-at key is set', Boolean(savedAtLS), `value=${savedAtLS}`)
  if (savedAtLS) {
    const savedDate = new Date(savedAtLS)
    const deltaMs = Math.abs(savedDate.getTime() - beforeChange.getTime())
    log('S1: saved timestamp is close to actual current time (<10s)', deltaMs < 10000, `deltaMs=${deltaMs}`)
  }

  // ===== Scenario 3a: refresh preserves local saved-at (value must have settled first, see wait above) =====
  await page.reload({ waitUntil: 'networkidle' })
  await dismissDisclaimer(page)
  await page.waitForTimeout(300)
  const text1AfterReload = await statusEl(page).textContent().catch(() => null)
  log('S3a: after reload, local saved-at status still shown', Boolean(text1AfterReload && text1AfterReload.includes('이 기기에 저장됨') && text1AfterReload.includes(' · ')), `text="${text1AfterReload}"`)
  const savedAtLSAfterReload = await page.evaluate(() => localStorage.getItem('leverage_calculator_draft_saved_at'))
  log('S3a: localStorage draft-saved-at unchanged after reload', savedAtLSAfterReload === savedAtLS, `before=${savedAtLS} after=${savedAtLSAfterReload}`)

  // ===== Scenario 4: turn save OFF -> saved-at display disappears =====
  const offBtn = page.locator('.draft-save-slot--off')
  await offBtn.click()
  await page.waitForTimeout(200)
  const statusVisibleAfterOff = await statusEl(page).isVisible().catch(() => false)
  log('S4: turning save off hides saved-at status', !statusVisibleAfterOff, `visible=${statusVisibleAfterOff}`)

  // Turn local save back on for next checks
  await localBtn.click()
  const enableModalBtn2 = page.locator('.draft-save-modal-btn')
  const enableModal2Visible = await enableModalBtn2.waitFor({ state: 'visible', timeout: 2000 }).then(() => true).catch(() => false)
  if (enableModal2Visible) {
    await enableModalBtn2.click()
    await enableModalBtn2.waitFor({ state: 'hidden', timeout: 2000 }).catch(() => {})
  }
  await fillOneField(page, '보유 계약수', '3')
  await page.waitForTimeout(400)
  const textReenabled = await statusEl(page).textContent().catch(() => null)
  log('S4b: re-enabling local save shows saved-at again', Boolean(textReenabled && textReenabled.includes('이 기기에 저장됨')), `text="${textReenabled}"`)

  // ===== Scenario: regression check - loading/saving/error classnames still driven by syncStatus =====
  const statusClass = await statusEl(page).getAttribute('class').catch(() => null)
  log('Regression: status span still uses draft-save-status--<syncStatus> class pattern', Boolean(statusClass && statusClass.includes('draft-save-status--saved')), `class="${statusClass}"`)

  await context.close()

  // ===== Scenario 2 & 5: login, switch to cloud, verify cloud saved-at, verify local/cloud don't mix =====
  const context2 = await browser.newContext()
  const page2 = await context2.newPage()
  page2.on('pageerror', (err) => { console.log('  [page error auth]', err.message); failCount++ })
  await page2.addInitScript(() => {
    localStorage.setItem('leverage_account_setting_guard_skip', '1')
  })
  await page2.goto(BASE, { waitUntil: 'networkidle' })
  await dismissDisclaimer(page2)

  // Log in with a pre-confirmed test account created via Supabase admin API
  // (avoids the auth signup-email rate limit hit by repeated UI registrations)
  await createPreConfirmedTestUser()
  console.log(`Using pre-confirmed test account: ${TEST_EMAIL}`)

  const authOpenBtn = page2.locator('button', { hasText: '로그인' }).first()
  await authOpenBtn.click()
  await page2.locator('.auth-modal').waitFor({ state: 'visible', timeout: 5000 })

  const loginEmailInput = page2.locator('input[autocomplete="email"]')
  const loginPwInput = page2.locator('input[autocomplete="current-password"]')
  await loginEmailInput.waitFor({ state: 'visible', timeout: 5000 })
  await loginEmailInput.fill(TEST_EMAIL)
  await loginPwInput.fill(TEST_PASSWORD)
  await page2.locator('button[type="submit"]', { hasText: /로그인/ }).click()
  await page2.waitForTimeout(1500)

  const errorAlertVisible = await page2.locator('.auth-alert--error').isVisible().catch(() => false)
  const errorText = errorAlertVisible ? await page2.locator('.auth-alert--error').textContent() : null
  const modalStillOpen = await page2.locator('.auth-modal').isVisible().catch(() => false)
  log('Setup: login with pre-confirmed test account succeeds (modal closes, no error)', !errorAlertVisible && !modalStillOpen, `errorVisible=${errorAlertVisible} errorText="${errorText}" modalStillOpen=${modalStillOpen}`)

  if (!errorAlertVisible && !modalStillOpen) {
    await page2.waitForTimeout(500)
    const cloudBtnVisible = await page2.locator('.draft-save-slot--cloud').isVisible().catch(() => false)
    log('S2: cloud save slot available after login', cloudBtnVisible)

    if (cloudBtnVisible) {
      const cloudBtn = page2.locator('.draft-save-slot--cloud')
      await cloudBtn.click()
      const confirmBtn = page2.locator('.draft-save-modal-btn')
      const confirmBtnVisible = await confirmBtn.waitFor({ state: 'visible', timeout: 3000 }).then(() => true).catch(() => false)
      if (confirmBtnVisible) {
        await confirmBtn.click()
        await confirmBtn.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {})
      }

      await fillOneField(page2, '계좌 평가금액', '99999999')
      const cloudText = await waitForText(statusEl(page2), '클라우드에 저장됨', 8000)
      log('S2: cloud save shows "클라우드에 저장됨" status', Boolean(cloudText && cloudText.includes('클라우드에 저장됨')), `text="${cloudText}"`)
      log('S2: cloud status includes a timestamp separator " · "', Boolean(cloudText && cloudText.includes(' · ')), `text="${cloudText}"`)

      // Scenario 5: switch to local (first-time use in this session -> triggers its own enable modal),
      // give it a MEANINGFUL local draft (an empty/default draft correctly shows no saved-at at all —
      // see persistInputs' hasMeaningfulCalculatorInputs guard), then verify local/cloud timestamps don't mix
      const localBtn2 = page2.locator('.draft-save-slot--local')
      if (await localBtn2.isVisible().catch(() => false)) {
        await localBtn2.click()
        const localEnableModalBtn = page2.locator('.draft-save-modal-btn')
        const localEnableModalVisible = await localEnableModalBtn.waitFor({ state: 'visible', timeout: 2000 }).then(() => true).catch(() => false)
        if (localEnableModalVisible) {
          await localEnableModalBtn.click()
          await localEnableModalBtn.waitFor({ state: 'hidden', timeout: 2000 }).catch(() => {})
        }
        await fillOneField(page2, '계좌 평가금액', '11112222')
        const localTextAfterSwitch = await waitForText(statusEl(page2), '이 기기에 저장됨', 4000)
        log('S5: switching to local (with real data) shows local label, not cloud label', Boolean(localTextAfterSwitch && localTextAfterSwitch.includes('이 기기에 저장됨') && !localTextAfterSwitch.includes('클라우드')), `text="${localTextAfterSwitch}"`)

        await cloudBtn.click()
        const cloudTextAfterSwitchBack = await waitForText(statusEl(page2), '클라우드에 저장됨', 4000)
        log('S5: switching back to cloud shows cloud label, not local label', Boolean(cloudTextAfterSwitchBack && cloudTextAfterSwitchBack.includes('클라우드에 저장됨') && !cloudTextAfterSwitchBack.includes('이 기기에')), `text="${cloudTextAfterSwitchBack}"`)
        log('S5: cloud timestamp differs from local timestamp (not leaked across modes)', cloudTextAfterSwitchBack !== localTextAfterSwitch, `local="${localTextAfterSwitch}" cloud="${cloudTextAfterSwitchBack}"`)
      }

      // Scenario 3b: refresh preserves cloud saved-at (DB updated_at should NOT change from just reloading)
      const { data: beforeReloadRows } = await adminClient
        .from('number_sets')
        .select('id, updated_at')
        .eq('user_id', TEST_USER_ID)
      const updatedAtBeforeReload = beforeReloadRows?.[0]?.updated_at ?? null

      await page2.reload({ waitUntil: 'networkidle' })
      await dismissDisclaimer(page2)
      const cloudTextAfterReload = await waitForText(statusEl(page2), '클라우드에 저장됨', 6000)
      await page2.waitForTimeout(1500) // extra settle time for a spurious re-save's debounce, if present
      log('S3b: after reload, cloud saved-at status still shown', Boolean(cloudTextAfterReload && cloudTextAfterReload.includes('클라우드에 저장됨') && cloudTextAfterReload.includes(' · ')), `text="${cloudTextAfterReload}"`)

      const { data: afterReloadRows } = await adminClient
        .from('number_sets')
        .select('id, updated_at')
        .eq('user_id', TEST_USER_ID)
      const updatedAtAfterReload = afterReloadRows?.[0]?.updated_at ?? null
      log('S3b: DB updated_at unchanged by a mere reload (no spurious re-save)', updatedAtBeforeReload === updatedAtAfterReload, `before=${updatedAtBeforeReload} after=${updatedAtAfterReload}`)

      // Scenario 4c: click the already-active cloud slot again -> delete-confirm modal -> confirm -> status disappears
      await cloudBtn.click()
      const deleteConfirmBtn = page2.locator('.draft-save-modal-btn')
      const deleteModalVisible = await deleteConfirmBtn.waitFor({ state: 'visible', timeout: 3000 }).then(() => true).catch(() => false)
      log('S4c: re-clicking active cloud slot opens delete-confirm modal', deleteModalVisible)
      if (deleteModalVisible) {
        await deleteConfirmBtn.click()
        await page2.waitForTimeout(600)
        const statusAfterDelete = await statusEl(page2).isVisible().catch(() => false)
        log('S4c: deleting cloud saved data hides saved-at status', !statusAfterDelete, `visible=${statusAfterDelete}`)
      }
    }
  }

  await context2.close()
  await browser.close()
  await cleanupTestUser()

  console.log(`\n=== Summary: ${passCount} passed, ${failCount} failed ===`)
  process.exit(failCount > 0 ? 1 : 0)
}

main().catch(async (e) => {
  console.error(e)
  await cleanupTestUser().catch(() => {})
  process.exit(1)
})
