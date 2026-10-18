import {launchPlaywright} from './playwright-launch.mjs';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
const browser=await launchPlaywright('chromium');
try{
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${process.env.HIG_EXPO_PORT??4176}/`,{waitUntil:'networkidle'});
 await page.getByText('Native HIG gallery',{exact:true}).waitFor();
 assert.equal(await page.evaluate(()=>document.fonts.check('16px BloxwapSansRegular')),true);
 assert.equal(await page.evaluate(()=>document.fonts.check('16px BloxwapSansSemiBold')),true);
 const component=page.getByRole('button',{name:/Component.*Button/});
 await component.click();
 await page.getByRole('radio',{name:'Input',exact:true}).click();
 const amount=page.getByRole('textbox',{name:'Amount (BTC)',exact:true});
 await amount.fill('-0,000001');assert.equal(await amount.inputValue(),'-0,000001');
 assert.equal(await page.getByRole('switch',{name:'Sound',exact:true}).isChecked(),false);
 await page.getByRole('switch',{name:'Sound',exact:true}).check();await page.getByRole('switch',{name:'Sound',exact:true}).uncheck();
 const slider=page.getByRole('slider',{name:'Volume'});await slider.focus();await slider.press('End');assert.equal(await slider.getAttribute('aria-valuenow'),'100');await slider.press('Home');assert.equal(await slider.getAttribute('aria-valuenow'),'0');
 const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
 const violations=axe.violations.map(v=>({id:v.id,impact:v.impact,targets:v.nodes.map(n=>n.target)}));
 writeFileSync('evidence/issue-1-18/expo-web-browser.json',JSON.stringify({browser:await browser.version(),renderer:'Expo 54 / react-native-web; not Android or iOS',checks:['registered Sans Regular/SemiBold loaded','native Modal picker selection','raw locale decimal precision','labeled form input','sound disabled operation and preference updates','axe WCAG analysis','no runtime errors'],violations,errors,limits:'RN web semantics do not certify Android accessibility nodes, TalkBack, VoiceOver, native IME or Dynamic Type'},null,2)+'\n');
 assert.deepEqual(violations,[]);assert.deepEqual(errors,[]);
 await page.screenshot({path:'evidence/issue-1-18/expo-web.png',fullPage:true});
}finally{await browser.close();}
