import { expect, test, type Page } from '@playwright/test'

for (const width of [1440, 390]) {
  test(`workspace resize bar: drag, keyboard and minimum at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto('/e2e/fixtures/memo-policy.html?lang=en&editor=workspace')
    const field = page.getByRole('textbox')
    const bar = page.getByRole('button', { name: 'Drag or use the up and down arrow keys to resize the memo' })
    await expect(bar).toBeVisible()
    const initial = (await field.boundingBox())!.height
    const handle = (await bar.boundingBox())!
    await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2)
    await page.mouse.down()
    await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2 + 100)
    await page.mouse.up()
    await expect.poll(async () => (await field.boundingBox())!.height).toBe(initial + 100)
    await bar.focus()
    await page.keyboard.press('ArrowDown')
    await expect.poll(async () => (await field.boundingBox())!.height).toBe(initial + 140)
    await page.keyboard.press('Home')
    await expect.poll(async () => (await field.boundingBox())!.height).toBe(width === 390 ? 280 : 420)
    await page.keyboard.press('ArrowUp')
    await expect.poll(async () => (await field.boundingBox())!.height).toBe(width === 390 ? 280 : 420)
    await field.fill('memo remains editable after resizing')
    await expect.poll(() => stored(page)).toBe('memo remains editable after resizing')
  })
}

async function paste(page: Page, value: string) {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.evaluate(text => navigator.clipboard.writeText(text), value)
  await page.getByRole('textbox').focus()
  await page.keyboard.press('Control+End')
  await page.keyboard.press('Control+V')
}

async function snapshot(page: Page) {
  return page.evaluate(() => (window as unknown as {
    memoTest: { stored: string; active: number; maxActive: number; calls: { value: string; previous: string }[] }
  }).memoTest)
}

async function stored(page: Page) { return (await snapshot(page)).stored }

for (const editor of ['workspace', 'window']) {
  test(`${editor}: Free Unicode boundary, rejection without truncation, and replacement`, async ({ page }) => {
    await page.goto(`/e2e/fixtures/memo-policy.html?lang=ko&editor=${editor}`)
    const field = page.getByRole('textbox')
    await paste(page, '😀'.repeat(1000))
    await expect(field).toHaveValue('😀'.repeat(1000))
    await expect.poll(() => stored(page)).toBe('😀'.repeat(1000))
    await paste(page, '추가')
    await expect(page.getByRole('alert')).toContainText('1,000자')
    await expect(field).toHaveValue('😀'.repeat(1000))
    await field.fill('수정')
    await expect.poll(() => stored(page)).toBe('수정')
  })

  test(`${editor}: Pro permits long notes and blocks a paste above 50,000`, async ({ page }) => {
    await page.goto(`/e2e/fixtures/memo-policy.html?lang=en&pro=1&editor=${editor}&length=150000`)
    const field = page.getByRole('textbox')
    await expect(field).not.toHaveAttribute('maxlength')
    await paste(page, 'a'.repeat(50000))
    await expect.poll(async () => (await stored(page)).length).toBe(200000)
    await paste(page, 'b'.repeat(50001))
    await expect(page.getByRole('alert')).toContainText('50,000')
    await expect(field).toHaveValue('가'.repeat(150000) + 'a'.repeat(50000))
    await expect(page.locator('footer')).not.toContainText('/ 1000')
  })
}

test('grandfathered Free notes are not truncated and can shrink', async ({ page }) => {
  await page.goto('/e2e/fixtures/memo-policy.html?lang=ko&length=20000')
  const field = page.getByRole('textbox')
  await expect(field).toHaveValue('가'.repeat(20000))
  await paste(page, '더')
  await expect(page.getByRole('alert')).toContainText('기존 긴 노트는 보존')
  await field.fill('가'.repeat(19999))
  await expect.poll(async () => (await stored(page)).length).toBe(19999)
})

test('edits during a save are serialized, and closing waits for the latest draft', async ({ page }) => {
  await page.goto('/e2e/fixtures/memo-policy.html?lang=en&pro=1&editor=window&delay=800')
  const field = page.getByRole('textbox')
  await field.fill('first')
  await expect.poll(async () => (await snapshot(page)).active).toBe(1)
  await field.fill('latest')
  await page.getByRole('button', { name: 'Close memo' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(await stored(page)).toBe('latest')
  expect((await snapshot(page)).maxActive).toBe(1)
  expect((await snapshot(page)).calls.map(call => call.previous)).toEqual(['', 'first'])
})

test('failed save retains the draft and supports explicit retry', async ({ page }) => {
  await page.goto('/e2e/fixtures/memo-policy.html?lang=en&pro=1&fail=1')
  await page.getByRole('textbox').fill('unsaved draft')
  await expect(page.getByRole('button', { name: 'Retry save' })).toBeVisible()
  await expect(page.getByRole('textbox')).toHaveValue('unsaved draft')
  await page.getByRole('button', { name: 'Retry save' }).click()
  await expect.poll(() => stored(page)).toBe('unsaved draft')
})

for (const lang of ['ko', 'en']) {
  for (const width of [390, 1440]) {
    test(`billing ${lang} ${width}: shows limits and fair-use text without horizontal overflow`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto(`/e2e/fixtures/memo-policy.html?lang=${lang}&billing=1`)
      await expect(page.locator('.billing-up__features-list')).toContainText(lang === 'ko' ? '노트 작성 무제한' : 'Unlimited note writing')
      await expect(page.locator('.billing-up__compare')).toContainText('1,000')
      await expect(page.locator('.billing-note-policy').first()).toContainText('50,000')
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      await page.screenshot({ animations: 'disabled', path: `test-results/memo-billing-${lang}-${width}.png` })
    })
  }
}
