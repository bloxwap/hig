import {launchBrowser} from './browser-launcher.mjs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,join} from 'node:path';
import {build} from 'esbuild';
import {chromium,webkit} from '@playwright/test';

const root=fileURLToPath(new URL('..',import.meta.url));
const output=resolve(process.env.HIG_GESTURE_EVIDENCE??join(root,'evidence/web-gesture-sheet'));
mkdirSync(output,{recursive:true});
const source=`import React,{useState,useRef} from 'react';import {createRoot} from 'react-dom/client';import {HIGProvider} from './packages/react/src/provider';import {GestureSheet} from './packages/react/src/gesture-sheet';
const options=window.sheetOptions;window.sheetEvents=[];function Example(){const [open,setOpen]=useState(false),[pending,setPending]=useState(!!options.pending),[snap,setSnap]=useState(.4),[attempt,setAttempt]=useState(0);const ref=useRef(null);return <HIGProvider locale='fr' reducedMotion={options.reduced} messages={{close:'Fermer'}}><div data-vaul-drawer-wrapper><button>Before</button><GestureSheet open={open} onOpenChange={next=>{if(!next)setAttempt(value=>value+1);window.sheetEvents.push(['request',next]);if(next||!pending)setOpen(next);}} title='Choisir un marché' description='Choisissez votre marché' titleHidden descriptionHidden contentMode='custom' contentRef={el=>{ref.current=el;window.sheetElement=el;}} trigger={<button>Open markets</button>} backendProps={{autoFocus:true,handleOnly:!!options.handleOnly,repositionInputs:false,shouldScaleBackground:true,dismissible:!options.locked,...(options.snaps?{snapPoints:[.4,.8],activeSnapPoint:snap,setActiveSnapPoint:setSnap,fadeFromIndex:1}:{}),onAnimationEnd:next=>window.sheetEvents.push(['settled',next])}} contentProps={{className:'host-sheet',style:{borderTopLeftRadius:20+attempt,height:options.snaps?'100dvh':420,maxHeight:options.snaps?'100dvh':'calc(100dvh - 30px)',bottom:options.snaps?0:12},'data-host-card':'markets',onOpenAutoFocus:event=>{event.preventDefault();ref.current.querySelector('input').focus();},onCloseAutoFocus:()=>window.sheetEvents.push(['return']),onPointerDownOutside:()=>window.sheetEvents.push(['outside'])}} handleProps={{style:{width:100},preventCycle:true}}><h2>Choisir un marché</h2><input aria-label='Rechercher'/><button onClick={()=>setPending(false)}>Ready</button><div className='host-scroll' data-testid='scroll'>{Array.from({length:50},(_,i)=><p key={i}>Market {i}</p>)}</div><button onClick={()=>setOpen(false)}>Accepted host close</button></GestureSheet><button>After</button></div></HIGProvider>};createRoot(document.getElementById('root')).render(<Example/>);`;
const bundle=await build({stdin:{contents:source,resolveDir:root,loader:'tsx'},bundle:true,write:false,format:'iife',platform:'browser',define:{'process.env.NODE_ENV':'"production"'}});
const css=readFileSync(join(root,'packages/tokens/dist/tokens.css'),'utf8')+readFileSync(join(root,'packages/react/src/styles.css'),'utf8')+'body{margin:0;background:var(--hig-background);color:var(--hig-text);font-family:system-ui}button,input{min-height:44px}.host-sheet{box-sizing:border-box;gap:4px}.host-sheet h2{margin:0}.host-scroll{flex:1;min-height:0;overflow:auto;overscroll-behavior:contain}.host-scroll p{height:32px;margin:0}';
const inputs=['packages/react/src/gesture-sheet.tsx','packages/react/src/styles.css','packages/react/package.json','scripts/gesture-sheet-browser-smoke.mjs'];
const result={checkedAt:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),sourceDirty:!!execFileSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8'}).trim(),inputHashes:Object.fromEntries(inputs.map(file=>[file,createHash('sha256').update(readFileSync(join(root,file))).digest('hex')])),backend:'vaul@1.1.2',browserVersions:{},engines:{}};
async function drag(page,locator,distance){const r=await locator.boundingBox();assert.ok(r);await page.mouse.move(r.x+r.width/2,r.y+Math.min(10,r.height/2));await page.mouse.down();await page.mouse.move(r.x+r.width/2,r.y+distance,{steps:12});await page.mouse.up();}
for(const [engine,type] of Object.entries({chromium,webkit})){
 const browser=await launchBrowser(type,{headless:true});const cases=[];result.engines[engine]=cases;result.browserVersions[engine]=browser.version();
 const overall=setTimeout(()=>browser.close().catch(()=>{}),90000);
 try{
  for(const options of [{name:'focus-scroll-drag',width:390},{name:'handle-only',width:1280,handleOnly:true},{name:'pending-veto',width:390,pending:true},{name:'pending-locked',width:390,pending:true,locked:true},{name:'snap-points',width:390,snaps:true},{name:'reduced-motion',width:390,reduced:true}]){
   const context=await browser.newContext({viewport:{width:options.width,height:844},reducedMotion:options.reduced?'reduce':'no-preference'});
   try{
    const page=await context.newPage();page.setDefaultTimeout(10000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/*',route=>route.abort());
    await page.setContent(`<html><head><style>${css}</style></head><body><div id='root'></div></body></html>`);
    await page.evaluate(options=>{window.sheetOptions=options;},options);await page.addScriptTag({content:bundle.outputFiles[0].text});
    const bodyPosition=await page.evaluate(()=>document.body.style.position);
    const trigger=page.getByRole('button',{name:'Open markets'});await trigger.click();
    const sheet=page.getByRole('dialog',{name:'Choisir un marché'});await sheet.waitFor();await page.getByLabel('Rechercher').waitFor();
    await page.waitForFunction(snaps=>{const r=document.querySelector('[role=dialog]')?.getBoundingClientRect();return r&&(snaps?r.top<innerHeight:r.bottom<innerHeight+1);},!!options.snaps);
    await page.waitForTimeout(600); // The real backend enter/scroll lock window must settle before a drag.
    assert.equal(await page.getByLabel('Rechercher').evaluate(el=>document.activeElement===el),true);
    if(!options.snaps){await page.setViewportSize({width:options.width,height:610});const resized=await sheet.boundingBox();assert.ok(resized.y+resized.height<=610);assert.equal(await sheet.evaluate(el=>getComputedStyle(el).maxHeight),'580px');await page.setViewportSize({width:options.width,height:844});}
    const initial=await sheet.boundingBox();const metrics=await sheet.evaluate(el=>({id:el.id,ref:el===window.sheetElement,host:el.dataset.hostCard,bottom:getComputedStyle(el).bottom,maxHeight:getComputedStyle(el).maxHeight,handleWidth:el.querySelector('[data-vaul-handle]').getBoundingClientRect().width,animation:getComputedStyle(el).animationName,transition:getComputedStyle(el).transitionDuration}));
    assert.equal(metrics.ref,true);assert.equal(metrics.host,'markets');assert.equal(metrics.bottom,options.snaps?'0px':'12px');assert.equal(metrics.handleWidth,100);
    await page.screenshot({path:join(output,`${engine}-${options.name}-open.png`)});
    for(let i=0;i<10;i++){await page.keyboard.press('Tab');assert.equal(await sheet.evaluate(el=>el.contains(document.activeElement)),true);}
    await page.keyboard.press('Shift+Tab');assert.equal(await sheet.evaluate(el=>el.contains(document.activeElement)),true);
    if(options.reduced){assert.equal(metrics.animation,'none');assert.equal(metrics.transition,'0s');}
    if(options.name==='focus-scroll-drag'){
     const scroll=page.getByTestId('scroll');await scroll.hover();await page.mouse.wheel(0,400);await page.waitForFunction(()=>document.querySelector('[data-testid=scroll]').scrollTop>0);
     const before=await sheet.boundingBox();await drag(page,scroll,80);const after=await sheet.boundingBox();assert.ok(Math.abs(after.y-before.y)<2,'scrolling content must not drag sheet');
     await scroll.evaluate(el=>{el.scrollTop=0;});await page.waitForTimeout(600);await drag(page,page.locator('[data-vaul-handle]'),200);await sheet.waitFor({state:'hidden'});
    }else if(options.name==='handle-only'){
     await drag(page,sheet.locator('h2:not(.hig-sr-only)'),180);assert.equal(await sheet.isVisible(),true);assert.ok(Math.abs((await sheet.boundingBox()).y-initial.y)<2);
     await drag(page,page.locator('[data-vaul-handle]'),220);await sheet.waitFor({state:'hidden'});
    }else if(options.name==='pending-veto'){
     await page.getByLabel('Rechercher').fill('BTC');await sheet.evaluate(el=>{window.retainedInput=el.querySelector('input');});
     await page.keyboard.press('Escape');assert.equal(await sheet.isVisible(),true);
     await drag(page,page.locator('[data-vaul-handle]'),200);await page.waitForTimeout(600);
     assert.equal(await sheet.isVisible(),true);assert.ok(Math.abs((await sheet.boundingBox()).y-initial.y)<2,'rejected drag must restore open geometry');assert.equal(await sheet.evaluate(el=>el.style.borderTopLeftRadius),'22px','a rejected close must preserve the host layout update');assert.equal(await page.getByLabel('Rechercher').inputValue(),'BTC');assert.equal(await sheet.evaluate(el=>el.querySelector('input')===window.retainedInput),true);
     await page.getByRole('button',{name:'Ready'}).click();await page.keyboard.press('Escape');await sheet.waitFor({state:'hidden'});
    }else if(options.name==='pending-locked'){
     await page.keyboard.press('Escape');await drag(page,page.locator('[data-vaul-handle]'),200);assert.equal(await sheet.isVisible(),true);
     assert.equal((await page.evaluate(()=>window.sheetEvents)).filter(e=>e[0]==='request'&&!e[1]).length,0);
     await page.getByRole('button',{name:'Accepted host close'}).click();await sheet.waitFor({state:'hidden'});
    }else if(options.snaps){
     await drag(page,page.locator('[data-vaul-handle]'),-250);await page.waitForTimeout(600);assert.ok((await sheet.boundingBox()).y<initial.y-100,'snap point should expand');
     await page.keyboard.press('Escape');await sheet.waitFor({state:'hidden'});
    }else{await page.keyboard.press('Escape');await sheet.waitFor({state:'hidden'});}
    await page.waitForFunction(()=>document.activeElement?.textContent==='Open markets');assert.equal(await trigger.evaluate(el=>document.activeElement===el),true);assert.deepEqual(errors,[]);
    assert.equal(await page.evaluate(()=>document.body.style.position),bodyPosition,'accepted close must release the backend body position after a veto');
    await trigger.click();await sheet.waitFor();if(options.snaps)await page.keyboard.press('Escape');else await page.getByRole('button',{name:'Accepted host close'}).click();await sheet.waitFor({state:'hidden'});
    await page.waitForFunction(()=>document.activeElement?.textContent==='Open markets');assert.equal(await trigger.evaluate(el=>document.activeElement===el),true);
    cases.push({name:options.name,passed:true,initial,metrics,events:await page.evaluate(()=>window.sheetEvents),errors});
    await page.screenshot({path:join(output,`${engine}-${options.name}-closed.png`)});
   }finally{await context.close();}
  }
 }catch(error){result.error=String(error);throw error;}finally{clearTimeout(overall);await browser.close();writeFileSync(join(output,'browser.json'),JSON.stringify(result,null,2)+'\n');}
}
console.log(JSON.stringify(result,null,2));
