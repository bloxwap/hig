import {chromium} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {dirname} from 'node:path';
import assert from 'node:assert/strict';
import {compareVisual} from './visual-diff.mjs';
import {visualBaselinePath} from './visual-baseline.mjs';
const {catalog}=JSON.parse(readFileSync('apps/docs/src/content.json','utf8'));
const browser=await chromium.launch({...(process.env.HIG_CHROME?{executablePath:process.env.HIG_CHROME}:{}),headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const results=[];const visualFailures=[];mkdirSync('artifacts/visual',{recursive:true});
const baselineNames=new Set(['Button','Field','Input']);
// Keyboard-focused captures at both densities (#69): the Slider ring must stay inside its own box.
const focusBaselineNames=new Set(['Slider']);
function checkBaseline(slug,file){const baseline=visualBaselinePath(slug);mkdirSync(dirname(baseline),{recursive:true});if(process.env.HIG_UPDATE_VISUALS==='1'){writeFileSync(baseline,readFileSync(file));return {updated:true,baseline};}if(!existsSync(baseline)){const message=`missing visual baseline ${baseline} for ${process.platform}; review the CI capture ${file} before committing it (HIG_UPDATE_VISUALS=1). Do not reuse another OS baseline or loosen the 2%/24-channel thresholds`;visualFailures.push(`${slug}: ${message}`);return {failed:true,message};}try{return compareVisual(readFileSync(file),readFileSync(baseline));}catch(error){mkdirSync('evidence/visual-actuals',{recursive:true});writeFileSync(`evidence/visual-actuals/${slug}.png`,readFileSync(file));writeFileSync(`evidence/visual-actuals/${slug}.txt`,String(error?.message??error));visualFailures.push(`${slug}: ${error?.message??error}`);return {failed:true,message:String(error?.message??error)};}}
try{
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});const page=await context.newPage();page.setDefaultTimeout(120000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const entries=process.env.HIG_VISUAL_ONLY==='1'?catalog.filter(e=>baselineNames.has(e.name)||focusBaselineNames.has(e.name)):catalog;
 for(const entry of entries){
  await page.goto((process.env.HIG_DOCS_PREVIEW_URL??'http://localhost:4174/hig/')+'docs/'+entry.route+'/',{waitUntil:'networkidle'});
  await page.evaluate(()=>document.fonts.ready);
  await page.locator('.example-frame').waitFor();
  for(const state of entry.states){
   await page.getByRole('combobox',{name:'Example state',exact:true}).selectOption(state);
   const axe=await new AxeBuilder({page}).include('.example-frame').withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
   const serious=axe.violations.filter(v=>v.impact==='critical'||v.impact==='serious').map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}));
   assert.deepEqual(axe.violations,[],`${entry.name}/${state} accessibility`);assert.deepEqual(errors,[],`${entry.name}/${state} runtime`);
   const file=`artifacts/visual/${entry.slug}-${state}.png`;await page.locator('.example-frame').screenshot({path:file,animations:'disabled',caret:'hide'});
   let regression=null;
   if(baselineNames.has(entry.name))regression=checkBaseline(`${entry.slug}-${state}`,file);
   results.push({name:entry.name,state,regression,render:'passed',accessibility:'no serious/critical axe findings',capture:file,behaviorTests:'Shared family contract tests; this capture alone is not full behavioral certification'});
  }
  if(focusBaselineNames.has(entry.name)){
   await page.getByRole('combobox',{name:'Example state',exact:true}).selectOption('default');
   const canvas=page.locator('.example-frame .example-canvas'),control=canvas.getByRole('slider');
   for(const density of ['comfortable','compact']){
    await page.evaluate(d=>{for(const el of document.querySelectorAll('[data-hig-density]'))el.setAttribute('data-hig-density',d);},density);
    await page.locator('.example-frame [role="tabpanel"]:not([hidden]):has(> .example-canvas)').focus();await page.keyboard.press('Tab');
    assert.equal(await control.evaluate(el=>el===document.activeElement&&el.matches(':focus-visible')),true,`${entry.name} keyboard focus (${density})`);
    const state=`focus-${density}`,file=`artifacts/visual/${entry.slug}-${state}.png`;await page.locator('.example-frame').screenshot({path:file,animations:'disabled',caret:'hide'});
    results.push({name:entry.name,state,regression:checkBaseline(`${entry.slug}-${state}`,file),render:'passed',capture:file,behaviorTests:'Keyboard focus ring geometry is asserted in scripts/acceptance-browser-smoke.mjs'});
   }
   await page.evaluate(()=>{for(const el of document.querySelectorAll('[data-hig-density]'))el.setAttribute('data-hig-density','comfortable');});
  }
  console.log(`Catalog ${entry.name}: ${entry.states.length} states; ${results.length} captures passed`);
 }
 if(visualFailures.length){mkdirSync('evidence/visual-actuals',{recursive:true});writeFileSync('evidence/visual-actuals/summary.txt',visualFailures.join('\n')+'\n');throw Error(`Visual pixel regression in ${visualFailures.length} baseline state(s):\n${visualFailures.join('\n')}`);}
 writeFileSync(process.env.HIG_VISUAL_ONLY==='1'?'evidence/gaps-b-visual-baselines.json':'evidence/m5-visual-catalog.json',JSON.stringify({version:'0.1.0',browser:await browser.version(),viewport:[390,844],reducedMotion:true,executedStates:results.length,components:entries.length,availableComponents:catalog.length,scope:process.env.HIG_VISUAL_ONLY==='1'?'representative baseline subset':'full shipped state matrix',physicalNative:'pending; typed/runnable native examples are separate from browser captures',results},null,2)+'\n');
 console.log(`Catalog visual/axe/runtime: ${entries.length} components, ${results.length} states passed`);
}finally{await browser.close();}
