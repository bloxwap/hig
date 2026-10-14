import {chromium,firefox,webkit} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
for(const [engine,launcher] of Object.entries({chromium,firefox,webkit})){
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
  await page.getByRole('radio',{name:'Buy',exact:true}).focus();await page.keyboard.press('ArrowRight');assert.equal(await page.getByRole('radio',{name:'Sell',exact:true}).isChecked(),true);
  await page.getByRole('switch',{name:'RTL'}).check();await page.getByRole('tab',{name:'الملخص'}).focus();await page.keyboard.press('ArrowLeft');assert.equal(await page.getByRole('tab',{name:'التفاصيل'}).getAttribute('aria-selected'),'true');await page.keyboard.press('End');assert.equal(await page.getByRole('tab',{name:'التفاصيل'}).getAttribute('aria-selected'),'true');
  await page.getByRole('button',{name:'Open outer'}).click();await page.getByRole('button',{name:'Open nested'}).click();assert.equal(await page.getByRole('alertdialog').count(),1);
  await page.keyboard.press('Tab');assert.equal(await page.getByRole('alertdialog').evaluate(el=>el.contains(document.activeElement)),true);
  await page.keyboard.press('Escape');assert.equal(await page.getByRole('alertdialog').count(),0);assert.equal(await page.getByRole('button',{name:'Open nested'}).evaluate(el=>el===document.activeElement),true);
  await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog').count(),0);assert.equal(await page.getByRole('button',{name:'Open outer'}).evaluate(el=>el===document.activeElement),true);
  assert.equal(await page.getByRole('button',{name:'Retry oldest'}).count(),1);await page.getByRole('button',{name:'Retry oldest'}).click();await page.getByRole('button',{name:'Dismiss Outcome 4'}).click();assert.equal(await page.getByRole('button',{name:/Dismiss Outcome/}).count(),4);assert.equal(await page.getByRole('alert').count(),1);
  await page.getByRole('button',{name:'Actions',exact:true}).click();await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');assert.equal(await page.getByRole('menu').count(),0);
  await page.getByRole('searchbox').fill('test');await page.getByRole('button',{name:'Search result'}).click();assert.equal(await page.getByRole('searchbox').inputValue(),'');
  assert.equal(await page.locator('[aria-current="page"]').count(),1);
  await page.evaluate(()=>{document.documentElement.style.fontSize='200%';});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();assert.deepEqual(axe.violations,[]);assert.deepEqual(errors,[]);
  await page.screenshot({path:`evidence/issue-1-18/${engine}-expanded-rtl.png`,fullPage:true});
  writeFileSync(`evidence/issue-1-18/${engine}-acceptance.json`,JSON.stringify({browser:await browser.version(),viewport:320,textScale:'200% root font size',checks:['required validation','pointer cancellation and reduced-motion press transform','synthetic composition and negative locale raw precision','range Home/End/step','radio keyboard','RTL translated tabs and disabled skip','nested modal Tab/Escape and focus restoration','notification burst/dismiss/retry','menu keyboard','search recovery','current location','no overflow','zero axe WCAG violations','no runtime errors'],limits:'Synthetic composition does not certify real OS IME; browser text scaling is not native Dynamic Type; no physical assistive technology observation',violations:[]},null,2)+'\n');
 }finally{await browser.close();}
}
