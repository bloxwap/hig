import {chromium} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';
const {catalog}=JSON.parse(readFileSync('apps/docs/src/content.json','utf8'));
const browser=await chromium.launch({...(process.env.HIG_CHROME?{executablePath:process.env.HIG_CHROME}:{}),headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const results=[];mkdirSync('artifacts/visual',{recursive:true});
try{
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const entry of catalog){
  await page.goto((process.env.HIG_DOCS_PREVIEW_URL??'http://localhost:4174/hig/')+entry.route+'/',{waitUntil:'networkidle'});
  await page.locator('.example-frame').waitFor();
  for(const state of entry.states){
   await page.getByRole('combobox',{name:'Example state',exact:true}).selectOption(state);
   const axe=await new AxeBuilder({page}).include('.example-frame').withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
   const serious=axe.violations.filter(v=>v.impact==='critical'||v.impact==='serious').map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}));
   assert.deepEqual(serious,[],`${entry.name}/${state} accessibility`);assert.deepEqual(errors,[],`${entry.name}/${state} runtime`);
   const file=`artifacts/visual/${entry.slug}-${state}.png`;await page.locator('.example-frame').screenshot({path:file});
   results.push({name:entry.name,state,render:'passed',accessibility:'no serious/critical axe findings',capture:file,behaviorTests:'Shared family contract tests; this capture alone is not full behavioral certification'});
  }
  if(results.length%10===0)console.log(`Catalog captures: ${results.length}`);
 }
 writeFileSync('evidence/m5-visual-catalog.json',JSON.stringify({version:'0.1.0',browser:await browser.version(),viewport:[390,844],reducedMotion:true,executedStates:results.length,components:catalog.length,physicalNative:'pending; typed/runnable native examples are separate from browser captures',results},null,2)+'\n');
 console.log(`Catalog visual/axe/runtime: ${catalog.length} components, ${results.length} states passed`);
}finally{await browser.close();}
