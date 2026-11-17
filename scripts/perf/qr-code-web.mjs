// QRCode on the web, timed in headless Chromium: the page is bundled as scripts/qr-code-browser-smoke.mjs bundles its page,
// driven with Playwright and measured with CDP `Performance.getMetrics` around each scenario. The shared model is bundled
// from source (no build needed) with `encodeQR` and `qrGeometry` counted, so "identical props encode nothing" is a number.
//
//   node scripts/perf/qr-code-web.mjs      prints one JSON object
//   HIG_QR_RUNS=7                          fresh pages per scenario and CPU rate (default 5); each figure is the median
//   HIG_QR_RATES=1,4,6                     CPU throttling rates (`Emulation.setCPUThrottlingRate`)
//   HIG_QR_RENDERER=native                 the native renderer on react-native-web and react-native-svg's web build
//   HIG_QR_ROOT=.validation-tmp/base       another copy of packages/hig (inside this checkout) to bundle, for a before and after
//
// Scenarios: mount one code; mount one with an arena image; re-render its parent 100 times with identical props; change only
// `size` 100 times; change `value` on each keystroke of a 60-character payment URI; mount a list of 50 distinct codes, and of
// 50 equal ones; mount a code that was shown and unmounted. One change a frame where frames are counted. HIG_QR_SCENARIOS
// names a subset. A throttled desktop Chromium is not a phone.
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname,resolve} from 'node:path';
import {build} from 'esbuild';
import sharp from 'sharp';
import {chromium} from '@playwright/test';
import {launchBrowser} from '../browser-launcher.mjs';

