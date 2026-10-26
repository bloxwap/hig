import assert from 'node:assert/strict';
import {readFileSync,mkdirSync} from 'node:fs';
import {build} from 'esbuild';
import {chromium,webkit} from '@playwright/test';
import {launchBrowser} from './browser-launcher.mjs';

const css=readFileSync('packages/tokens/generated/tokens.css','utf8')+readFileSync('packages/react/src/styles.css','utf8');
const source=`import React,{useState} from 'react';import {createRoot} from 'react-dom/client';
import {HIGProvider} from './packages/react/src/provider';import {Select} from './packages/react/src/select';import {Dialog} from './packages/react/src/dialog';
const options=[{value:'buy',label:'Buy'},{value:'disabled',label:'Unavailable',disabled:true},{value:'sell',label:'Sell'}];
function Example(){const [value,setValue]=useState('buy'),[open,setOpen]=useState(false);return <HIGProvider direction={window.direction}>
<div className='clip'><Select label='Side' options={options} value={value} onValueChange={setValue}/></div>
<button onClick={()=>setOpen(true)}>Open dialog</button><Select label='Disabled side' options={options} disabled/>
<Dialog open={open} onOpenChange={setOpen} title='Order'><Select label='Dialog side' options={options} defaultValue='buy'/></Dialog>
</HIGProvider>;};createRoot(document.getElementById('root')).render(<Example/>);`;
const bundle=await build({stdin:{contents:source,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,format:'iife',platform:'browser',define:{'process.env.NODE_ENV':'"production"'}});
const output='.validation-tmp/select';mkdirSync(output,{recursive:true});
for(const [engine,type] of Object.entries({chromium,webkit})){
 const browser=await launchBrowser(type,{headless:true});
 try{for(const width of [390,1280])for(const direction of ['ltr','rtl']){
  const context=await browser.newContext({viewport:{width,height:600}});
  try{
   const page=await context.newPage(),errors=[];page.setDefaultTimeout(10000);page.on('pageerror',error=>errors.push(error.message));
   await page.setContent(`<!doctype html><html lang='en' dir='${direction}'><head><style>${css}body{margin:24px;background:var(--hig-background);color:var(--hig-text);font:16px/1.5 system-ui}#root{max-width:480px;margin:auto}.clip{height:100px;overflow:hidden}button{font:inherit}</style></head><body><main id='root'></main></body></html>`);
   await page.evaluate(direction=>window.direction=direction,direction);await page.addScriptTag({content:bundle.outputFiles[0].text});
   const side=page.getByRole('combobox',{name:'Side',exact:true});await side.click();
   const list=page.getByRole('listbox',{name:'Side',exact:true});await list.waitFor();
   assert.equal(await list.evaluate(element=>element.matches(':popover-open')),true);
   const geometry=await page.evaluate(()=>{const popup=document.querySelector('.hig-select-list'),r=popup.getBoundingClientRect(),clip=document.querySelector('.clip').getBoundingClientRect();return {right:r.right,left:r.left,bottom:r.bottom,clipBottom:clip.bottom,visible:popup.contains(document.elementFromPoint(r.left+20,r.bottom-15))};});
   assert.ok(geometry.bottom>geometry.clipBottom);assert.ok(geometry.visible,'top layer must escape the clipping parent');assert.ok(geometry.left>=8&&geometry.right<=width-8);
   await page.getByRole('option',{name:'Unavailable'}).dispatchEvent('click');assert.equal(await side.textContent(),'Buy');
   await page.keyboard.press('ArrowDown');assert.equal(await side.getAttribute('aria-activedescendant'),await page.getByRole('option',{name:'Sell',exact:true}).getAttribute('id'));
   await page.screenshot({path:`${output}/${engine}-${width}-${direction}.png`});
   await page.keyboard.press('Enter');assert.equal(await side.textContent(),'Sell');assert.equal(await side.evaluate(element=>element===document.activeElement),true);
   await side.click();await page.keyboard.press('Escape');assert.equal(await page.getByRole('listbox').count(),0);
   assert.equal(await page.getByRole('combobox',{name:'Disabled side'}).isDisabled(),true);
   await page.getByRole('button',{name:'Open dialog'}).click();const dialog=page.getByRole('dialog');
   const dialogSide=page.getByRole('combobox',{name:'Dialog side'});await dialogSide.click();
   await page.getByRole('option',{name:'Sell',exact:true}).click();assert.equal(await dialogSide.textContent(),'Sell');assert.equal(await dialog.isVisible(),true);
   await dialogSide.click();await page.keyboard.press('Escape');assert.equal(await page.getByRole('listbox').count(),0);assert.equal(await dialog.isVisible(),true);
   await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});
   assert.deepEqual(errors,[]);console.log(`${engine}/${width}/${direction}: custom popup, clipped parent, keyboard, disabled, focus and modal Escape passed`);
  }finally{await context.close();}
 }}finally{await browser.close();}
}
