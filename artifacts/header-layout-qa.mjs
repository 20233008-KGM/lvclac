import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
const base = process.env.QA_BASE_URL || 'http://127.0.0.1:4186';
const browser = await chromium.launch({ headless: true });
const errors = [];
for (const lang of ['ko', 'en']) {
  for (const width of [320, 360, 390, 430, 480, 640, 700, 767, 768, 1024, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, locale: lang === 'ko' ? 'ko-KR' : 'en-US' });
    page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(() => localStorage.setItem('liqguard-privacy-preferences-v2', JSON.stringify({ analytics: false, personalizedAds: false })));
    await page.goto(`${base}/${lang === 'en' ? 'en' : ''}?lang=${lang}`);
    await page.locator('.header-welcome-btn').waitFor();
    await page.evaluate(() => document.fonts.ready);
    const rect = selector => page.locator(selector).boundingBox();
    const title = await rect('.header-left');
    const auth = await rect('.header-auth');
    const history = await rect('.calculator-history-btn');
    const welcome = await rect('.header-welcome-btn');
    const how = await rect('.header-how-btn');
    assert(title.x + title.width <= auth.x + 1, `${lang}/${width}: title overlaps account`);
    assert(Math.abs(auth.y + auth.height / 2 - title.y - title.height / 2) < 2, `${lang}/${width}: account row`);
    assert(Math.abs(history.y - welcome.y) < 1 && Math.abs(how.y - welcome.y) < 1, `${lang}/${width}: toolbar alignment`);
    assert(history.x + history.width <= welcome.x && welcome.x + welcome.width <= how.x + 1, `${lang}/${width}: toolbar overlap`);
    assert(Math.abs(history.height - welcome.height) < 1 && Math.abs(how.height - welcome.height) < 1, `${lang}/${width}: control height`);
    if (width < 768) {
      assert(history.y >= auth.y + auth.height + 10, `${lang}/${width}: second row`);
      assert(Math.abs(how.x + how.width - auth.x - auth.width) < 1, 'Toolbar right aligned');
      assert(welcome.width < 230, 'CTA bounded width');
      assert(Math.abs(welcome.x - history.x - history.width - 8) < 1, 'History gap');
      assert(Math.abs(how.x - welcome.x - welcome.width - 8) < 1, 'Help gap');
    }
    assert(how.x + how.width <= width, `${lang}/${width}: viewport overflow`);
    if ([390, 1440].includes(width)) await page.screenshot({ path: `artifacts/header-${base.startsWith('https') ? 'production' : 'local'}-${lang}-${width}.png` });
    await page.locator('.calculator-history-btn').click();
    const menu = await rect('.calculator-history-menu');
    assert(menu.x >= 0 && menu.x + menu.width <= width + 1, `${lang}/${width}: history menu overflow`);
    await page.keyboard.press('Escape');
    await page.locator('.header-how-btn').focus();
    await page.locator('.header-how-tooltip').waitFor();
    await page.locator('.header-auth button').focus();
    if (width === 390) {
      await page.locator('.header-auth button').click();
      await page.getByRole('dialog').waitFor();
      await page.keyboard.press('Escape');
      await page.locator('.header-welcome-btn').click();
      assert.equal(await page.locator('.header-welcome-btn').count(), 0);
      assert.equal(await page.evaluate(() => document.activeElement.id), 'calculator-examples-title');
    }
    console.log(`PASS ${lang} ${width}`);
    await page.close();
  }
}
assert.deepEqual(errors, []);
await browser.close();