const require=createRequire(import.meta.url);
const root=resolve(process.env.HIG_QR_ROOT??'.'),renderer=process.env.HIG_QR_RENDERER==='native'?'native':'react';
const runs=Number(process.env.HIG_QR_RUNS??5),rates=(process.env.HIG_QR_RATES??'1,4,6').split(',').map(Number);
const css=readFileSync('packages/hig/tokens/generated/tokens.css','utf8')+readFileSync(`${root}/packages/hig/react/src/styles.css`,'utf8');
const image=`data:image/png;base64,${(await sharp({create:{width:64,height:64,channels:3,background:{r:230,g:0,b:122}}}).png().toBuffer()).toString('base64')}`;
/** The shared model from source, with the two steps a render may run counted and timed on `globalThis.__qr`. */
const counted={name:'counted-qr',setup(bundler){
 const model=resolve(root,'packages/hig/contracts/src/qr.ts');
 bundler.onResolve({filter:/^@bloxwap\/hig\/contracts\/qr$/},()=>({path:model}));
 bundler.onLoad({filter:/contracts\/src\/qr\.ts$/},()=>{
  let source=readFileSync(model,'utf8');
  for(const name of ['encodeQR','qrGeometry']){
   if(!source.includes(`export function ${name}(`))throw new Error(`${name} is not an exported function of ${model}`);
   source=source.replace(`export function ${name}(`,`function ${name}Uncounted(`)+`\nexport function ${name}(...args:Parameters<typeof ${name}Uncounted>):ReturnType<typeof ${name}Uncounted>{const count=(globalThis as any).__qr,start=performance.now();try{return ${name}Uncounted(...args);}finally{count.${name}++;count.${name}Ms+=performance.now()-start;}}`;
  }
  return {contents:source,loader:'ts'};
 });
}};
const scenarios=`
 const eth='0x9e0fD0622874ca1cBf79DA087BaF4622Faf77688',uri='ethereum:'+eth+'@8453?v=1';
 const address=(index)=>'0x'+Array.from({length:40},(_,k)=>'0123456789abcdef'[(index*7+k*13+index*k)%16]).join('');
 const count=globalThis.__qr={encodeQR:0,encodeQRMs:0,qrGeometry:0,qrGeometryMs:0};
 let set;
 function Host(){const [state,setState]=useState({codes:[],tick:0});set=setState;return <Box data-tick={state.tick}>{state.codes.map((props,index)=><QRCode key={index} {...props}/>)}</Box>;}
 createRoot(document.getElementById('root')).render(<HIGProvider><Host/></HIGProvider>);
 const show=(codes)=>flushSync(()=>set(state=>({codes,tick:state.tick})));
 const tick=()=>flushSync(()=>set(state=>({codes:state.codes,tick:state.tick+1})));
 const timed=(run)=>{const start=performance.now();run();return performance.now()-start;};
 const frames=(total)=>new Promise(done=>{let seen=0;const next=()=>{if(++seen>=total)done();else requestAnimationFrame(next);};requestAnimationFrame(next);});
 /** Runs inside an animation frame callback, a task of the page's own: CDP counts no script time for code run by \`evaluate\`. Then two frames, so style, layout and paint are in the task time. */
 const inFrame=async(run)=>{const ms=await new Promise(done=>requestAnimationFrame(()=>done(timed(run))));await frames(2);return ms;};
 /** One change a frame, each in its own animation frame callback. */
 const perFrame=async(total,change)=>{const times=[];for(let index=0;index<total;index++)await new Promise(done=>requestAnimationFrame(()=>{times.push(timed(()=>change(index)));done();}));await frames(2);return times;};
 const stats=(times)=>{const sorted=[...times].sort((a,b)=>a-b);return {medianMs:sorted[sorted.length>>1],p95Ms:sorted[Math.min(sorted.length-1,Math.floor(sorted.length*0.95))],maxMs:sorted[sorted.length-1],totalMs:times.reduce((sum,ms)=>sum+ms,0)};};
 const dom=()=>{const codes=document.querySelectorAll('#root svg');return {nodes:document.querySelectorAll('#root *').length,codes:codes.length,nodesPerCode:codes.length?codes[0].parentElement.querySelectorAll('*').length+1:0,paths:document.querySelectorAll('#root path').length,pathChars:document.querySelector('#root path')?.getAttribute('d').length??0};};
 const report=(fields)=>({...fields,encodes:count.encodeQR,encodeMs:count.encodeQRMs,geometries:count.qrGeometry,geometryMs:count.qrGeometryMs,...dom(),timerMs:crossOriginIsolated?0.005:0.1});
 window.perf={
  reset(){for(const key of Object.keys(count))count[key]=0;},
  mount:{async run(){const commitMs=await inFrame(()=>show([{value:eth}]));return report({commitMs});}},
  mountArena:{async run(){const commitMs=await inFrame(()=>show([{value:eth,arena:${JSON.stringify(image)}}]));return report({commitMs});}},
  rerender:{async setup(){show([{value:eth}]);await frames(2);},async run(){const totalMs=await inFrame(()=>{for(let index=0;index<100;index++)tick();});return report({renders:100,totalMs,perRenderMs:totalMs/100});}},
  resize:{async setup(){show([{value:eth,size:99}]);await frames(2);},async run(){return report({changes:100,...stats(await perFrame(100,index=>show([{value:eth,size:100+index}])))});}},
  typing:{async setup(){show([{value:''}]);await frames(2);},async run(){return report({changes:uri.length,...stats(await perFrame(uri.length,index=>show([{value:uri.slice(0,index+1)}])))});}},
  list:{async run(){const commitMs=await inFrame(()=>show(Array.from({length:50},(_,index)=>({value:address(index),size:96}))));return report({commitMs});}},
  listSame:{async run(){const commitMs=await inFrame(()=>show(Array.from({length:50},()=>({value:eth,size:96}))));return report({commitMs});}},
  remount:{async setup(){show([{value:eth}]);await frames(2);show([]);await frames(2);},async run(){const commitMs=await inFrame(()=>show([{value:eth}]));return report({commitMs});}},
 };`;
