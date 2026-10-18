import {launchPlaywright} from './playwright-launch.mjs';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
const results=[];
for(const engine of ['chromium','firefox','webkit']){
 const browser=await launchPlaywright(engine);
 try{
  const page=await browser.newPage({reducedMotion:'reduce'});const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto((process.env.HIG_PREVIEW_URL??'http://localhost:4173')+'/?simulateFeedback=1');
  const reset=()=>page.evaluate(()=>{window.higSimulation.requests.length=0;});
  const requests=()=>page.evaluate(()=>window.higSimulation.requests);
  await page.getByRole('switch',{name:'Sound',exact:true}).check();await page.getByRole('switch',{name:'Haptics',exact:true}).check();await reset();
  await page.getByRole('button',{name:'Review order',exact:true}).click();
  assert.equal(await page.getByRole('dialog').count(),1);assert.deepEqual((await requests()).map(r=>r.channel),['sound','haptics']);
  await page.keyboard.press('Escape');await reset();await page.waitForTimeout(100);
  await page.getByRole('button',{name:'Review order',exact:true}).focus();await page.keyboard.press('Enter');
  assert.equal(await page.getByRole('dialog').count(),1);assert.deepEqual((await requests()).map(r=>r.channel),['sound','haptics']);
  await reset();await page.getByRole('button',{name:'Confirm order',exact:true}).click();
  const outcomes=(await requests()).filter(r=>r.intent==='success');assert.deepEqual(outcomes.map(r=>r.channel),['sound','haptics']);
  await page.keyboard.press('Escape');await reset();
  await page.getByRole('button',{name:'Unavailable example',exact:true}).dispatchEvent('click');await page.getByRole('button',{name:'Busy example',exact:false}).dispatchEvent('click');assert.deepEqual(await requests(),[]);
  await page.getByRole('switch',{name:'Preview selection',exact:true}).check();assert.deepEqual((await requests()).map(r=>r.channel),['sound','haptics']);await reset();
  await page.getByRole('slider',{name:/^Preview selection range:/}).focus();await page.keyboard.press('ArrowRight');assert.deepEqual((await requests()).map(r=>r.channel),['sound','haptics']);await reset();
  await page.getByRole('button',{name:'Selection menu',exact:true}).click();assert.deepEqual(await requests(),[]);
  await page.getByRole('menuitem',{name:'Select sample',exact:true}).click();assert.deepEqual((await requests()).map(r=>r.channel),['sound','haptics']);await reset();
  await page.getByRole('button',{name:'Selection menu',exact:true}).click();await page.getByRole('menuitem',{name:'Cancel sample',exact:true}).click();assert.deepEqual(await requests(),[]);await page.keyboard.press('Escape');
  await page.getByRole('switch',{name:'Sound',exact:true}).uncheck();await page.getByRole('switch',{name:'Haptics',exact:true}).uncheck();await page.reload();
  assert.equal(await page.getByRole('switch',{name:'Sound',exact:true}).isChecked(),false);assert.equal(await page.getByRole('switch',{name:'Haptics',exact:true}).isChecked(),false);
  await page.getByRole('button',{name:'Review order',exact:true}).click();assert.equal(await page.getByRole('dialog').count(),1);assert.deepEqual(await requests(),[]);assert.deepEqual(errors,[]);
  results.push({engine,version:browser.version(),checks:['pointer and Enter: one activation request per enabled channel','outcome distinct from activation','disabled/busy dispatched clicks silent','switch/range/menu selections dispatch one request per enabled channel','menu disclosure and canceled selection are silent','persisted mute survives reload and preserves action'],adapter:'simulated host sound/haptic dispatch; no physical audio or tactile observations'});
 }finally{await browser.close();}
}
writeFileSync('evidence/gaps-b-feedback-browsers.json',JSON.stringify({results},null,2)+'\n');console.log('Simulated feedback interactions passed in all three headless engines');
