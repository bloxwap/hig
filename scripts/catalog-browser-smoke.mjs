import {chromium} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import assert from 'node:assert/strict';
import {compareVisual} from './visual-diff.mjs';
const {catalog}=JSON.parse(readFileSync('apps/docs/src/content.json','utf8'));
const browser=await chromium.launch({...(process.env.HIG_CHROME?{executablePath:process.env.HIG_CHROME}:{}),headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const results=[];mkdirSync('artifacts/visual',{recursive:true});
const baselineNames=new Set(['Button','Field','Input']);
mkdirSync('tests/visual-baselines',{recursive:true});
try{
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});const page=await context.newPage();page.setDefaultTimeout(120000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const entries=process.env.HIG_VISUAL_ONLY==='1'?catalog.filter(e=>baselineNames.has(e.name)):catalog;
 for(const entry of entries){
  await page.goto((process.env.HIG_DOCS_PREVIEW_URL??'http://localhost:4174/hig/')+'docs/'+entry.route+'/',{waitUntil:'networkidle'});
  await page.locator('.example-frame').waitFor();
  for(const state of entry.states){
   await page.getByRole('combobox',{name:'Example state',exact:true}).selectOption(state);
   const axe=await new AxeBuilder({page}).include('.example-frame').withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
   const serious=axe.violations.filter(v=>v.impact==='critical'||v.impact==='serious').map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}));
   assert.deepEqual(axe.violations,[],`${entry.name}/${state} accessibility`);assert.deepEqual(errors,[],`${entry.name}/${state} runtime`);
   const file=`artifacts/visual/${entry.slug}-${state}.png`;await page.locator('.example-frame').screenshot({path:file,animations:'disabled',caret:'hide'});
   let regression=null;
   if(baselineNames.has(entry.name)){const baseline=`tests/visual-baselines/${entry.slug}-${state}.png`;if(process.env.HIG_UPDATE_VISUALS==='1'){writeFileSync(baseline,readFileSync(file));regression={updated:true};}else{assert.equal(existsSync(baseline),true,`Missing visual baseline: ${baseline}`);regression=compareVisual(readFileSync(file),readFileSync(baseline));}}
   results.push({name:entry.name,state,regression,render:'passed',accessibility:'no serious/critical axe findings',capture:file,behaviorTests:'Shared family contract tests; this capture alone is not full behavioral certification'});
  }
  console.log(`Catalog ${entry.name}: ${entry.states.length} states; ${results.length} captures passed`);
 }
 writeFileSync(process.env.HIG_VISUAL_ONLY==='1'?'evidence/gaps-b-visual-baselines.json':'evidence/m5-visual-catalog.json',JSON.stringify({version:'0.1.0',browser:await browser.version(),viewport:[390,844],reducedMotion:true,executedStates:results.length,components:entries.length,availableComponents:catalog.length,scope:process.env.HIG_VISUAL_ONLY==='1'?'representative baseline subset':'full shipped state matrix',physicalNative:'pending; typed/runnable native examples are separate from browser captures',results},null,2)+'\n');
 console.log(`Catalog visual/axe/runtime: ${entries.length} components, ${results.length} states passed`);
}finally{await browser.close();}
