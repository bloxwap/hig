// NumberFlow under load, in headless Chromium: what a change costs the main thread. The page is
// bundled from source the way scripts/number-flow-browser-smoke.mjs bundles its page (React's profiling build, so
// React.Profiler counts commits in a production bundle). Chromium's own counters are read over a CDP session
// (Performance.getMetrics) around each scenario and the page records its requestAnimationFrame intervals.
//
//   node scripts/perf/number-flow-web.mjs                    every scenario, both motions, unthrottled and at 4x CPU throttle
//   node scripts/perf/number-flow-web.mjs --production       ordinary React DOM for user-facing timing; React commit counts are unavailable
//   node scripts/perf/number-flow-web.mjs --runs=5           the median of five runs of each (default 3)
//   node scripts/perf/number-flow-web.mjs --motion=flow      one motion (flow, slide)
//   node scripts/perf/number-flow-web.mjs --quiet-page       tickers, unchanged and roll without the frame recorder. Its
//                                                            requestAnimationFrame loop makes the page draw a main-thread frame at
//                                                            every refresh, as a busy page does; without it the main thread only
//                                                            does what the figures ask of it, and no frames are reported
//   node scripts/perf/number-flow-web.mjs --warm             runs each scenario once before the run that is measured, so heap
//                                                            growth is what a second run keeps, not what the first one compiled
//   node scripts/perf/number-flow-web.mjs --only=tickers     chosen scenarios (tickers, interrupt, mount, unchanged, roll)
//   node scripts/perf/number-flow-web.mjs --stat=min         the fastest run of each instead of the median: on a busy machine
//                                                            other work only ever adds time, so the least is the truest
//   node scripts/perf/number-flow-web.mjs --against=.local/base/packages/hig/react/src
//                                                            also measures another copy of the React sources (an older
//                                                            checkout, say), run about with the current one so both see the
//                                                            same machine, and prints it under "against"
//   node scripts/perf/number-flow-web.mjs --profile=tickers:flow[:4]   the functions with the most self time in one scenario
//   node scripts/perf/number-flow-web.mjs --trace=tickers:flow[:4]     main-thread self time by Chromium timeline event (style, layout, paint...)
//
// Scenarios, each for motion='flow' and motion='slide':
//   tickers    40 figures in mixed currency and percent formats, each given a new random-walk value every 100 ms for 5 s
//   interrupt  one figure given a new value every animation frame for 3 s, so every change interrupts the one before
//   mount      200 figures mounted and unmounted, five times
//   unchanged  the 40 figures re-rendered by their parent 50 times with the values they already show
//   roll       the 40 figures given one new value and watched for 1.5 s: what the motion costs after the commit that starts it
// An "update" is one value handed to one figure; a "tick" is one state change of the parent (40 updates in tickers).
// A frame "over 16.7 ms" missed at least one 60 Hz refresh and one "over 33 ms" at least two; both allow 1 ms of timer jitter.
// Prints one JSON object. Numbers are from this machine's headless Chromium: compare runs of this script, not devices.
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {relative,resolve} from 'node:path';
import {launchBrowser} from '../browser-launcher.mjs';
const root=fileURLToPath(new URL('../..',import.meta.url));
const require=createRequire(`${root}/package.json`);
const {build}=require('esbuild');const {chromium}=require('@playwright/test');
const flag=name=>process.argv.find(argument=>argument.startsWith(`--${name}=`))?.slice(name.length+3);
const runs=Math.max(1,Number(flag('runs'))||3),only=flag('only')?.split(','),profile=flag('profile')?.split(':'),trace=flag('trace')?.split(':'),least=flag('stat')==='min',against=flag('against'),motions=flag('motion')?.split(',')??['flow','slide'],quiet=process.argv.includes('--quiet-page'),warm=process.argv.includes('--warm');
const production=process.argv.includes('--production');
const pageSource=sources=>`import React,{Profiler,useState} from 'react';import {createRoot} from '${production?'react-dom/client':'react-dom/profiling'}';import {flushSync} from 'react-dom';
import {HIGProvider} from './${sources}/provider';import {NumberFlow} from './${sources}/animated-number';
const usd={style:'currency',currency:'USD',minimumFractionDigits:2,maximumFractionDigits:2};
// The first currency crosses 1,000 and the first percentage crosses zero, so figures gain and lose places and signs as well as roll.
const formats=[{options:usd,start:997.25,step:2.5},{options:{style:'percent',minimumFractionDigits:2,maximumFractionDigits:2,signDisplay:'exceptZero'},start:0.0042,step:0.006},{options:usd,start:64250.1,step:180},{options:{style:'percent',maximumFractionDigits:1},start:0.482,step:0.02}];
let commits=0,setBoard=()=>{};
function Harness(){const [board,set]=useState({motion:'flow',values:[]});setBoard=set;
 return <HIGProvider><div id='board'>{board.values.map((value,index)=><span className='cell' key={index}><NumberFlow motion={board.motion} value={value} options={formats[index%formats.length].options}/></span>)}</div></HIGProvider>;}
createRoot(document.getElementById('root')).render(<Profiler id='perf' onRender={()=>{commits++;}}><Harness/></Profiler>);
const random=seed=>()=>{seed=(seed+0x6d2b79f5)|0;let t=Math.imul(seed^(seed>>>15),1|seed);t=(t+Math.imul(t^(t>>>7),61|t))^t;return ((t^(t>>>14))>>>0)/4294967296;};
const frame=()=>new Promise(done=>requestAnimationFrame(done)),wait=ms=>new Promise(done=>setTimeout(done,ms)),until=time=>wait(Math.max(0,time-performance.now()));
// A live collection: its length is recounted after a mutation without style or layout, so sampling it does not disturb the counters.
const elements=document.getElementById('root').getElementsByTagName('*'),nodes=()=>elements.length-1;
const median=list=>{const sorted=[...list].sort((a,b)=>a-b);return sorted.length?sorted[Math.floor(sorted.length/2)]:0;};
const frames=stamps=>{const gaps=stamps.slice(1).map((stamp,index)=>stamp-stamps[index]);return {frames:gaps.length,framesNear120Hz:gaps.filter(gap=>Math.abs(gap-1000/120)<=0.5).length,framesOver16_7ms:gaps.filter(gap=>gap>17.7).length,framesOver33ms:gaps.filter(gap=>gap>34.4).length,worstFrameMs:Math.max(0,...gaps),medianFrameMs:median(gaps)};};
const starts=count=>Array.from({length:count},(_,index)=>formats[index%formats.length].start*(1+Math.floor(index/formats.length)*0.01));
const leftovers=()=>({animations:document.getAnimations().length,nodes:document.querySelectorAll('.hig-number-flow-window,.hig-number-flow-ghost,[data-spinning],.hig-animated-number-old').length});
let job={scenario:'',motion:'flow',values:[],next:random(1),quiet:false};
const walk=()=>{job.values=job.values.map((value,index)=>value+(job.next()*2-1)*formats[index%formats.length].step);return job.values;};
window.higPerf={
 started:'hig-perf-run',
 async prepare(scenario,motion,quiet=false){
  job={scenario,motion,quiet,values:scenario==='mount'?[]:starts(scenario==='interrupt'?1:40),next:random(20260117)};
  flushSync(()=>setBoard({motion,values:job.values}));await wait(300);return true;
 },
 async run(){
  // A mark in the timeline, so a trace can be cut to the scenario.
  console.timeStamp(window.higPerf.started);
  const {scenario,motion}=job,instances=job.values.length,rest=instances?nodes()/instances:0,first=commits,began=performance.now();
  if(scenario==='tickers'||scenario==='unchanged'||scenario==='roll'){
   const stamps=[];let recording=true;const loop=now=>{if(!recording)return;stamps.push(now);requestAnimationFrame(loop);};if(!job.quiet)requestAnimationFrame(loop);
   let peak=0,total=0;const ticks=scenario==='roll'?1:50;
   for(let tick=0;tick<ticks;tick++){await until(began+tick*100);setBoard({motion,values:scenario==='unchanged'?[...job.values]:walk()});await until(began+tick*100+50);const count=nodes();peak=Math.max(peak,count);total+=count;}
   // Let what is in flight land, so its clean-up (and any commit it makes) is inside the measurement. A single roll is watched until it lands.
   await until(began+ticks*100);if(scenario!=='roll')recording=false;const elapsedMs=scenario==='roll'?1500:performance.now()-began;
   await wait(scenario==='roll'?1400:1500);recording=false;
   return {ticks,instances,updates:ticks*instances,elapsedMs,...frames(stamps),commits:commits-first,domNodesPerInstance:{rest,midRoll:total/ticks/instances,midRollPeak:peak/instances}};
  }
  if(scenario==='interrupt'){
   const stamps=[];let peak=0,total=0,updates=0;
   for(let now=await frame();now-stamps[0]<3000||!stamps.length;now=await frame()){stamps.push(now);if(updates){const count=nodes();peak=Math.max(peak,count);total+=count;}job.values=[job.values[0]+(job.next()*2-1)*7.5];setBoard({motion,values:job.values});updates++;}
   const elapsedMs=performance.now()-began;await wait(1500);
   return {ticks:updates,instances,updates,elapsedMs,...frames(stamps),commits:commits-first,domNodesPerInstance:{rest,midRoll:total/Math.max(1,updates-1),midRollPeak:peak}};
  }
  const cycles=5,count=200,values=starts(count),mount=[],painted=[],unmount=[];let mounted=0;
  for(let cycle=0;cycle<cycles;cycle++){
   const start=performance.now();flushSync(()=>setBoard({motion,values}));mount.push(performance.now()-start);await frame();await frame();painted.push(performance.now()-start);mounted=nodes()/count;
   const end=performance.now();flushSync(()=>setBoard({motion,values:[]}));unmount.push(performance.now()-end);await frame();
  }
  return {ticks:cycles*2,instances:count,updates:cycles*count,elapsedMs:performance.now()-began,commits:commits-first,mountMs:median(mount),mountToSecondFrameMs:median(painted),unmountMs:median(unmount),domNodesPerInstance:{rest:mounted,afterUnmount:nodes()}};
 },
 // After the counters are read: what is left when everything has landed, then one more change to count what a single roll adds.
 async probe(){
  const instances=job.values.length;if(!instances)return {atRest:leftovers()};
  const atRest=leftovers(),rest=nodes()/instances;flushSync(()=>setBoard({motion:job.motion,values:walk()}));await frame();
  const midRoll={animations:document.getAnimations().length/instances,domNodesPerInstance:nodes()/instances};await wait(1500);
  return {atRest,restDomNodesPerInstance:rest,oneChange:midRoll,afterOneChange:leftovers()};
 }};`;
