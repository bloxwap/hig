import {chromium,firefox,webkit,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import {writeFileSync,mkdirSync} from 'node:fs';
import {PNG} from 'pngjs';
import {execFileSync} from 'node:child_process';
const source={sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceTreeDirty:!!execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim(),observedAt:new Date().toISOString().slice(0,10)};
/** Pixels that differ between two screenshots of the same region. */
function changedPixels(a,b){const x=PNG.sync.read(a),y=PNG.sync.read(b);if(x.width!==y.width||x.height!==y.height)return Infinity;let n=0;for(let i=0;i<x.data.length;i+=4)if(x.data[i]!==y.data[i]||x.data[i+1]!==y.data[i+1]||x.data[i+2]!==y.data[i+2])n++;return n;}
/** #69: the keyboard focus ring must be visible on the slider yet leave its label and the next control untouched, at both densities. */
async function assertSliderRingClear(page,engine){
 const slider=page.getByRole('slider'),label=page.locator('.hig-slider > label'),next=page.locator('.hig-slider + *');
 // The slider region is padded so an outset ring counts as visible; label and next-control regions are their exact boxes.
 const region=async(locator,pad=0)=>{const r=await locator.evaluate((el,pad)=>{const b=el.getBoundingClientRect();return {x:Math.max(0,b.x+scrollX-pad),y:Math.max(0,b.y+scrollY-pad),width:b.width+pad*2,height:b.height+pad*2};},pad);return page.screenshot({clip:r,fullPage:true});};
 for(const density of ['comfortable','compact']){
  await page.evaluate(d=>{for(const el of document.querySelectorAll('[data-hig-density]'))el.setAttribute('data-hig-density',d);},density);
  await slider.evaluate(el=>el.blur());
  const rest={label:await region(label),next:await region(next),slider:await region(slider,8)};
  await page.getByRole('button',{name:'Submit amount'}).focus();await page.keyboard.press('Tab');
  assert.equal(await slider.evaluate(el=>el===document.activeElement&&el.matches(':focus-visible')),true,`${engine}/${density} slider keyboard focus`);
  assert.ok(changedPixels(await region(slider,8),rest.slider)>0,`${engine}/${density} focus ring is visible`);
  assert.equal(changedPixels(await region(label),rest.label),0,`${engine}/${density} focus ring overlaps the slider label`);
  assert.equal(changedPixels(await region(next),rest.next),0,`${engine}/${density} focus ring overlaps the next control`);
  await page.screenshot({path:`evidence/issue-69/${engine}-slider-focus-${density}.png`,clip:await page.locator('.hig-slider').evaluate(el=>{const r=el.getBoundingClientRect();return {x:Math.max(0,r.x-16),y:Math.max(0,r.y+scrollY-16),width:r.width+32,height:r.height+32};}),fullPage:true});
 }
 await page.evaluate(()=>{for(const el of document.querySelectorAll('[data-hig-density]'))el.setAttribute('data-hig-density','comfortable');});
}
const browsers={chromium,firefox,webkit};
if(process.env.HIG_BROWSER)assert(process.env.HIG_BROWSER in browsers,'HIG_BROWSER must be chromium, firefox or webkit');
for(const [engine,launcher] of Object.entries(browsers).filter(([engine])=>!process.env.HIG_BROWSER||process.env.HIG_BROWSER===engine)){
 const browser=await launcher.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:320,height:900},reducedMotion:'reduce'});const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto((process.env.HIG_PREVIEW_URL??'http://localhost:4173')+'/acceptance.html',{waitUntil:'networkidle'});
  await page.getByRole('button',{name:'Submit amount'}).click();
  assert.match(await page.getByRole('status').first().textContent(),/Submitted 0/);
  const submit=page.getByRole('button',{name:'Submit amount'});const box=await submit.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();assert.equal(await submit.evaluate(el=>getComputedStyle(el).transform),'none');await page.mouse.move(1,1);await page.mouse.up();assert.match(await page.getByRole('status').first().textContent(),/Submitted 0/);
  const input=page.getByRole('textbox',{name:'Amount'});
  await input.evaluate(el=>{el.dispatchEvent(new CompositionEvent('compositionstart',{data:''}));});
  await input.fill('-0,000000000000000001');
  await input.evaluate(el=>el.dispatchEvent(new CompositionEvent('compositionend',{data:'-0,000000000000000001'})));
  await input.press('Enter');assert.match(await page.getByRole('status').first().textContent(),/Submitted 1: -0,000000000000000001/);
  await page.getByRole('slider').focus();await page.keyboard.press('End');assert.equal(await page.getByRole('slider').inputValue(),'100');await page.keyboard.press('Home');await page.keyboard.press('ArrowRight');assert.equal(await page.getByRole('slider').inputValue(),'5');
  mkdirSync('evidence/issue-69',{recursive:true});await assertSliderRingClear(page,engine);
  await page.getByRole('radio',{name:'Buy',exact:true}).focus();await page.keyboard.press('ArrowRight');assert.equal(await page.getByRole('radio',{name:'Sell',exact:true}).isChecked(),true);
  await page.getByRole('switch',{name:'RTL'}).check();await page.getByRole('tab',{name:'الملخص'}).focus();await page.keyboard.press('ArrowLeft');assert.equal(await page.getByRole('tab',{name:'التفاصيل'}).getAttribute('aria-selected'),'true');await page.keyboard.press('End');assert.equal(await page.getByRole('tab',{name:'التفاصيل'}).getAttribute('aria-selected'),'true');
  await page.getByRole('button',{name:'Open outer'}).click();await page.getByRole('button',{name:'Open nested'}).click();assert.equal(await page.getByRole('alertdialog').count(),1);
  await page.keyboard.press('Tab');assert.equal(await page.getByRole('alertdialog').evaluate(el=>el.contains(document.activeElement)),true);
  await page.keyboard.press('Escape');assert.equal(await page.getByRole('alertdialog').count(),0);await expect(page.getByRole('button',{name:'Open nested'})).toBeFocused();
  await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog').count(),0);await expect(page.getByRole('button',{name:'Open outer'})).toBeFocused();
  assert.equal(await page.getByRole('button',{name:'Retry oldest'}).count(),1);await page.getByRole('button',{name:'Retry oldest'}).click();await page.getByRole('button',{name:'Dismiss Outcome 4'}).click();assert.equal(await page.getByRole('button',{name:/Dismiss Outcome/}).count(),4);assert.equal(await page.getByRole('alert').count(),1);
  await page.getByRole('button',{name:'Actions',exact:true}).click();await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');assert.equal(await page.getByRole('menu').count(),0);
  await page.getByRole('searchbox').fill('test');await page.getByRole('button',{name:'Search result'}).click();assert.equal(await page.getByRole('searchbox').inputValue(),'');
  assert.equal(await page.locator('[aria-current="page"]').count(),1);
  await page.evaluate(()=>{document.documentElement.style.fontSize='200%';});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();assert.deepEqual(axe.violations,[]);assert.deepEqual(errors,[]);
  await page.screenshot({path:`evidence/issue-1-18/${engine}-expanded-rtl.png`,fullPage:true});
  writeFileSync(`evidence/issue-1-18/${engine}-acceptance.json`,JSON.stringify({...source,browser:await browser.version(),viewport:320,textScale:'200% root font size',checks:['required validation','pointer cancellation and reduced-motion press transform','synthetic composition and negative locale raw precision','range Home/End/step','slider focus ring clear of label and next control at comfortable and compact density (#69)','radio keyboard','RTL translated tabs and disabled skip','nested modal Tab/Escape and focus restoration','notification burst/dismiss/retry','menu keyboard','search recovery','current location','no overflow','zero axe WCAG violations','no runtime errors'],limits:'Synthetic composition does not certify real OS IME; browser text scaling is not native Dynamic Type; no physical assistive technology observation',violations:[]},null,2)+'\n');
  console.log(`Acceptance ${engine}: keyboard, focus-ring geometry, 200% text and axe checks passed`);
 }finally{await browser.close();}
}
