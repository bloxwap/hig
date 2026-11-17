// What web confetti costs, measured in headless Chromium. The page is bundled from source the way
// scripts/confetti-browser-smoke.mjs bundles its page. Run from the repository root after `node scripts/build.mjs`:
//   node scripts/perf/confetti-web.mjs > confetti-web.json
//   node scripts/perf/confetti-web.mjs --gpu > confetti-web-gpu.json   (macOS: rasterise on the machine's GPU through Metal)
// It prints one JSON object; progress goes to stderr. Every burst is launched from a seeded Math.random, so two runs fly the
// same pieces. For bursts of 100, 300 and 1000 pieces and for five bursts of 150 fired 100 ms apart it reports:
//  live        the burst in real time: requestAnimationFrame intervals (headless frames come 16.6 to 16.8 ms apart, so
//              `over16_7` counts that jitter and `over20` is the count of late frames), the DevTools Performance metrics
//              (script and task time, layouts, style recalculations, JS heap) as deltas, the CPU time of the renderer and GPU
//              processes, the time inside confetti's own frame callback (its first call, which creates and sizes the canvas,
//              apart), React commits, timers started
//  driven      the same burst with its frame callback called back to back, a sixtieth of a second apart on its own clock:
//              the JavaScript and canvas recording cost of a frame with nothing waiting on the display, so the least noisy
//              number to compare two versions with (median of five)
//  canvas      canvas calls and state changes a frame
//  allocation  bytes of JS heap a frame allocates while it flies: heap growth between a forced collection and the end of
//              the burst, in a second browser whose young generation is too large to be collected in between
// then the same live and driven numbers with the CPU throttled four times, twenty bursts one after another (does anything
// build up?), what is left a second after the last piece has gone, and a fingerprint of the pixels of four frames of two
// fixed bursts, which must not change when the renderer is made faster.
// To compare another version of the renderer, point HIG_CONFETTI_RENDERER at its source file (a path esbuild can resolve
// from the repository root); it must export `Confetti` and `confetti`.
// Without --gpu headless Chromium rasterises in software, and does it on the renderer's main thread: `taskMsPerFrame` is then
// mostly that raster, which a browser with a GPU does in another process. `scriptMsPerFrame`, `callbackMeanMs` and `driven`
// are the renderer's own JavaScript and canvas calls either way. `environment.rasteriser` says which one ran.
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {build} from 'esbuild';
import {chromium} from '@playwright/test';
import {launchBrowser} from '../browser-launcher.mjs';

