import assert from 'node:assert/strict';
import {readFileSync,mkdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname} from 'node:path';
import {build} from 'esbuild';
import {chromium,webkit} from '@playwright/test';
import {launchBrowser} from './browser-launcher.mjs';

const require=createRequire(import.meta.url);
const css=readFileSync('packages/tokens/generated/tokens.css','utf8')+readFileSync('packages/react/src/styles.css','utf8');
const options=[{value:'all',label:'All'},{value:'open',label:'Open'},{value:'trend',label:'Trend'},{value:'disabled',label:'Unavailable',disabled:true}];
const output='.validation-tmp/segmented-control';mkdirSync(output,{recursive:true});
for(const renderer of ['react','native'].filter(renderer=>!process.env.HIG_SEGMENT_RENDERER||process.env.HIG_SEGMENT_RENDERER===renderer)){
 const source=`import React,{useState} from 'react';import {createRoot} from 'react-dom/client';
 import {HIGProvider} from './packages/${renderer}/src/provider';
 import {SegmentedControl} from './packages/${renderer}/src/${renderer==='react'?'selection':'radio-group'}';
 function Example(){const [value,setValue]=useState('all'),[reduced,setReduced]=useState(undefined);
 return <HIGProvider direction={window.direction} reducedMotion={reduced}><SegmentedControl label='Markets' options={${JSON.stringify(options)}} value={value} onValueChange={setValue}/><button onClick={()=>setReduced(true)}>Reduce motion</button></HIGProvider>;}
 createRoot(document.getElementById('root')).render(<Example/>);`;
 const bundle=await build({stdin:{contents:source,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,format:'iife',platform:'browser',alias:{'react-native':'react-native-web',react:dirname(require.resolve('react/package.json')),'react-dom':dirname(require.resolve('react-dom/package.json'))},define:{'process.env.NODE_ENV':'"production"',__DEV__:'false',global:'globalThis'}});
 for(const [engine,type] of Object.entries({chromium,webkit})){
  const browser=await launchBrowser(type,{headless:true});
  try{for(const width of [390,1280])for(const direction of ['ltr','rtl']){
   const context=await browser.newContext({viewport:{width,height:600},reducedMotion:'no-preference'});
   try{
    const page=await context.newPage(),errors=[];page.setDefaultTimeout(10000);page.on('pageerror',error=>{errors.push(error.message);console.error(error.message);});
    await page.setContent(`<!doctype html><html lang="en" dir="${direction}"><head><style>${css}body{margin:24px;background:var(--hig-background);color:var(--hig-text);font-family:system-ui}fieldset{border:0;padding:0;margin:0}#root{max-width:720px;margin:auto}button{margin-top:24px}button,input{font:inherit}</style></head><body><main id="root"></main></body></html>`);
    await page.evaluate(direction=>{window.direction=direction;},direction);await page.addScriptTag({content:bundle.outputFiles[0].text});
    const selector=renderer==='react'?'.hig-segment-indicator':'#root [style*="transform:"]';
    const indicator=page.locator(selector),all=page.getByRole('radio',{name:'All',exact:true}),trend=page.getByRole('radio',{name:'Trend',exact:true});
    await indicator.waitFor();
    const aligned=async control=>{
     const box=await control.boundingBox();assert.ok(box);
     await page.waitForFunction(({selector,box})=>{const pill=document.querySelector(selector)?.getBoundingClientRect();return pill&&Math.abs(pill.x-box.x)<1&&Math.abs(pill.width-box.width)<1&&Math.abs(pill.height-box.height)<1;},{selector,box});
    };
    await aligned(all);
    const start=await indicator.boundingBox(),destination=await trend.boundingBox();
    // Sample real frames while changing selection, proving visible movement rather than only a final style.
    const middle=await page.evaluate(async selector=>{
     document.querySelector('[role="radio"][aria-label="Trend"],input[value="trend"]').click();
     for(let frame=0;frame<3;frame++)await new Promise(requestAnimationFrame);
     return document.querySelector(selector).getBoundingClientRect().x;
    },selector);
    assert.ok(middle>Math.min(start.x,destination.x)+1&&middle<Math.max(start.x,destination.x)-1,`${renderer}/${engine}/${width}/${direction}: intermediate position ${middle}`);
    // Retarget before the first animation finishes; the pill must settle on the latest choice.
    await all.click();await aligned(all);await trend.click();await aligned(trend);
    await page.getByRole('radio',{name:'Unavailable',exact:true}).dispatchEvent('click');await aligned(trend);
    if(renderer==='react'){
     await all.focus();await page.keyboard.press('Space');await aligned(all);await page.keyboard.press('ArrowRight');
     // Native browsers differ in RTL arrow ordering; selection and focus must still move together.
     const selected=page.locator('input:checked');assert.ok(['open','trend'].includes(await selected.inputValue()));
     assert.equal(await selected.evaluate(element=>element===document.activeElement),true);await aligned(selected);
    }
    await page.setViewportSize({width:width===390?430:1024,height:600});
    await aligned(page.locator(renderer==='react'?'input:checked':'[role="radio"][aria-checked="true"]'));
    const assertSnap=async()=>{
     await all.click();await aligned(all);
     const position=await page.evaluate(async selector=>{
      const radio=document.querySelector('[role="radio"][aria-label="Trend"],input[value="trend"]');radio.click();
      for(let frame=0;frame<2;frame++)await new Promise(requestAnimationFrame);
      return {pill:document.querySelector(selector).getBoundingClientRect().x,radio:radio.getBoundingClientRect().x};
     },selector);
     assert.ok(Math.abs(position.pill-position.radio)<1,`${renderer}/${engine}: reduced motion must snap without a transition (${JSON.stringify(position)})`);
    };
    await page.emulateMedia({reducedMotion:'reduce'});await assertSnap();
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.getByRole('button',{name:'Reduce motion',exact:true}).click();await assertSnap();
    await page.screenshot({path:`${output}/${renderer}-${engine}-${width}-${direction}.png`});
    if(renderer==='react'){
     assert.equal(await indicator.evaluate(element=>getComputedStyle(element).transitionDuration),'0s');
     await page.evaluate(()=>document.documentElement.style.fontSize='32px');await aligned(trend);
     assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
     await page.emulateMedia({forcedColors:'active'});
     assert.equal(await trend.evaluate(element=>getComputedStyle(element.nextElementSibling).outlineStyle),'solid');
    }
    assert.deepEqual(errors,[]);
    console.log(`${renderer}/${engine}/${width}/${direction}: movement, interruption, alignment, disabled and reduced motion passed`);
   }finally{await context.close();}
  }}finally{await browser.close();}
 }
}
