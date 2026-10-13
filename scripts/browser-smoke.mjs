import {chromium,firefox,webkit} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const stage=process.argv[2]??'m2';
const engine=process.env.HIG_BROWSER??'chromium';const launcher={chromium,firefox,webkit}[engine];if(!launcher)throw Error('Unsupported browser');
const browser=await launcher.launch({...(engine==='chromium'&&process.env.HIG_CHROME?{executablePath:process.env.HIG_CHROME}:{}),headless:true,args:engine==='chromium'?['--no-sandbox','--disable-dev-shm-usage']:[]});
const label=stage==='m5'?`${stage}-${engine}`:stage;
try{
const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
const page=await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(process.env.HIG_PREVIEW_URL??'http://localhost:4173',{waitUntil:'networkidle'});
await page.getByRole('button',{name:'Review order',exact:true}).click();
assert.equal(await page.getByRole('dialog').count(),1);
await page.keyboard.press('Escape');
assert.equal(await page.getByRole('dialog').count(),0);
await page.getByRole('tab',{name:'Preview',exact:true}).focus();
await page.keyboard.press('ArrowRight');
assert.equal(await page.getByRole('tab',{name:'Code',exact:true}).getAttribute('aria-selected'),'true');
assert.equal(await page.getByRole('button',{name:'Unavailable example',exact:true}).isDisabled(),true);
assert.equal(await page.getByRole('button',{name:'Busy example',exact:false}).isDisabled(),true);
if(stage==='m3'||stage==='m5'){
 assert.equal(await page.evaluate(()=>performance.getEntriesByType('resource').some(r=>r.name.includes('bloxwap_sfx'))),false);
 await page.getByRole('switch',{name:'Sound',exact:true}).check();
 await page.getByRole('button',{name:'Review order',exact:true}).click();
 await page.keyboard.press('Escape');
 await page.waitForTimeout(300);
 assert.equal(await page.getByRole('switch',{name:'Sound',exact:true}).isChecked(),true);
 await page.reload({waitUntil:'networkidle'});
 await page.getByRole('switch',{name:'Sound',exact:true}).waitFor();
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('bloxwap.hig.feedback.v1')??'{}').sound===true);
 assert.equal(await page.getByRole('switch',{name:'Sound',exact:true}).isChecked(),true);
 await page.getByRole('switch',{name:'Sound',exact:true}).uncheck();
}
const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
const violations=axe.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)}));
assert.deepEqual(violations.filter(v=>v.impact==='serious'||v.impact==='critical'),[]);
assert.deepEqual(errors,[]);
assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
await page.getByRole('tab',{name:'Preview',exact:true}).click();
await page.screenshot({path:`evidence/${label}-web-mobile.png`,fullPage:true});
await page.setViewportSize({width:1440,height:1000});
await page.getByLabel('Pro',{exact:true}).check();
await page.screenshot({path:`evidence/${label}-web-pro.png`,fullPage:true});
writeFileSync(`evidence/${label}-browser.json`,JSON.stringify({version:'0.1.0',browser:await browser.version(),platform:'Linux Chrome automated; no physical-device claim',viewport:[390,844],checks:['no page errors','modal Escape','keyboard tabs','no horizontal viewport overflow','axe AA serious/critical check'],violations},null,2)+'\n');
console.log(`Browser ${stage}: interaction/accessibility/screenshots passed`);

}finally{await browser.close();}
