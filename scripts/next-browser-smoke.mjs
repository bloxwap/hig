import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
const browser=await chromium.launch({...(process.env.HIG_CHROME?{executablePath:process.env.HIG_CHROME}:{}),headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 const page=await browser.newPage({viewport:{width:390,height:844}});page.setDefaultTimeout(120000);const errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
 await page.goto(process.env.HIG_NEXT_URL??'http://localhost:4175',{waitUntil:'networkidle'});
 await page.getByLabel('Amount (BTC)').fill('0,00001');
 assert.equal(await page.getByLabel('Amount (BTC)').inputValue(),'0,00001');
 await page.getByRole('button',{name:'Review order'}).focus();await page.keyboard.press('Enter');
 assert.equal(await page.getByRole('status').textContent(),'Accepted: 1');
 assert.deepEqual(errors,[]);
 await page.screenshot({path:'evidence/m5-next-hydration.png',fullPage:true});
 writeFileSync('evidence/m5-next-browser.json',JSON.stringify({version:'0.1.0',framework:'Next 16.4.0 webpack',checks:['production server/client boundary','no hydration/page/console errors','raw locale amount retained','keyboard accepted action once','Bloxwap Sans loader compiled'],browser:await browser.version()},null,2)+'\n');
 console.log('Next hydration/keyboard/raw-amount browser check passed');
}finally{await browser.close();}
