// Web Avatar in a long list, measured in headless Chromium: what 500 avatars cost to mount, what a parent that renders again
// costs, what one changed seed costs, and whether a scroll drops frames. Run after `node scripts/build.mjs`:
//   node scripts/perf/avatar-web.mjs            prints one JSON object (progress goes to stderr)
//   HIG_PERF_RUNS=9 node scripts/perf/avatar-web.mjs   more runs per figure (default 5; every figure is the median)
//   HIG_PERF_KINDS=none,beam HIG_PERF_RATES=1 HIG_PERF_SCROLLS=0 ...   a quicker pass over some rows, one CPU rate, no scroll
//   HIG_PERF_STAT=min ...   the fastest run of each figure in place of the median: the nearest to a quiet machine when this one is busy
//   HIG_PERF_AVATAR=./path/to/variant.tsx ...   another module that exports Avatar, in place of the one in the package
//   HIG_PERF_AGAINST=./path/to/before.tsx ...   also measures that module, its runs taken in turn with the others, and prints it under `against`:
//                                              a before and after from one run, which a machine that is busy with other work does not skew
//   HIG_PERF_RENDERER=native ...   the React Native Avatar, drawn by react-native-web and react-native-svg's web build
// Times come from CDP `Performance.getMetrics` (ScriptDuration, TaskDuration, LayoutDuration, RecalcStyleDuration), read
// before and after each step in the thread's own CPU time (`timeDomain: threadTicks`), so they are main-thread work: not
// time spent waiting for a frame, and not time the thread was set aside for another process. Everything runs once
// unthrottled and once with the CPU throttled 4x. Two bundles are driven: `timing` is the production build with nothing
// added; `counting` wraps the shared model to count generator calls and Avatar renders and runs React's profiling build so
// `React.Profiler` reports render time. Headless Chromium rasterises on the CPU, so the scroll figures say whether the
// main thread keeps up, not what a phone's GPU does. The `native` renderer is the same component code in a browser: its
// render counts and the JavaScript a re-render costs carry over to a phone; its mount, layout and paint are react-native-web's
// and say nothing about iOS or Android views, so it is not scrolled.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname,resolve} from 'node:path';
import {build} from 'esbuild';
import sharp from 'sharp';
import {chromium} from '@playwright/test';
import {launchBrowser} from '../browser-launcher.mjs';