const sources={
 react:`import React,{useState} from 'react';import {createRoot} from 'react-dom/client';import {flushSync} from 'react-dom';
 import {HIGProvider} from './packages/hig/react/src/provider';
 import {QRCode} from './packages/hig/react/src/qr-code';
 const Box=(props)=><div {...props}/>;${scenarios}`,
 native:`import React,{useState} from 'react';import {createRoot} from 'react-dom/client';import {flushSync} from 'react-dom';import {View} from 'react-native';
 import {HIGProvider as Provider} from './packages/hig/native/src/provider';
 import {QRCode} from './packages/hig/native/src/qr-code';
 const Box=({children})=><View>{children}</View>,HIGProvider=({children})=><Provider reducedMotion>{children}</Provider>;${scenarios}`,
};
const bundle=await build({stdin:{contents:sources[renderer],resolveDir:root,loader:'tsx'},bundle:true,write:false,format:'iife',platform:'browser',plugins:[counted],resolveExtensions:['.web.tsx','.web.ts','.web.js','.tsx','.ts','.jsx','.js','.json'],alias:{'react-native':'react-native-web',react:dirname(require.resolve('react/package.json')),'react-dom':dirname(require.resolve('react-dom/package.json'))},define:{'process.env.NODE_ENV':'"production"',__DEV__:'false',global:'globalThis'}});
const html=`<!doctype html><html lang="en"><head><style>${css}body{margin:24px;background:var(--hig-background);color:var(--hig-text)}#root>div>div{display:flex;flex-wrap:wrap;gap:8px}</style></head><body><main id="root"></main><script>${bundle.outputFiles[0].text.replaceAll('</script','<\\/script')}</script></body></html>`;
// Cross-origin isolated, so `performance.now()` in the page resolves 5 µs rather than 100 µs.
const origin='https://qr-code.perf/',isolation={'Cross-Origin-Opener-Policy':'same-origin','Cross-Origin-Embedder-Policy':'require-corp'};
const names=(process.env.HIG_QR_SCENARIOS??'mount,mountArena,rerender,resize,typing,list,listSame,remount').split(',');
const median=(values)=>{const sorted=[...values].sort((a,b)=>a-b);return sorted[sorted.length>>1];};
const round=(value)=>Math.round(value*1000)/1000;
const browser=await launchBrowser(chromium,{headless:true});
const result={benchmark:'qr-code-web',renderer,browser:`chromium ${browser.version()}`,platform:`${process.platform} ${process.arch}`,runs,source:process.env.HIG_QR_ROOT??'.',rates:{}};
try{
 for(const rate of rates){
  const byScenario={};
  for(const name of names){
   const samples=[];
   for(let run=0;run<runs;run++){
    const context=await browser.newContext({viewport:{width:1200,height:900}});
    try{
     const page=await context.newPage(),errors=[];page.setDefaultTimeout(60000);page.on('pageerror',error=>errors.push(error.message));
     await page.route(origin,route=>route.fulfill({contentType:'text/html',headers:isolation,body:html}));
     await page.goto(origin);await page.waitForFunction(()=>window.perf);
     const client=await context.newCDPSession(page);await client.send('Performance.enable');await client.send('Emulation.setCPUThrottlingRate',{rate});
     const metrics=async()=>Object.fromEntries((await client.send('Performance.getMetrics')).metrics.map(({name,value})=>[name,value]));
     await page.evaluate(async name=>{await window.perf[name].setup?.();window.perf.reset();},name);
     const before=await metrics(),measured=await page.evaluate(name=>window.perf[name].run(),name),after=await metrics();
     if(errors.length)throw new Error(`${name}: ${errors.join('; ')}`);
     samples.push({...measured,scriptMs:(after.ScriptDuration-before.ScriptDuration)*1000,taskMs:(after.TaskDuration-before.TaskDuration)*1000,layoutMs:(after.LayoutDuration-before.LayoutDuration)*1000,recalcStyleMs:(after.RecalcStyleDuration-before.RecalcStyleDuration)*1000,layoutCount:after.LayoutCount-before.LayoutCount,recalcStyleCount:after.RecalcStyleCount-before.RecalcStyleCount,heapUsedKB:after.JSHeapUsedSize/1024,heapGrowthKB:(after.JSHeapUsedSize-before.JSHeapUsedSize)/1024});
    }finally{await context.close();}
   }
   byScenario[name]=Object.fromEntries(Object.keys(samples[0]).map(key=>[key,round(median(samples.map(sample=>sample[key])))]));
  }
  result.rates[`${rate}x`]=byScenario;
 }
}finally{await browser.close();}
console.log(JSON.stringify(result,null,1));
