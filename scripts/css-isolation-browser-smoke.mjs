import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';

const browser=await chromium.launch({headless:true,...(process.env.HIG_CHROME?{executablePath:process.env.HIG_CHROME}:{})});
try{
 const page=await browser.newPage();
 await page.setContent(`<!doctype html><html><body><button id="plain-button">Host button</button><table id="plain-table"><tr><th id="plain-heading">Host heading</th><td id="plain-cell">Host data</td></tr></table><label>Host range<input id="plain-range" type="range"></label><div id="plain-status" data-severity="error">Host status</div><button class="hig-button">HIG button</button><div class="hig-table-scroll"><table><tr><td>HIG cell</td></tr></table></div></body></html>`);
 await page.locator('#plain-button').focus();
 const sample=()=>page.evaluate(()=>Object.fromEntries(['plain-button','plain-table','plain-heading','plain-cell','plain-range','plain-status'].map(id=>{
  const style=getComputedStyle(document.getElementById(id));return [id,Object.fromEntries(['box-sizing','outline-style','outline-width','outline-color','outline-offset','border-collapse','width','min-height','padding','text-align','border-bottom','border-inline-start','accent-color'].map(key=>[key,style.getPropertyValue(key)]))];
 })));
 const before=await sample();
 await page.addStyleTag({content:readFileSync('packages/react/dist/styles.css','utf8')});
 assert.deepEqual(await sample(),before,'Importing HIG component CSS must not restyle host elements');
 await page.addStyleTag({content:readFileSync('packages/tokens/generated/tokens.css','utf8')});
 assert.equal(await page.locator('.hig-table-scroll td').evaluate(element=>getComputedStyle(element).padding),'12px');
 assert.equal(await page.locator('.hig-button').evaluate(element=>getComputedStyle(element).boxSizing),'border-box');
 await page.addStyleTag({content:readFileSync('packages/react/dist/base.css','utf8')});
 assert.equal(await page.locator('#plain-button').evaluate(element=>getComputedStyle(element).outlineWidth),'2px','Global focus defaults require css/base opt-in');
 writeFileSync('evidence/css-isolation.json',JSON.stringify({kind:'automated browser',issue:95,browser:browser.version(),checks:['plain table, cells, range, focus outline, box sizing, and severity unchanged by component CSS','HIG table and button keep component styles','global defaults require explicit css/base import']},null,2)+'\n');
 console.log('CSS isolation: host elements unchanged; HIG components and opt-in base verified');
}finally{await browser.close();}