const require=createRequire(import.meta.url);
const runs=Math.max(1,Number(process.env.HIG_PERF_RUNS)||5),rows=500,renders=50,scrollMs=3000;
const kinds=(process.env.HIG_PERF_KINDS??'none,beam,palette,image,initials').split(','),rates=(process.env.HIG_PERF_RATES??'1,4').split(',').map(Number);
const renderer=process.env.HIG_PERF_RENDERER==='native'?'native':'react',native=renderer==='native';
const component=process.env.HIG_PERF_AVATAR??`./packages/hig/${renderer}/src/avatar`,against=process.env.HIG_PERF_AGAINST,scrolls=native?0:Number(process.env.HIG_PERF_SCROLLS??3);
const css=readFileSync('packages/hig/tokens/generated/tokens.css','utf8')+readFileSync('packages/hig/react/src/styles.css','utf8');
const image=`data:image/png;base64,${(await sharp({create:{width:64,height:64,channels:3,background:{r:230,g:0,b:122}}}).png().toBuffer()).toString('base64')}`;
// The page: a HIGProvider at the root and, under it, a list whose rows are written inline, the way a leaderboard is.
// React's Profiler does not report a render that a context change alone caused (the provider step), which is why the face is counted directly.
// `none` is the same list with an empty 40px box in place of the avatar: subtract it to get what the avatars add.
const source=component=>`import React,{Profiler,useState} from 'react';import {createRoot} from 'react-dom/client';import {flushSync} from 'react-dom';
${native?"import {View,Text} from 'react-native';":''}
import {HIGProvider} from './packages/hig/${renderer}/src/provider';
import {Avatar} from ${JSON.stringify(component)};
const counts=globalThis.counts??={generator:0,avatar:0,face:0};counts.commits=0;counts.renderMs=0;
function random(state){return()=>{state=state+0x6d2b79f5|0;let t=Math.imul(state^state>>>15,1|state);t=t+Math.imul(t^t>>>7,61|t)^t;return (t^t>>>14)>>>0;};}
const next=random(20261117),address=()=>{let text='0x';for(let digit=0;digit<40;digit++)text+='0123456789abcdef'[next()&15];return text;};
const cell={
 none:()=>${native?"<View style={{width:40,height:40}}/>":"<span className='blank'/>"},
 beam:row=><Avatar name={row.name} seed={row.seed} decorative/>,
 // A host palette written inline and a size: a new array and a new style object on every render of the parent.
 palette:row=><Avatar name={row.name} seed={row.seed} size={32} colors={['#00FF00','#00BBFF','#FF14A0','#FFFA00','#C300FF']} decorative/>,
 // The image is named the way a host names it: a string on web, an inline object on native.
 image:row=><Avatar name={row.name} ${native?'source={{uri:window.image}}':'src={window.image}'} decorative/>,
 initials:row=><Avatar name={row.name} decorative/>,
};
let setList,setRoot;
function List(){
 const [list,set]=useState({kind:'none',rows:[]});setList=set;
 return ${native?"<View nativeID='list'>{list.rows.map((row,index)=><View key={index} style={{flexDirection:'row',alignItems:'center',gap:12,height:56}}>{cell[list.kind](row)}<Text>{row.name}</Text></View>)}</View>":"<ul id='list'>{list.rows.map((row,index)=><li key={index}>{cell[list.kind](row)}<span>{row.name}</span></li>)}</ul>"};
}
// One element for the whole run: the provider can render again without the list being handed new props, and the Profiler reports only when something under it rendered.
const list=<Profiler id='list' onRender={(id,phase,actual)=>{counts.commits++;counts.renderMs+=actual;}}><List/></Profiler>;
function Root(){const [,set]=useState(0);setRoot=set;return <HIGProvider>{list}</HIGProvider>;}
createRoot(document.getElementById('root')).render(<Root/>);
const frame=()=>new Promise(requestAnimationFrame);
// The work runs in a task of the page's own (a timer), which is what CDP's ScriptDuration counts; then the images decode and three frames pass, so the style, layout and paint it caused are counted too.
const timed=run=>new Promise(done=>setTimeout(async()=>{const start=performance.now();run();const syncMs=performance.now()-start;await Promise.all([...document.images].map(node=>node.decode().catch(()=>{})));for(let wait=0;wait<3;wait++)await frame();setTimeout(()=>done(syncMs),20);},0));
let observer,writes=0,touched=new Set();
/** Which row of the list a node is in; -1 for the list itself. */
const rowOf=node=>{const list=document.getElementById('list');while(node&&node.parentNode!==list)node=node.parentNode;return node?[...list.children].indexOf(node):-1;};
window.bench={
 mount:(kind,count)=>timed(()=>flushSync(()=>setList({kind,rows:Array.from({length:count},(_,index)=>({name:'Trader '+index,seed:address()}))}))),
 unmount:()=>timed(()=>flushSync(()=>setList({kind:'none',rows:[]}))),
 // The parent renders again with the same rows: every prop of every avatar is identical.
 rerender:times=>timed(()=>{for(let tick=0;tick<times;tick++)flushSync(()=>setList(list=>({...list})));}),
 reseed:index=>timed(()=>flushSync(()=>setList(list=>({...list,rows:list.rows.map((row,at)=>at===index?{...row,seed:address()}:row)})))),
 // The provider renders again; the list is handed nothing new.
 provider:times=>timed(()=>{for(let tick=0;tick<times;tick++)flushSync(()=>setRoot(tick=>tick+1));}),
 watch(){writes=0;touched=new Set();observer=new MutationObserver(records=>{writes+=records.length;for(const record of records)touched.add(rowOf(record.target));});observer.observe(document.getElementById('list'),{attributes:true,childList:true,subtree:true,characterData:true});},
 watched(){for(const record of observer.takeRecords()){writes++;touched.add(rowOf(record.target));}observer.disconnect();return {domWrites:writes,rowsWritten:[...touched]};},
 counts:()=>({...counts}),
 dom(){
  // The avatar is the first thing in its row (for the kind with no avatar, the empty box).
  const avatars=[...document.getElementById('list').children].map(row=>row.firstElementChild),ids=avatars.flatMap(node=>[node,...node.querySelectorAll('*')]).map(node=>node.id).filter(Boolean);
  const total=selector=>avatars.reduce((sum,node)=>sum+node.querySelectorAll(selector).length,0);
  return {avatars:avatars.length,nodesPerAvatar:avatars.length?avatars.reduce((sum,node)=>sum+1+node.querySelectorAll('*').length,0)/avatars.length:0,svgNodesPerAvatar:avatars.length?total('svg,svg *')/avatars.length:0,inlineStylesPerAvatar:avatars.length?avatars.reduce((sum,node)=>sum+(node.hasAttribute('style')?1:0)+node.querySelectorAll('[style]').length,0)/avatars.length:0,ids:ids.length,uniqueIds:new Set(ids).size,masksAndClipPaths:total('mask,clipPath,defs')};
 },
 // The page scrolls to the end and back in a triangle; each interval between two animation frames is one frame.
 scroll:duration=>new Promise(done=>{
  const reach=document.documentElement.scrollHeight-innerHeight,intervals=[];let start,last;
  const step=now=>{
   start??=now;if(last!==undefined)intervals.push(now-last);last=now;
   const part=(now-start)/duration;if(part>=1){done({reach,intervals});return;}
   scrollTo(0,reach*(1-Math.abs(1-2*part)));requestAnimationFrame(step);
  };requestAnimationFrame(step);
 }),
};`;
const alias={react:dirname(require.resolve('react/package.json')),'react-dom':dirname(require.resolve('react-dom/package.json')),...(native?{'react-native':'react-native-web'}:{})};
const model=resolve('packages/hig/contracts/dist/avatar.js'),provider=resolve(`packages/hig/${renderer}/src/provider.tsx`);
/**
 * The renderer's own imports, wrapped. `beamAvatar` is one generated face and `useColors` is called once by every render of the face.
 * A render of the Avatar itself is one call of `avatarSide` on web and one call of `useFills` on native, where the frame reads its fill (and `avatarSide` is read twice).
 */
