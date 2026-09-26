import { chromium } from 'playwright';
const base = process.argv[2] || 'http://127.0.0.1:4198';
const browser = await chromium.launch({headless:true});
const results=[];
for (const locale of ['ko','en']) {
 const prefix=locale==='en'?'/en':'';
 const expected=locale==='ko'?'계산 예제를 더 다양하게, 메모 작성을 더 편하게':'More ways to explore examples, more room to write';
 for (const width of [1280,390]) {
  const page=await browser.newPage({viewport:{width,height:900},locale:locale==='ko'?'ko-KR':'en-US'});
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+prefix+'/updates');
  const link=page.getByRole('link',{name:expected,exact:true});
  await link.waitFor();
  await page.getByRole('button',{name:locale==='ko'?'동의하지 않고 계속':'Continue without consent',exact:true}).click();
  if (!(await page.locator('body').innerText()).includes('1.2.4')) throw Error('missing version');
  await link.click();
  await page.getByRole('heading',{name:expected,exact:true}).waitFor();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth);
  if(overflow||errors.length) throw Error(JSON.stringify({overflow,errors}));
  await page.screenshot({path:`artifacts/update-1.2.4-${locale}-${width}.png`,fullPage:true});
  results.push({locale,width,url:page.url(),title:await page.title(),overflow,errors});
  await page.close();
 }
}
console.log(JSON.stringify(results,null,2));
await browser.close();

