import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {assertLoadedFace} from './font-check.mjs';
const stage=process.argv[2]==='packed'?'packed':'m5';
const browser=await chromium.launch({...(process.env.HIG_CHROME?{executablePath:process.env.HIG_CHROME}:{}),headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 const page=await browser.newPage({viewport:{width:390,height:844}});page.setDefaultTimeout(120000);const errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
 await page.goto(process.env.HIG_NEXT_URL??'http://localhost:4175',{waitUntil:'networkidle'});
 await page.getByLabel('Amount (BTC)').fill('0,00001');
 assert.equal(await page.getByLabel('Amount (BTC)').inputValue(),'0,00001');
 await page.getByRole('button',{name:'Review order'}).focus();await page.keyboard.press('Enter');
 assert.equal(await page.getByRole('status').textContent(),'Accepted: 1');
 const fonts={button:await assertLoadedFace(page,'.hig-button',/Bloxwap_?\s?Sans/i),number:await assertLoadedFace(page,'.hig-number',/Bloxwap_?\s?Mono/i)};
 assert.deepEqual(errors,[]);
 await page.screenshot({path:`evidence/${stage}-next-hydration.png`,fullPage:true});
 writeFileSync(`evidence/${stage}-next-browser.json`,JSON.stringify({version:'0.1.0',framework:'Next 16.4.0 webpack',consumer:stage==='packed'?'packed tarballs in a clean temporary app':'workspace fixture',checks:['production server/client boundary','no hydration/page/console errors','raw locale amount retained','keyboard accepted action once','Bloxwap Sans/Mono Next loaders compiled','.hig-button/.hig-number computed font is a loaded Bloxwap face (document.fonts.check + FontFace status)'],fonts:Object.fromEntries(Object.entries(fonts).map(([k,v])=>[k,{fontFamily:v.fontFamily,check:v.check,loaded:v.loaded}])),browser:await browser.version()},null,2)+'\n');
 console.log(`Next (${stage}) hydration/keyboard/raw-amount/font browser check passed`);
}finally{await browser.close();}
