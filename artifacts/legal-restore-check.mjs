import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
const base = process.argv[2] || 'http://127.0.0.1:5197';
const tag = base.includes('localhost') || base.includes('127.0.0.1') ? 'local' : 'production';
const browser = await chromium.launch();
const results=[];
mkdirSync('artifacts/legal-restore',{recursive:true});
for (const width of [1440,390]) {
 for (const [path,lang,count,tableCount,required] of [
 ['/terms','ko',13,1,'12. 약관 변경과 이번 개정'],
 ['/privacy','ko',14,4,'일본(도쿄 주 데이터베이스)'],
 ['/en/terms','en',13,1,'12. Changes to these terms'],
 ['/en/privacy','en',14,4,'Japan (Tokyo primary database)']]) {
  const context = await browser.newContext({viewport:{width,height:900},locale:lang==='ko'?'ko-KR':'en-US'});
  await context.addInitScript(() => localStorage.setItem('liqguard-privacy-preferences-v2', JSON.stringify({analytics:false,personalizedAds:false})));
  const page = await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto(base+path+'?lang='+lang,{waitUntil:'networkidle'});
  await page.locator('.public-legal-sections').waitFor();
  const headings=await page.locator('.public-legal-sections > section > h2').count();
  const tables=await page.locator('.public-legal-table').count();
  const text=await page.locator('.public-legal-document').innerText();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
  const correctedLink = !path.includes('privacy') || await page.locator('a[href="https://supabase.com/legal/customer-resources/subprocessor-list"]').count() === 2;
  const tableScroll = width !== 390 || await page.locator('.public-legal-table-wrap').evaluateAll(regions => regions.every(region => {
    if(region.scrollWidth <= region.clientWidth) return true;
    region.scrollLeft = region.scrollWidth;
    const scrolls = region.scrollLeft > 0;
    region.scrollLeft = 0;
    return scrolls;
  }));
  const bad= !correctedLink || !tableScroll || response.status()!==200 || headings!==count || tables!==tableCount || !text.includes(required) || overflow || errors.length;
  const result={path,width,status:response.status(),headings,tables,characters:text.length,overflow,correctedLink,tableScroll,errors,passed:!bad};results.push(result);
  await page.screenshot({path:`artifacts/legal-restore/${tag}-${lang}-${path.includes('privacy')?'privacy':'terms'}-${width}.png`,fullPage:false});
  if(path.includes('privacy')) {
   const table=page.locator('.public-legal-table-wrap').nth(1);
   await table.scrollIntoViewIfNeeded();
   await page.screenshot({path:`artifacts/legal-restore/${tag}-${lang}-data-table-${width}.png`});
  }
  await context.close();
 }
}
await browser.close();
writeFileSync(`artifacts/legal-restore/${tag}-results.json`,JSON.stringify(results,null,2));
console.log(JSON.stringify(results));
if(results.some(r=>!r.passed)) process.exit(1);
