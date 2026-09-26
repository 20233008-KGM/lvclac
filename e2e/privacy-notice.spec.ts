import { expect, test, type Page } from '@playwright/test'

const preferenceKey = 'liqguard-privacy-preferences-v2'

async function expectWithinViewport(page: Page) {
  const bounds = await page.locator('.privacy-notice').evaluate((element) => {
    const rect = element.getBoundingClientRect()
    return {
      left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom,
      width: innerWidth, height: innerHeight,
      noticeWidth: rect.width,
      overflow: element.scrollWidth - element.clientWidth,
    }
  })
  expect(bounds.left).toBeGreaterThanOrEqual(0)
  expect(bounds.top).toBeGreaterThanOrEqual(0)
  expect(bounds.right).toBeLessThanOrEqual(bounds.width)
  expect(bounds.bottom).toBeLessThanOrEqual(bounds.height)
  expect(bounds.overflow).toBe(0)
  return bounds
}

for (const locale of ['ko', 'en'] as const) {
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
    { width: 844, height: 390 },
    { width: 1440, height: 900 },
    { width: 1920, height: 1000 },
  ]) {
    test(`${locale} ${viewport.width}: compact notice permits calculator use and contains details`, async ({ page }, testInfo) => {
      await page.setViewportSize(viewport)
      await page.goto(`/?lang=${locale}`)
      const notice = page.getByRole('region', { name: locale === 'ko' ? '개인정보 및 쿠키 설정' : 'Privacy and cookie settings' })
      await expect(notice).toBeVisible()
      await expect(page.getByRole('dialog')).toHaveCount(0)
      await expect(page.getByRole('switch')).toHaveCount(0)
      const compactBounds = await expectWithinViewport(page)
      if (viewport.width >= 1024) {
        const noticeCenter = compactBounds.left + compactBounds.noticeWidth / 2
        const viewportCenter = compactBounds.width / 2
        expect(compactBounds.noticeWidth).toBeGreaterThanOrEqual(858)
        expect(Math.abs(noticeCenter - viewportCenter)).toBeLessThanOrEqual(1)
        expect(compactBounds.height - compactBounds.bottom).toBeGreaterThanOrEqual(23)
        expect(compactBounds.height - compactBounds.bottom).toBeLessThanOrEqual(25)
      }
      await expect(notice.getByRole('button', { name: locale === 'ko' ? '모두 허용' : 'Allow all' }))
        .toHaveClass(/btn-primary/)
      expect((await notice.boundingBox())!.height).toBeLessThan(230)
      expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).not.toBe('hidden')
      expect(await notice.evaluate((element) => element.contains(document.activeElement))).toBe(false)
      await page.screenshot({ path: testInfo.outputPath('compact.png') })

      // Real pointer and keyboard input outside the notice, without forcing clicks.
      const input = page.locator('input[inputmode="decimal"]').first()
      await input.scrollIntoViewIfNeeded()
      await input.click()
      await input.fill('12345')
      await expect(input).toHaveValue('12,345')
      await expect(notice).toBeVisible()

      await notice.getByRole('button', { name: locale === 'ko' ? '세부 설정' : 'Manage options' }).click()
      await expect(page.getByRole('switch')).toHaveCount(2)
      await expectWithinViewport(page)
      await page.screenshot({ path: testInfo.outputPath('details.png') })
      const save = notice.getByRole('button', { name: locale === 'ko' ? '선택 저장' : 'Save choices' })
      await expect(save).toBeInViewport()
      await save.focus()
      await page.keyboard.press('Tab')
      expect(await notice.evaluate((element) => element.contains(document.activeElement))).toBe(false)
      await notice.getByRole('button', { name: locale === 'ko' ? '닫기' : 'Close', exact: true }).click()
      await expect(notice).toHaveCount(0)
      expect(await page.evaluate((key) => localStorage.getItem(key), preferenceKey)).toBeNull()
    })
  }
}

test('reject, allow, granular save and dismissal preserve the selected consent', async ({ page }) => {
  await page.goto('/?lang=ko')
  await page.getByRole('button', { name: '모두 거부', exact: true }).click()
  const saved = () => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), preferenceKey)
  await expect.poll(saved).toEqual({ analytics: false, personalizedAds: false })
  const reopen = page.getByRole('button', { name: '개인정보·쿠키 설정', exact: true })
  await reopen.click()
  await page.getByRole('switch', { name: '서비스 이용 분석' }).locator('..').click()
  await page.getByRole('button', { name: '선택 저장' }).click()
  await expect.poll(saved).toEqual({ analytics: true, personalizedAds: false })
  await page.reload()
  await expect(page.locator('.privacy-notice')).toHaveCount(0)
  await reopen.click()
  await expect(page.getByRole('switch', { name: '서비스 이용 분석' })).toBeChecked()
  await expect(page.getByRole('switch', { name: '맞춤 광고' })).not.toBeChecked()
  await page.getByRole('switch', { name: '맞춤 광고' }).locator('..').click()
  await page.keyboard.press('Escape')
  await expect(page.locator('.privacy-notice')).toHaveCount(0)
  await expect.poll(saved).toEqual({ analytics: true, personalizedAds: false })

  await page.evaluate((key) => localStorage.removeItem(key), preferenceKey)
  await page.reload()
  await page.getByRole('button', { name: '모두 허용', exact: true }).click()
  await expect.poll(saved).toEqual({ analytics: true, personalizedAds: true })
})
