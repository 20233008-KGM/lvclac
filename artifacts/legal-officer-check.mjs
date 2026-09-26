import {chromium} from '@playwright/test';
import {writeFileSync} from 'node:fs';
const browser=await chromium.launch();
const result=[];
for(const [path,lang,name] of [['/terms','ko','김규민'],['/privacy','ko','김규민'],['/en/terms','en','Gyumin Kim'],['/en/privacy','en','Gyumin Kim']]) {
 const context=await browser.newContext({locale:lang==='ko'?'ko-KR':'en-US'});
 await context.addInitScript(()=>localStorage.setItem('liqguard-privacy-preferences-v2',JSON.stringify({analytics:false,personalizedAds:false})));
 const page=await context.newPage();
 const response=await page.goto('https://liqguard.com'+path+'?lang='+lang,{waitUntil:'domcontentloaded'});
 await page.locator('.public-legal-table').first().waitFor();
 const table=await page.locator('.public-legal-table').first().innerText();
 const text=await page.locator('.public-legal-document').innerText();
 const expected=lang==='ko'?'개인정보 보호책임자는 대표자 김규민입니다.':'Our representative, Gyumin Kim, is the privacy officer.';
 const noOfficerRow=!table.includes(lang==='ko'?'개인정보 보호책임자':'Privacy officer');
 const representative=table.includes(lang==='ko'?'대표자':'Representative')&&table.includes(name);
 const disclosure=!path.includes('privacy') || text.includes(expected);
 result.push({path,status:response.status(),noOfficerRow,representative,disclosure});
 await context.close();
}
await browser.close();
writeFileSync('artifacts/legal-officer-production.json',JSON.stringify(result,null,2));
console.log(JSON.stringify(result));
if(result.some(r=>r.status!==200||!r.noOfficerRow||!r.representative||!r.disclosure))process.exit(1);
