// Web confetti in real engines: one canvas, real pixels in the token colours, timing, reduced motion and clean-up.
// Run after `node scripts/build.mjs`: node scripts/confetti-browser-smoke.mjs. Screenshots go to .validation-tmp/confetti.
// With HIG_EXPO_PORT set (scripts/run-browser-gates.mjs sets it and serves the native fixture's Expo web export) it also
// runs the native renderer through react-native-web and Reanimated's web implementation. That is the same component code,
// not Android or iOS: it shows the views, colours, motion and clean-up, never a device's frame rate.
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname} from 'node:path';
import {build} from 'esbuild';
import {chromium,webkit} from '@playwright/test';
import {launchBrowser} from './browser-launcher.mjs';

const require=createRequire(import.meta.url);
const css=readFileSync('packages/hig/tokens/generated/tokens.css','utf8');
const output='.validation-tmp/confetti';mkdirSync(output,{recursive:true});
const source=`import React from 'react';import {createRoot} from 'react-dom/client';
import {HIGProvider} from './packages/hig/react/src/provider';
import {Confetti,confetti} from './packages/hig/react/src/confetti';
window.confetti=confetti;window.presses=0;
function Example(){return <HIGProvider><button onClick={()=>{window.presses++;}}>Under the confetti</button>{window.host&&<Confetti/>}</HIGProvider>;}
createRoot(document.getElementById('root')).render(<Example/>);`;
const bundle=await build({stdin:{contents:source,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,format:'iife',platform:'browser',alias:{react:dirname(require.resolve('react/package.json')),'react-dom':dirname(require.resolve('react-dom/package.json'))},define:{'process.env.NODE_ENV':'"production"'}});
const frames=(page,count)=>page.evaluate(async count=>{for(let frame=0;frame<count;frame++)await new Promise(requestAnimationFrame);},count);
const canvases=page=>page.locator('canvas[data-hig-confetti]');
/** What is on the canvas now: its size, colour space and how many pixels are painted in each token colour. */
const painted=page=>page.evaluate(()=>{
 const canvas=document.querySelector('canvas[data-hig-confetti]'),context=canvas.getContext('2d'),{data}=context.getImageData(0,0,canvas.width,canvas.height);
 const count={any:0,green:0,pink:0,blue:0,yellow:0};
 for(let at=0;at<data.length;at+=4){
  if(data[at+3]<40)continue;count.any++;
  const r=data[at],g=data[at+1],b=data[at+2];
  if(g>200&&r<90&&b<140)count.green++;else if(r>200&&g<130&&b>100)count.pink++;else if(b>200&&r<110&&g>130)count.blue++;else if(r>200&&g>200&&b<130)count.yellow++;
 }
 const style=getComputedStyle(canvas);
 return {count,width:canvas.width,height:canvas.height,colorSpace:context.getContextAttributes?.().colorSpace??'srgb',position:style.position,pointerEvents:style.pointerEvents,zIndex:style.zIndex,hidden:canvas.getAttribute('aria-hidden'),inBody:canvas.parentElement===document.body,box:canvas.getBoundingClientRect().toJSON()};
});
for(const [engine,type] of Object.entries({chromium,webkit})){
 const browser=await launchBrowser(type,{headless:true});
 try{for(const host of [true,false]){
  const context=await browser.newContext({viewport:{width:800,height:600},deviceScaleFactor:2,reducedMotion:'no-preference'});
  try{
   const page=await context.newPage(),errors=[];page.setDefaultTimeout(15000);page.on('pageerror',error=>{errors.push(error.message);console.error(error.message);});
   await page.setContent(`<!doctype html><html lang="en"><head><style>${css}body{margin:24px;background:var(--hig-background);color:var(--hig-text);font-family:system-ui}</style></head><body><main id="root"></main></body></html>`);
   await page.evaluate(host=>{window.host=host;},host);await page.addScriptTag({content:bundle.outputFiles[0].text});
   await page.getByRole('button').waitFor();
   const label=`${engine}/${host?'host':'no host'}`;
   // A burst of two seconds: flying after a third of a second, gone after two.
   await page.evaluate(()=>{window.done=false;window.started=performance.now();void window.confetti({particleCount:150,spread:100,startVelocity:35,origin:{y:0.6},ticks:120}).then(()=>{window.done=true;window.ended=performance.now();});});
   await frames(page,20);
   assert.equal(await canvases(page).count(),1,`${label}: one canvas`);
   const flying=await painted(page);
   assert.deepEqual({width:flying.width,height:flying.height,position:flying.position,pointerEvents:flying.pointerEvents,zIndex:flying.zIndex,hidden:flying.hidden,inBody:flying.inBody},{width:1600,height:1200,position:'fixed',pointerEvents:'none',zIndex:'100',hidden:'true',inBody:true},`${label}: canvas`);
   assert.deepEqual({x:flying.box.x,y:flying.box.y,width:flying.box.width,height:flying.box.height},{x:0,y:0,width:800,height:600},`${label}: covers the viewport`);
   // Real pixels in each default role: action/up green, down pink, info blue, warning yellow.
   for(const color of ['green','pink','blue','yellow'])assert.ok(flying.count[color]>150,`${label}: ${color} pixels ${JSON.stringify(flying.count)}`);
   assert.ok(flying.count.green>flying.count.pink,`${label}: green is dealt twice (action and up)`);
   // The canvas takes no pointer events: the button under it still works.
   await page.getByRole('button').click();assert.equal(await page.evaluate(()=>window.presses),1,`${label}: press through the canvas`);
   await page.screenshot({path:`${output}/${engine}-${host?'host':'no-host'}.png`});
   // The viewport changes mid-flight: the canvas follows on the next frame.
   await page.setViewportSize({width:640,height:480});await frames(page,3);
   const resized=await painted(page);assert.deepEqual([resized.width,resized.height],[1280,960],`${label}: resized`);assert.ok(resized.count.any>0,`${label}: still painting after a resize`);
   await page.waitForFunction(()=>window.done);
   const lasted=await page.evaluate(()=>window.ended-window.started);
   // 119 ticks at 60 a second from the first frame, whatever the frame rate: 1983 ms, plus the frames either side (a loaded runner may hold a frame back).
   assert.ok(lasted>1950&&lasted<3000,`${label}: lasted ${lasted.toFixed(0)} ms`);
   assert.equal(await canvases(page).count(),0,`${label}: canvas removed when the last piece has gone`);
   // Reduced motion: nothing by default, a burst when the call opts out; reset clears it.
   await page.emulateMedia({reducedMotion:'reduce'});await frames(page,2);
   assert.equal(await page.evaluate(async()=>{const before=performance.now();await window.confetti({particleCount:50});return performance.now()-before<50&&document.querySelectorAll('canvas').length===0;}),true,`${label}: no burst under reduced motion`);
   await page.evaluate(()=>{window.kept=false;void window.confetti({particleCount:50,disableForReducedMotion:false}).then(()=>{window.kept=true;});});await frames(page,3);
   assert.equal(await canvases(page).count(),1,`${label}: opted-out burst is drawn`);
   await page.evaluate(()=>window.confetti.reset());await frames(page,1);
   assert.equal(await canvases(page).count(),0,`${label}: reset removes the canvas`);assert.equal(await page.evaluate(()=>window.kept),true,`${label}: reset resolves the promise`);
   await page.emulateMedia({reducedMotion:'no-preference'});await frames(page,2);
   // The largest celebration the app fires: five bursts, 600 pieces. Time spent in the frame callback (flight and canvas calls).
   const cost=await page.evaluate(async()=>{
    const original=window.requestAnimationFrame,times=[];
    window.requestAnimationFrame=callback=>original(now=>{const before=performance.now();callback(now);times.push(performance.now()-before);});
    const base={origin:{y:0.7},ticks:90};
    await Promise.all([{particleCount:150,spread:26,startVelocity:55},{particleCount:120,spread:60},{particleCount:210,spread:100,decay:0.91,scalar:0.8},{particleCount:60,spread:120,startVelocity:25,decay:0.92,scalar:1.2},{particleCount:60,spread:120,startVelocity:45}].map(options=>window.confetti({...base,...options})));
    window.requestAnimationFrame=original;
    return {frames:times.length,mean:times.reduce((sum,time)=>sum+time,0)/times.length,worst:Math.max(...times)};
   });
   assert.ok(cost.frames>30,`${label}: ${cost.frames} frames`);assert.ok(cost.mean<8,`${label}: ${cost.mean.toFixed(2)} ms a frame for 600 pieces`);
   if(engine==='chromium'&&host){
    // A wide-gamut screen: the canvas is Display P3 and the action green is painted with its P3 channels (0, 1, 0.24).
    const client=await context.newCDPSession(page);await client.send('Emulation.setEmulatedMedia',{features:[{name:'color-gamut',value:'p3'}]});
    assert.equal(await page.evaluate(()=>matchMedia('(color-gamut: p3)').matches),true,'chromium: emulated P3 screen');
    await page.evaluate(()=>{void window.confetti({particleCount:40,flat:true,scalar:3,shapes:['square'],startVelocity:8,gravity:0,ticks:600});});await frames(page,10);
    const wide=await page.evaluate(()=>{
     const canvas=document.querySelector('canvas[data-hig-confetti]'),context=canvas.getContext('2d'),{data}=context.getImageData(0,0,canvas.width,canvas.height,{colorSpace:'display-p3'});
     let green=null;for(let at=0;at<data.length&&!green;at+=4)if(data[at+3]>250&&data[at+1]>250&&data[at]<10)green=[data[at],data[at+1],data[at+2]];
     return {colorSpace:context.getContextAttributes().colorSpace,green};
    });
    assert.equal(wide.colorSpace,'display-p3','chromium: Display P3 canvas');
    assert.ok(wide.green&&Math.abs(wide.green[2]-61)<=2,`chromium: P3 action green ${JSON.stringify(wide.green)}`);
    await page.evaluate(()=>window.confetti.reset());
   }
   assert.deepEqual(errors,[]);
   console.log(`${label}: canvas, colours ${JSON.stringify(flying.count)}, ${flying.colorSpace}, lasted ${lasted.toFixed(0)} ms, reduced motion, reset; 600 pieces ${cost.mean.toFixed(2)} ms a frame (worst ${cost.worst.toFixed(2)}) over ${cost.frames} frames`);
  }finally{await context.close();}
 }}finally{await browser.close();}
}
if(process.env.HIG_EXPO_PORT){
 const browser=await chromium.launch({headless:true});
 try{for(const direction of ['ltr','rtl']){
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'no-preference'});
  try{
   const page=await context.newPage(),errors=[];page.setDefaultTimeout(15000);page.on('pageerror',error=>{errors.push(error.message);console.error(error.message);});
   await page.goto(`http://127.0.0.1:${process.env.HIG_EXPO_PORT}/?component=Confetti&dir=${direction}`,{waitUntil:'networkidle'});
   const button=page.getByRole('button',{name:'Celebrate',exact:true});await button.waitFor();
   // A piece is a childless view with a fill, 10 points square or a 12 point circle, moved by its transform.
   const pieces=()=>page.evaluate(()=>[...document.querySelectorAll('div')].filter(element=>element.childElementCount===0&&element.style.backgroundColor&&element.style.transform.includes('translateX')&&['10px','12px'].includes(element.style.width)).map(element=>{const style=getComputedStyle(element),parent=getComputedStyle(element.parentElement);return {transform:element.style.transform,opacity:Number(style.opacity),color:element.style.backgroundColor,width:element.style.width,height:element.style.height,left:style.left,top:style.top,layer:[parent.pointerEvents,parent.direction,parent.position].join(' ')};}));
   const label=`native through react-native-web/${direction}`;
   assert.equal((await pieces()).length,0,`${label}: nothing at rest`);
   await button.click();await page.waitForFunction(()=>[...document.querySelectorAll('div')].some(element=>element.style.transform.includes('translateX')&&['10px','12px'].includes(element.style.width)));
   await page.waitForTimeout(150);const first=await pieces();await page.waitForTimeout(350);const second=await pieces();
   assert.equal(first.length,80,`${label}: one view a piece`);assert.equal(second.length,80,`${label}: no view added or removed in flight`);
   assert.deepEqual([...new Set(first.map(piece=>piece.layer))],['none ltr absolute'],`${label}: the layer takes no pointer events and stays left-to-right`);
   // The table's action/up green, info blue, down pink and warning yellow.
   assert.equal(new Set(first.map(piece=>piece.color)).size,4,`${label}: colours ${[...new Set(first.map(piece=>piece.color))]}`);
   first.forEach((piece,index)=>{
    const later=second[index];
    assert.notEqual(piece.transform,later.transform,`${label}: piece ${index} moved`);assert.ok(later.opacity<piece.opacity,`${label}: piece ${index} fades`);
    // Only transform and opacity change: the box and its place in the layout stay.
    assert.deepEqual([later.width,later.height,later.left,later.top,later.color],[piece.width,piece.height,piece.left,piece.top,piece.color],`${label}: piece ${index} keeps its layout`);
    assert.match(piece.transform,/^translateX\(-?[\d.e-]+px\) translateY\(-?[\d.e-]+px\) rotate\(-?[\d.e-]+rad\) scaleX\([\d.e-]+\) scaleY\([\d.e-]+\)$/,`${label}: piece ${index} transform`);
   });
   await page.screenshot({path:`${output}/native-web-${direction}.png`});
   // The button under the layer still takes a press, which fires a second burst; both end and every view goes.
   await button.click();await page.waitForFunction(()=>[...document.querySelectorAll('div')].filter(element=>element.style.transform.includes('translateX')&&['10px','12px'].includes(element.style.width)).length===160);
   await page.waitForFunction(()=>![...document.querySelectorAll('div')].some(element=>element.style.transform.includes('translateX')&&['10px','12px'].includes(element.style.width)));
   assert.deepEqual(errors,[]);
   console.log(`${label}: 80 views, four colours, transform and opacity only, press through the layer, views removed at the end`);
  }finally{await context.close();}
 }}finally{await browser.close();}
}else console.log('Native renderer through react-native-web skipped: set HIG_EXPO_PORT to a served Expo web export of fixtures/native');