const bundled=async sources=>(await build({stdin:{contents:pageSource(sources),resolveDir:root,loader:'tsx'},bundle:true,write:false,format:'iife',platform:'browser',define:{'process.env.NODE_ENV':'"production"'}})).outputFiles[0].text;
// The other copy has to sit inside this checkout, where its imports resolve to the same React and the same built contracts.
const bundles={current:await bundled('packages/hig/react/src'),...(against?{against:await bundled(relative(root,resolve(against)).split('\\').join('/'))}:null)};
const css=readFileSync(`${root}/packages/hig/tokens/dist/tokens.css`,'utf8')+readFileSync(`${root}/packages/hig/react/src/styles.css`,'utf8')+'body{margin:24px;background:var(--hig-background);color:var(--hig-text);font-family:system-ui;font-size:20px}#board{display:flex;flex-wrap:wrap;gap:8px 24px}.cell{display:inline-block;min-width:140px}';
const html=`<html><head><style>${css}</style></head><body><div id='root'></div></body></html>`;
const counters=async cdp=>Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(metric=>[metric.name,metric.value]));
const round=value=>typeof value==='number'?Math.round(value*1000)/1000:value;
async function measure(browser,bundle,scenario,motion,rate,inspect=''){
 const profiled=inspect==='profile',traced=inspect==='trace';
 const page=await browser.newPage({viewport:{width:1280,height:900}});const errors=[];page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.setContent(html);await page.addScriptTag({content:bundle});
  const cdp=await page.context().newCDPSession(page);await cdp.send('Performance.enable');await cdp.send('HeapProfiler.enable');
  if(rate>1)await cdp.send('Emulation.setCPUThrottlingRate',{rate});
  await page.evaluate(([scenario,motion,quiet])=>window.higPerf.prepare(scenario,motion,quiet),[scenario,motion,quiet]);
  if(traced)await browser.startTracing(page,{categories:['devtools.timeline','disabled-by-default-devtools.timeline']});
  if(warm){await page.evaluate(()=>window.higPerf.run());await page.evaluate(([scenario,motion,quiet])=>window.higPerf.prepare(scenario,motion,quiet),[scenario,motion,quiet]);await page.waitForTimeout(1500);}
  if(profiled){await cdp.send('Profiler.enable');await cdp.send('Profiler.setSamplingInterval',{interval:100});await cdp.send('Profiler.start');}
  await cdp.send('HeapProfiler.collectGarbage');const before=await counters(cdp);
  const ran=await page.evaluate(()=>window.higPerf.run());
  const after=await counters(cdp);
  if(profiled)return {top:selfTimes((await cdp.send('Profiler.stop')).profile)};
  if(traced)return {ticks:ran.ticks,mainThreadMs:timeline(JSON.parse((await browser.stopTracing()).toString()),await page.evaluate(()=>window.higPerf.started))};
  await cdp.send('HeapProfiler.collectGarbage');const settled=await counters(cdp);
  const probe=await page.evaluate(()=>window.higPerf.probe());
  if(errors.length)throw new Error(`${scenario} ${motion}: ${errors.join('; ')}`);
  const delta=name=>after[name]-before[name],per=(value,count)=>count?value/count:0,{updates,ticks,commits,...rest}=ran;
  return {...rest,ticks,updates,commits:production?null:commits,
   scriptMsPerUpdate:per(delta('ScriptDuration')*1000,updates),taskMsPerUpdate:per(delta('TaskDuration')*1000,updates),layoutsPerUpdate:per(delta('LayoutCount'),updates),styleRecalcsPerUpdate:per(delta('RecalcStyleCount'),updates),commitsPerUpdate:production?null:per(commits,updates),
   perTick:{scriptMs:per(delta('ScriptDuration')*1000,ticks),taskMs:per(delta('TaskDuration')*1000,ticks),layoutMs:per(delta('LayoutDuration')*1000,ticks),styleMs:per(delta('RecalcStyleDuration')*1000,ticks),layouts:per(delta('LayoutCount'),ticks),styleRecalcs:per(delta('RecalcStyleCount'),ticks),commits:production?null:per(commits,ticks)},
   totals:{scriptMs:delta('ScriptDuration')*1000,taskMs:delta('TaskDuration')*1000,layoutMs:delta('LayoutDuration')*1000,styleMs:delta('RecalcStyleDuration')*1000,layouts:delta('LayoutCount'),styleRecalcs:delta('RecalcStyleCount')},
   heapGrowthKB:(settled.JSHeapUsedSize-before.JSHeapUsedSize)/1024,...probe};
 }finally{await page.close();}
}
/** The functions of a CPU profile with the most self time, in milliseconds. */
function selfTimes(cpu){
 const self=new Map(),byId=new Map(cpu.nodes.map(node=>[node.id,node]));
 cpu.samples.forEach((id,index)=>{const {functionName,lineNumber}=byId.get(id).callFrame,name=functionName?`${functionName}${lineNumber>=0?`:${lineNumber+1}`:''}`:`(anonymous):${lineNumber+1}`;self.set(name,(self.get(name)??0)+(cpu.timeDeltas[index]??0)/1000);});
 return Array.from(self,([name,ms])=>({name,ms:round(ms)})).filter(entry=>!/^\((?:idle|program|root)\)$/.test(entry.name)).sort((a,b)=>b.ms-a.ms).slice(0,40);
}
/** Self time on the renderer's main thread by timeline event, in milliseconds, from the moment the scenario started. */
function timeline(trace,started){
 const events=trace.traceEvents??trace,main=events.find(event=>event.name==='thread_name'&&event.args?.name==='CrRendererMain'),mark=events.find(event=>event.name==='TimeStamp'&&event.args?.data?.message===started)?.ts??0;
 const slices=events.filter(event=>event.ph==='X'&&event.pid===main?.pid&&event.tid===main?.tid&&event.ts>=mark).sort((a,b)=>a.ts-b.ts||b.dur-a.dur),self=new Map(),stack=[];
 const close=slice=>self.set(slice.name,(self.get(slice.name)??0)+(slice.dur-slice.children)/1000);
 for(const slice of slices){slice.children=0;while(stack.length&&stack[stack.length-1].ts+stack[stack.length-1].dur<=slice.ts)close(stack.pop());if(stack.length)stack[stack.length-1].children+=slice.dur;stack.push(slice);}
 while(stack.length)close(stack.pop());
 return Object.fromEntries(Array.from(self).sort((a,b)=>b[1]-a[1]).slice(0,24).map(([name,ms])=>[name,round(ms)]));
}
/** The median (or with --stat=min the least) of each number across runs, field by field. */
function summary(results){
 const [first]=results;if(typeof first==='number'){const sorted=results.slice().sort((a,b)=>a-b);return round(sorted[least?0:Math.floor(sorted.length/2)]);}
 if(first&&typeof first==='object')return Object.fromEntries(Object.keys(first).map(key=>[key,summary(results.map(result=>result[key]))]));
 return first;
}
const browser=await launchBrowser(chromium,{headless:true});
try{
 if(profile||trace){const [scenario,motion='flow',rate='1']=profile??trace;console.log(JSON.stringify({scenario,motion,cpuThrottle:Number(rate),reactBuild:production?'production':'profiling',...(await measure(browser,bundles.current,scenario,motion,Number(rate),profile?'profile':'trace'))},null,1));}
 else{
  const result={checkedAt:new Date().toISOString(),chromium:browser.version(),reactBuild:production?'production':'profiling',runs,quietPage:quiet,note:`${least?'least':'median'} of runs; an update is one value handed to one figure, a tick one state change of the parent`,cpuThrottle1x:{},cpuThrottle4x:{},...(against?{against:{sources:against,cpuThrottle1x:{},cpuThrottle4x:{}}}:null)};
  for(const [name,rate] of [['cpuThrottle1x',1],['cpuThrottle4x',4]])for(const motion of motions){
   result[name][motion]={};if(against)result.against[name][motion]={};
   for(const scenario of ['tickers','interrupt','mount','unchanged','roll']){
    if(only&&!only.includes(scenario))continue;
    const samples={current:[],against:[]};for(let run=0;run<runs;run++)for(const [variant,bundle] of Object.entries(bundles))samples[variant].push(await measure(browser,bundle,scenario,motion,rate));
    result[name][motion][scenario]=summary(samples.current);if(against)result.against[name][motion][scenario]=summary(samples.against);
   }
  }
  console.log(JSON.stringify(result,null,1));
 }
}finally{await browser.close();}
