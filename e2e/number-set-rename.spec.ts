import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.route('https://ipapi.co/**', (route) => route.abort())
  await page.addInitScript(() => {
    localStorage.clear()
    sessionStorage.clear()
    localStorage.setItem('liqguard-welcome-intro-seen-v1', '1')
    localStorage.setItem('leverage-disclaimer-skip-v3', '1')
    localStorage.setItem('leverage-public-save-consent-v1', 'local')
  })
})

test('renaming the active number set updates the input-panel active label', async ({ page }) => {
  await page.goto('/?lang=ko#calculator')

  await page.locator('#calculator .draft-save-slot--local').click()
  await page.getByRole('button', { name: '동의하고 저장' }).click()
  await page.locator('#calculator .draft-number-set-picker').click()
  await page.locator('.draft-number-set-menu__rename-trigger').click()
  await page.locator('.draft-number-set-menu__rename-input').fill('삼성08')
  await page.keyboard.press('Enter')

  await expect(page.locator('#calculator .active-number-set-label__name')).toHaveText('삼성08')

  await page.locator('.draft-number-set-menu__rename-trigger').click()
  await page.locator('.draft-number-set-menu__rename-input').fill('삼성09')
  await page.keyboard.press('Enter')

  await expect(page.locator('#calculator .active-number-set-label__name')).toHaveText('삼성09')
})
