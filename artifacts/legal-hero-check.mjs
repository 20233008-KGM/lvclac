import {chromium} from '@playwright/test';
import {writeFileSync} from 'node:fs';
const base=process.argv[2]||'http://127.0.0.1:5198';
const b=await chromium.launch();const rows=[];
for(const width of [1440,390])for(const path of ['/privacy','/terms','/about','/guide','/formulas'])for(const lang of ['ko','en']){
 const p=await b.newPage({viewport:{width,height:900},locale:lang==='ko'?'ko-KR':'en-US'});
 await p.addInitScript(()=>localStorage.setItem('liqguard-privacy-preferences-v2',JSON.stringify({analytics:false,personalizedAds:false})));
 const response=await p.goto(base+(lang==='en'?'/en':'')+path+'?lang='+lang,{waitUntil:'domcontentloaded'});
 await p.locator('.public-info-hero').waitFor();
 const layout=await p.locator('.public-info-hero').evaluate(el=>{const r=el.getBoundingClientRect();const s=getComputedStyle(el);const lead=el.querySelector('.public-info-lead')||el.querySelector('h1');const end=lead.getBoundingClientRect();return{height:r.height,minHeight:s.minHeight,padding:s.paddingBottom,bottomSpace:r.bottom-end.bottom,overflow:document.documentElement.scrollWidth>innerWidth+1,contained:end.bottom<=r.bottom+1}});
 rows.push({width,path,lang,status:response.status(),...layout});await p.close();
}
await b.close();
const ok=rows.every(r=>r.status===200&&!r.overflow&&r.contained&&r.minHeight===(r.width===1440?'264px':'280px'));
writeFileSync('artifacts/legal-hero-'+(base.includes('127.0.0.1')?'local':'production')+'.json',JSON.stringify(rows,null,2));
console.log(JSON.stringify({ok,count:rows.length,privacy:rows.filter(r=>r.path==='/privacy')}));if(!ok)process.exit(1);