const require=createRequire(import.meta.url);
const css=readFileSync('packages/hig/tokens/generated/tokens.css','utf8');
const source=`import React,{Profiler} from 'react';import {createRoot} from 'react-dom/client';
import {HIGProvider} from './packages/hig/react/src/provider';
import {Confetti,confetti} from ${JSON.stringify(process.env.HIG_CONFETTI_RENDERER??'./packages/hig/react/src/confetti')};
window.confetti=confetti;window.perf.commits=0;
createRoot(document.getElementById('root')).render(<Profiler id='page' onRender={()=>{window.perf.commits++;}}><HIGProvider><Confetti/></HIGProvider></Profiler>);`;
const bundle=await build({stdin:{contents:source,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,format:'iife',platform:'browser',alias:{react:dirname(require.resolve('react/package.json')),'react-dom':dirname(require.resolve('react-dom/package.json'))},define:{'process.env.NODE_ENV':'"production"'}});
const viewport={width:1280,height:720},deviceScaleFactor=2,gpu=process.argv.includes('--gpu');
const base={origin:{y:0.7},spread:70};
const scenarios={
 burst100:{bursts:[{...base,particleCount:100}],gap:0},
 burst300:{bursts:[{...base,particleCount:300}],gap:0},
 burst1000:{bursts:[{...base,particleCount:1000}],gap:0},
 overlap5x150:{bursts:Array.from({length:5},()=>({...base,particleCount:150})),gap:100},
};
const round=(value,digits=3)=>Number(value.toFixed(digits));
/** Runs before the page's own script: the browser's own frame and timer functions are kept, and what the page asks of them is counted. */
function prepare(){
 const raf=window.requestAnimationFrame.bind(window),timeout=window.setTimeout.bind(window),interval=window.setInterval.bind(window),add=window.addEventListener.bind(window),remove=window.removeEventListener.bind(window);
 const perf=window.perf={raf,frames:0,timers:0,resize:0,commits:0,
  /** mulberry32: the same pieces every run. */
  seed(seed){Math.random=()=>{seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};},
  counted:callback=>{perf.frames++;return raf(callback);}};
 window.requestAnimationFrame=perf.counted;
 window.setTimeout=(...args)=>{perf.timers++;return timeout(...args);};window.setInterval=(...args)=>{perf.timers++;return interval(...args);};
 window.addEventListener=(type,...rest)=>{if(type==='resize')perf.resize++;return add(type,...rest);};window.removeEventListener=(type,...rest)=>{if(type==='resize')perf.resize--;return remove(type,...rest);};
}
/** A burst in real time. `count` also wraps the canvas context to count what is called on it. */
async function live({bursts,gap,count}){
 const perf=window.perf,raf=perf.raf,stamps=[],spent=[],timers=perf.timers,commits=perf.commits;perf.seed(7);
 const proto=CanvasRenderingContext2D.prototype,calls={fill:0,beginPath:0,closePath:0,moveTo:0,lineTo:0,ellipse:0,clearRect:0,setTransform:0,save:0,restore:0,fillStyle:0,globalAlpha:0},kept={};
 if(count){
  // Wrappers of fixed arity, so counting allocates nothing of its own.
  const wrap={fill:o=>function(){calls.fill++;return o.call(this);},beginPath:o=>function(){calls.beginPath++;return o.call(this);},closePath:o=>function(){calls.closePath++;return o.call(this);},save:o=>function(){calls.save++;return o.call(this);},restore:o=>function(){calls.restore++;return o.call(this);},
   moveTo:o=>function(x,y){calls.moveTo++;return o.call(this,x,y);},lineTo:o=>function(x,y){calls.lineTo++;return o.call(this,x,y);},clearRect:o=>function(x,y,w,h){calls.clearRect++;return o.call(this,x,y,w,h);},
   ellipse:o=>function(x,y,rx,ry,turn,from,to){calls.ellipse++;return o.call(this,x,y,rx,ry,turn,from,to);},setTransform:o=>function(a,b,c,d,e,f){calls.setTransform++;return o.call(this,a,b,c,d,e,f);}};
  for(const name of Object.keys(wrap)){kept[name]=Object.getOwnPropertyDescriptor(proto,name);Object.defineProperty(proto,name,{...kept[name],value:wrap[name](kept[name].value)});}
  for(const name of ['fillStyle','globalAlpha']){const own=kept[name]=Object.getOwnPropertyDescriptor(proto,name);Object.defineProperty(proto,name,{...own,set(value){calls[name]++;own.set.call(this,value);}});}
 }
 window.requestAnimationFrame=callback=>raf(now=>{const before=performance.now();callback(now);spent.push(performance.now()-before);});
 let fired=0,started=-1,flying=true;const done=[];
 await new Promise(resolve=>{
  const watch=now=>{
   stamps.push(now);if(started<0)started=now;
   while(fired<bursts.length&&now-started>=fired*gap){done.push(window.confetti(bursts[fired++]));if(fired===bursts.length)void Promise.all(done).then(()=>{flying=false;});}
   if(flying)raf(watch);else resolve();
  };
  raf(watch);
 });
 window.requestAnimationFrame=perf.counted;for(const name of Object.keys(kept))Object.defineProperty(proto,name,kept[name]);
 const gaps=stamps.slice(1).map((stamp,index)=>stamp-stamps[index]),sum=list=>list.reduce((total,value)=>total+value,0);
 return {frames:gaps.length,over16_7:gaps.filter(gap=>gap>16.7).length,over20:gaps.filter(gap=>gap>20).length,over33:gaps.filter(gap=>gap>33).length,lateFrames:gaps.map((gap,index)=>gap>20?index:-1).filter(index=>index>=0).slice(0,12),worstFrameMs:Math.max(...gaps),meanFrameMs:sum(gaps)/gaps.length,
  callbacks:spent.length,callbackFirstMs:spent[0],callbackMeanMs:sum(spent.slice(1))/(spent.length-1),callbackWorstMs:Math.max(...spent.slice(1)),commits:perf.commits-commits,timers:perf.timers-timers,canvasesAfter:document.querySelectorAll('canvas').length,calls};
}
/** The same bursts, all fired at once, with the frame callback called back to back on a clock of its own. */
function driven({bursts}){
 const perf=window.perf,times=[];let frames=0;
 for(let turn=0;turn<5;turn++){
  perf.seed(7);let pending=null;window.requestAnimationFrame=callback=>{pending=callback;return 1;};
  for(const burst of bursts)void window.confetti(burst);
  const before=performance.now();let now=0;frames=0;
  while(pending){const callback=pending;pending=null;callback(now);now+=1000/60;frames++;}
  times.push((performance.now()-before)*1000/frames);window.requestAnimationFrame=perf.counted;
 }
 times.sort((a,b)=>a-b);
 return {frames,microsecondsPerFrame:times[2],fastest:times[0],slowest:times[4]};
}
/** Twenty bursts, each started when the one before has gone: the time in the frame callback for each, to see whether it grows. */
async function inARow(){
 const perf=window.perf,raf=perf.raf,each=[];perf.seed(7);
 for(let burst=0;burst<20;burst++){
  const spent=[];window.requestAnimationFrame=callback=>raf(now=>{const before=performance.now();callback(now);spent.push(performance.now()-before);});
  await window.confetti({origin:{y:0.7},spread:70,particleCount:100,ticks:45});
  each.push(spent.reduce((total,value)=>total+value,0)/spent.length);
 }
 window.requestAnimationFrame=perf.counted;
 const mean=list=>list.reduce((total,value)=>total+value,0)/list.length;
 return {bursts:each.length,callbackMeanMsFirstFive:mean(each.slice(0,5)),callbackMeanMsLastFive:mean(each.slice(-5)),canvasesAfter:document.querySelectorAll('canvas').length};
}
/** Three frames of two fixed bursts, as a hash of every pixel of the canvas. */
function picture(){
 const perf=window.perf;perf.seed(11);let pending=null;window.requestAnimationFrame=callback=>{pending=callback;return 1;};
 void window.confetti({particleCount:150,spread:100,origin:{y:0.6},shapes:['square','circle','star']});void window.confetti({particleCount:60,spread:55,angle:60,origin:{x:0.1,y:0.8},colors:['#ff0080','rgb(0 200 255)'],scalar:1.5});
 const frames=[];
 for(const at of [0,250,1000,2500]){
  const callback=pending;pending=null;callback(at);
  const canvas=document.querySelector('canvas[data-hig-confetti]'),{data}=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height);
  let hash=0x811c9dc5,painted=0;for(let index=0;index<data.length;index++){hash=Math.imul(hash^data[index],0x01000193);if(index%4===3&&data[index]>0)painted++;}
  frames.push({atMs:at,width:canvas.width,height:canvas.height,paintedPixels:painted,hash:(hash>>>0).toString(16).padStart(8,'0')});
 }
 window.confetti.reset();window.requestAnimationFrame=perf.counted;
 return frames;
}
const hardware=gpu?['--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist','--enable-gpu-rasterization']:[];
/** A browser with the page loaded and the DevTools sessions the measurements read. */
async function open(flags){
 const browser=await launchBrowser(chromium,{headless:true,args:[...hardware,...flags]}),errors=[];
 const context=await browser.newContext({viewport,deviceScaleFactor,reducedMotion:'no-preference'}),page=await context.newPage();
 page.setDefaultTimeout(120000);page.on('pageerror',error=>{errors.push(error.message);});
 await page.setContent(`<!doctype html><html lang="en"><head><style>${css}body{margin:24px;background:var(--hig-background);color:var(--hig-text);font-family:system-ui}</style></head><body><main id="root"></main></body></html>`);
 await page.evaluate(prepare);await page.addScriptTag({content:bundle.outputFiles[0].text});await page.locator('[data-hig-confetti-host]').waitFor({state:'attached'});
 const client=await context.newCDPSession(page),system=await browser.newBrowserCDPSession();
 await client.send('Performance.enable');await client.send('HeapProfiler.enable');
 return {browser,page,client,system,errors,
  metrics:async()=>Object.fromEntries((await client.send('Performance.getMetrics')).metrics.map(({name,value})=>[name,value])),
  collect:()=>client.send('HeapProfiler.collectGarbage')};
}
const report={environment:{},unthrottled:{},throttled4x:{}};
{
 const {browser,page,client,system,errors,metrics,collect}=await open([]);
 try{
  /** Resident memory of the browser's processes by kind, in megabytes: canvas backing stores are not JS heap. */
  const resident=async()=>{
   const kinds={};
   try{for(const {type,id} of (await system.send('SystemInfo.getProcessInfo')).processInfo){const kb=Number(execFileSync('ps',['-o','rss=','-p',String(id)],{encoding:'utf8'}).trim());if(Number.isFinite(kb))kinds[type]=round((kinds[type]??0)+kb/1024,1);}}catch{return null;}
   return kinds;
  };
  /** CPU seconds the renderer and GPU processes have used so far. */
  const processors=async()=>{const kinds={renderer:0,GPU:0};for(const {type,cpuTime} of (await system.send('SystemInfo.getProcessInfo')).processInfo)if(type in kinds)kinds[type]+=cpuTime;return kinds;};
  const measured=async(run,argument)=>{
   await collect();const cpuBefore=await processors(),before=await metrics(),result=await page.evaluate(run,argument),after=await metrics(),cpuAfter=await processors();await collect();const settled=await metrics();
   return {result,rendererCpuMs:(cpuAfter.renderer-cpuBefore.renderer)*1000,gpuCpuMs:(cpuAfter.GPU-cpuBefore.GPU)*1000,scriptMs:(after.ScriptDuration-before.ScriptDuration)*1000,taskMs:(after.TaskDuration-before.TaskDuration)*1000,layouts:after.LayoutCount-before.LayoutCount,styleRecalcs:after.RecalcStyleCount-before.RecalcStyleCount,heapRetainedBytes:settled.JSHeapUsedSize-before.JSHeapUsedSize};
  };
  const scenario=async(name,full)=>{
   const {bursts,gap}=scenarios[name];process.stderr.write(`${name}\n`);
   const {result:frames,...cdp}=await measured(live,{bursts,gap,count:false});
   const entry={pieces:bursts.reduce((total,burst)=>total+burst.particleCount,0),
    live:{frames:frames.frames,over16_7:frames.over16_7,over20:frames.over20,over33:frames.over33,lateFrames:frames.lateFrames,worstFrameMs:round(frames.worstFrameMs,2),meanFrameMs:round(frames.meanFrameMs,2),scriptMsPerFrame:round(cdp.scriptMs/frames.frames),taskMsPerFrame:round(cdp.taskMs/frames.frames),rendererCpuMsPerFrame:round(cdp.rendererCpuMs/frames.frames),gpuCpuMsPerFrame:round(cdp.gpuCpuMs/frames.frames),callbackFirstMs:round(frames.callbackFirstMs,2),callbackMeanMs:round(frames.callbackMeanMs),callbackWorstMs:round(frames.callbackWorstMs,2),layouts:cdp.layouts,styleRecalcs:cdp.styleRecalcs,reactCommits:frames.commits,timersStarted:frames.timers,heapRetainedBytes:cdp.heapRetainedBytes,canvasesAfter:frames.canvasesAfter},
    driven:await page.evaluate(driven,{bursts}).then(({frames:count,microsecondsPerFrame,fastest,slowest})=>({frames:count,microsecondsPerFrame:round(microsecondsPerFrame,1),fastest:round(fastest,1),slowest:round(slowest,1)}))};
   if(full){const counted=await page.evaluate(live,{bursts,gap,count:true});entry.canvas=Object.fromEntries(Object.entries(counted.calls).map(([call,total])=>[`${call}PerFrame`,round(total/counted.callbacks,2)]));}
   return entry;
  };
  const rasteriser=await page.evaluate(()=>{const gl=document.createElement('canvas').getContext('webgl'),names=gl?.getExtension('WEBGL_debug_renderer_info');return gl?String(gl.getParameter(names?names.UNMASKED_RENDERER_WEBGL:gl.RENDERER)):'unknown';});
  report.environment={chromium:browser.version(),rasteriser,viewport,deviceScaleFactor,canvasPixels:[viewport.width*deviceScaleFactor,viewport.height*deviceScaleFactor],node:process.version,platform:`${process.platform} ${process.arch}`};
  for(const name of Object.keys(scenarios))report.unthrottled[name]=await scenario(name,true);
  process.stderr.write('twenty in a row\n');
  const domBefore=await client.send('Memory.getDOMCounters'),residentBefore=await resident(),row=await measured(inARow),domAfter=await client.send('Memory.getDOMCounters'),residentAfter=await resident();
  report.twentyInARow={bursts:row.result.bursts,callbackMeanMsFirstFive:round(row.result.callbackMeanMsFirstFive),callbackMeanMsLastFive:round(row.result.callbackMeanMsLastFive),heapRetainedBytes:row.heapRetainedBytes,domNodesAdded:domAfter.nodes-domBefore.nodes,listenersAdded:domAfter.jsEventListeners-domBefore.jsEventListeners,canvasesAfter:row.result.canvasesAfter,residentMegabytesBefore:residentBefore,residentMegabytesAfter:residentAfter};
  // A second after the last piece: no frame asked for, no timer, no canvas, no resize listener, no script.
  process.stderr.write('idle\n');
  const asked=await page.evaluate(()=>({frames:window.perf.frames,timers:window.perf.timers})),idleBefore=await metrics();await delay(1000);
  const idleAfter=await metrics(),left=await page.evaluate(()=>({frames:window.perf.frames,timers:window.perf.timers,canvases:document.querySelectorAll('canvas').length,resizeListeners:window.perf.resize}));
  report.idleAfterLastPiece={windowMs:1000,framesRequested:left.frames-asked.frames,timersStarted:left.timers-asked.timers,canvases:left.canvases,resizeListeners:left.resizeListeners,scriptMs:round((idleAfter.ScriptDuration-idleBefore.ScriptDuration)*1000),taskMs:round((idleAfter.TaskDuration-idleBefore.TaskDuration)*1000)};
  process.stderr.write('picture\n');report.picture=await page.evaluate(picture);
  await client.send('Emulation.setCPUThrottlingRate',{rate:4});
  for(const name of Object.keys(scenarios))report.throttled4x[name]=await scenario(name,false);
  report.pageErrors=errors;
 }finally{await browser.close();}
}
{
 // Allocation, in a browser of its own whose young generation is too large to be collected during a burst: the JS heap then
 // grows by exactly what was allocated between the forced collection before a burst and the reading after it. The sampling
 // heap profiler is not used: while it runs V8 leaves its fast path into the canvas and boxes every number it passes.
 // The frame code is first run until V8 has optimised it (before that every sum allocates a number), and each burst is
 // flown twice with the second read. The reading includes this script's own bookkeeping, a wrapped frame callback and two
 // lists of times; a burst of one piece has the same bookkeeping, so what a burst allocates beyond that one is what its
 // pieces cost.
 process.stderr.write('allocation\n');
 const {browser,page,metrics,collect}=await open(['--js-flags=--min-semi-space-size=64 --max-semi-space-size=64']);
 try{
  const growth=async({bursts,gap})=>{
   await page.evaluate(live,{bursts,gap,count:false});await collect();
   const before=await metrics(),{frames}=await page.evaluate(live,{bursts,gap,count:false}),after=await metrics();
   return (after.JSHeapUsedSize-before.JSHeapUsedSize)/frames;
  };
  for(const {bursts} of Object.values(scenarios))await page.evaluate(driven,{bursts});
  const one=await growth({bursts:[{...base,particleCount:1}],gap:0});
  for(const [name,{bursts,gap}] of Object.entries(scenarios)){
   const pieces=bursts.reduce((total,burst)=>total+burst.particleCount,0),bytes=await growth({bursts,gap});
   report.unthrottled[name].allocation={heapGrowthBytesPerFrame:Math.round(bytes),withOnePiece:Math.round(one),bytesPerPiecePerFrame:round((bytes-one)/pieces,2)};
  }
 }finally{await browser.close();}
}
console.log(JSON.stringify(report,null,1));