const counted={name:'counted',setup(bundle){
 bundle.onResolve({filter:/^@bloxwap\/hig\/contracts\/avatar$/},()=>({path:'avatar',namespace:'counted'}));
 bundle.onResolve({filter:/^\.\/provider\.js$/},args=>/(react|native)[\\/]src[\\/]avatar[^\\/]*\.tsx$/.test(args.importer)?{path:'provider',namespace:'counted'}:undefined);
 bundle.onLoad({filter:/.*/,namespace:'counted'},args=>({resolveDir:process.cwd(),loader:'js',contents:args.path==='provider'?`import * as real from ${JSON.stringify(provider)};export * from ${JSON.stringify(provider)};
const counts=globalThis.counts??={generator:0,avatar:0,face:0};
export const useColors=()=>{counts.face++;return real.useColors();};
${native?'export const useFills=()=>{counts.avatar++;return real.useFills();};':''}`:`import * as real from ${JSON.stringify(model)};export * from ${JSON.stringify(model)};
const counts=globalThis.counts??={generator:0,avatar:0,face:0};
export const beamAvatar=(...args)=>{counts.generator++;return real.beamAvatar(...args);};
${native?'':'export const avatarSide=size=>{counts.avatar++;return real.avatarSide(size);};'}`}));
 bundle.onResolve({filter:/^react-dom\/client$/},()=>({path:require.resolve('react-dom/profiling')}));
}};
const bundle=async(component,plugins)=>(await build({stdin:{contents:source(component),resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,format:'iife',platform:'browser',alias,plugins,...(native?{resolveExtensions:['.web.tsx','.web.ts','.web.js','.tsx','.ts','.jsx','.js','.json']}:{}),define:{'process.env.NODE_ENV':'"production"',...(native?{__DEV__:'false',global:'globalThis'}:{})}})).outputFiles[0].text;
// `current` is the module being measured; `against`, when given, is the one it is compared with.
const bundles={current:{timing:await bundle(component,[]),counting:await bundle(component,[counted])},...(against?{against:{timing:await bundle(against,[]),counting:await bundle(against,[counted])}}:{})},names=Object.keys(bundles);
const median=values=>{const sorted=[...values].sort((a,b)=>a-b);return sorted[sorted.length>>1];};
const round=(value,places=2)=>Number(value.toFixed(places));
const stat=process.env.HIG_PERF_STAT==='min'?'min':'median',pick=stat==='min'?values=>Math.min(...values):median;
/** The median (or, with HIG_PERF_STAT=min, the least) of each numeric field across runs. */
const medians=samples=>Object.fromEntries(Object.keys(samples[0]).map(key=>[key,round(pick(samples.map(sample=>sample[key])),key.endsWith('Bytes')?0:2)]));

const browser=await launchBrowser(chromium,{headless:true});
const result={chromium:browser.version(),react:require('react/package.json').version,renderer:native?'native (react-native-web in Chromium, not a device)':'react',component,rows,renders,runs,stat,scrolls,viewport:'800x900@2x',timeDomain:'threadTicks',rates:{},...(against?{against:{component:against,rates:{}}}:{})};
try{
 /** A fresh page with the list mounted empty, its CDP session, and `step`, which runs one bench call and returns the main-thread work it caused. */
 async function open(script,rate){
  const context=await browser.newContext({viewport:{width:800,height:900},deviceScaleFactor:2});
  const page=await context.newPage(),errors=[];page.setDefaultTimeout(60000);page.on('pageerror',error=>{errors.push(error.message);console.error(error.message);});
  await page.setContent(`<!doctype html><html lang="en"><head><style>${css}body{margin:0;background:var(--hig-background);color:var(--hig-text);font-family:system-ui}ul{margin:0;padding:0 16px;list-style:none}li{display:flex;align-items:center;gap:12px;height:56px}.blank{display:inline-block;width:40px;height:40px}</style></head><body><main id="root"></main></body></html>`);
  await page.evaluate(image=>{window.image=image;},image);await page.addScriptTag({content:script});await page.waitForFunction(()=>window.bench&&document.getElementById('list'));
  const client=await context.newCDPSession(page);await client.send('Performance.enable',{timeDomain:'threadTicks'});await client.send('HeapProfiler.enable');
  if(rate>1)await client.send('Emulation.setCPUThrottlingRate',{rate});
  const metrics=async()=>Object.fromEntries((await client.send('Performance.getMetrics')).metrics.map(metric=>[metric.name,metric.value]));
  const step=async(call,args=[],heap=false)=>{
   if(heap)await client.send('HeapProfiler.collectGarbage');
   const before=await metrics(),value=await page.evaluate(([call,args])=>window.bench[call](...args),[call,args]),after=await metrics();
   const work={scriptMs:(after.ScriptDuration-before.ScriptDuration)*1000,layoutMs:(after.LayoutDuration-before.LayoutDuration)*1000,recalcStyleMs:(after.RecalcStyleDuration-before.RecalcStyleDuration)*1000,taskMs:(after.TaskDuration-before.TaskDuration)*1000,layouts:after.LayoutCount-before.LayoutCount,recalcStyles:after.RecalcStyleCount-before.RecalcStyleCount};
   if(typeof value==='number')work.syncMs=value;
   if(heap){await client.send('HeapProfiler.collectGarbage');work.heapBytes=(await metrics()).JSHeapUsedSize-before.JSHeapUsedSize;}
   return {work,value};
  };
  return {page,step,errors,close:()=>context.close()};
 }
 for(const rate of rates){
  const figures=result.rates[`${rate}x`]={},every={current:figures,...(against?{against:result.against.rates[`${rate}x`]={}}:{})};
  for(const kind of kinds){
   const samples=Object.fromEntries(names.map(name=>[name,{mount:[],rerender:[],reseed:[],provider:[],remount:[]}])),dom={};
   // The modules take their runs in turn, and the one that goes first alternates, so neither gets the quieter half of the run.
   for(let run=0;run<runs;run++)for(const name of run%2?[...names].reverse():names){
    const {page,step,errors,close}=await open(bundles[name].timing,rate),taken=samples[name];
    try{
     taken.mount.push((await step('mount',[kind,rows],true)).work);
     dom[name]=await page.evaluate(()=>window.bench.dom());
     // The same mount again in the same page, with the code it runs already compiled once: what a list costs after the first one.
     await step('unmount');taken.remount.push((await step('mount',[kind,rows])).work);
     taken.rerender.push((await step('rerender',[renders])).work);
     taken.reseed.push((await step('reseed',[rows>>1])).work);
     taken.provider.push((await step('provider',[renders])).work);
     assert.deepEqual(errors,[]);
    }finally{await close();}
   }
   for(const name of names){
    const taken=samples[name],mount=medians(taken.mount);
    every[name][kind]={dom:dom[name],mount:{...mount,heapBytesPerRow:Math.round(mount.heapBytes/rows)},remount:medians(taken.remount),[`rerender${renders}`]:medians(taken.rerender),reseedOne:medians(taken.reseed),[`provider${renders}`]:medians(taken.provider)};
    console.error(`${rate}x ${kind}${names.length>1?` (${name})`:''}: mount ${mount.scriptMs}ms script, ${mount.taskMs}ms task; ${renders} re-renders ${every[name][kind][`rerender${renders}`].scriptMs}ms`);
   }
  }
  // Counts do not depend on the CPU rate; the Profiler's render time does, so the counting bundle runs at both.
  for(const kind of kinds)for(const name of names){
   const {page,step,errors,close}=await open(bundles[name].counting,rate);
   try{
    const counts=()=>page.evaluate(()=>window.bench.counts());
    const counted=async(call,args)=>{const before=await counts();await page.evaluate(()=>window.bench.watch());await step(call,args);const writes=await page.evaluate(()=>window.bench.watched()),after=await counts();return {generatorCalls:after.generator-before.generator,avatarRenders:after.avatar-before.avatar,faceRenders:after.face-before.face,profilerCommits:after.commits-before.commits,profilerRenderMs:round(after.renderMs-before.renderMs),...writes};};
    const mount=await counted('mount',[kind,rows]),rerender=await counted('rerender',[renders]),reseed=await counted('reseed',[rows>>1]),provider=await counted('provider',[renders]);
    // The instrumentation is only as good as its assumption that Avatar reads its size once a render.
    if(kind!=='none')assert.equal(mount.avatarRenders,rows,`${kind}: one Avatar render per row on mount (the count is taken from ${native?'useFills':'avatarSide'})`);
    if(kind==='beam'||kind==='palette'){assert.equal(mount.faceRenders,rows,`${kind}: one face render per row on mount (the count is taken from useColors)`);assert.equal(mount.generatorCalls,rows,`${kind}: one generated face per row on mount`);}
    delete mount.rowsWritten;every[name][kind].counts={mount,[`rerender${renders}`]:rerender,reseedOne:reseed,[`provider${renders}`]:provider};
    assert.deepEqual(errors,[]);
   }finally{await close();}
  }
  if(scrolls>0)figures.scroll={};
  for(const kind of scrolls>0?kinds.filter(kind=>kind!=='palette'):[]){
   // Every scroll is a fresh page. The late frames of all of them are added up, so one bad frame in any run shows.
   const all=[],work=[];let distancePx;
   for(let run=0;run<scrolls;run++){
    const {step,errors,close}=await open(bundles.current.timing,rate);
    try{
     await step('mount',[kind,rows]);
     const scrolled=await step('scroll',[scrollMs]);distancePx=scrolled.value.reach*2;all.push(...scrolled.value.intervals);work.push(scrolled.work);
     assert.deepEqual(errors,[]);
    }finally{await close();}
   }
   const sorted=[...all].sort((a,b)=>a-b),{scriptMs,taskMs}=medians(work);
   // A frame at 60 Hz is 16.7 ms and the intervals jitter by a fraction of a millisecond around it, so a frame is late past 17.7 ms (a missed refresh) and very late past 33.4 ms (two).
   figures.scroll[kind]={distancePx,frames:all.length,over16_7ms:all.filter(value=>value>17.7).length,over33ms:all.filter(value=>value>33.4).length,medianMs:round(sorted[sorted.length>>1]),p95Ms:round(sorted[Math.floor(sorted.length*0.95)]),maxMs:round(sorted[sorted.length-1]),scriptMsPerScroll:scriptMs,taskMsPerScroll:taskMs};
   console.error(`${rate}x scroll ${kind}: ${JSON.stringify(figures.scroll[kind])}`);
  }
 }
}finally{await browser.close();}
console.log(JSON.stringify(result,null,1));
