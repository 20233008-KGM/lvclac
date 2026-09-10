import { expect, test } from '@playwright/test'

test('margin rates retain precision after Enter, blur and local reload', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('leverage_locale', 'ko')
    localStorage.setItem('leverage_save_enabled', '1')
    localStorage.setItem('leverage_save_storage_mode', 'local')
    localStorage.setItem('leverage_account_setting_guard_skip', '1')
  })
  await page.goto('/?lang=ko')
  const maintenance = page.locator('label.field').filter({ has: page.locator('.field-label-text', { hasText: '유지증거금률' }) }).locator('input')
  const initial = page.locator('label.field').filter({ has: page.locator('.field-label-text', { hasText: '개시증거금률' }) }).locator('input')
  await maintenance.fill('0.4995')
  await maintenance.press('Enter')
  await expect(maintenance).toHaveValue('0.4995')
  await initial.fill('0.5001234')
  await initial.press('Tab')
  await expect(initial).toHaveValue('0.5001234')
  await expect.poll(() => page.evaluate(() => {
    const draft = JSON.parse(localStorage.getItem('leverage_calculator_draft') ?? '{}')
    return [draft.maintenanceMarginRate, draft.entrustedMarginRate]
  })).toEqual([0.4995, 0.5001234])
  await page.reload()
  await expect(maintenance).toHaveValue('0.4995')
  await expect(initial).toHaveValue('0.5001234')
  await maintenance.fill('0.0000001')
  await maintenance.press('Tab')
  await expect(maintenance).toHaveValue('0.0000001')
})
