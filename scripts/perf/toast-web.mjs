// Web toast benchmark: what one `toast()` costs in a real engine, and whether it touches anything but Sonner's own list.
// Run after `node scripts/build.mjs`: node scripts/perf/toast-web.mjs. Prints one JSON object; progress goes to stderr.
// The page holds a HIGProvider, the Toaster in a React.Profiler and, beside it, 500 unrelated rows in another, so a commit
// of the rows is a re-render a toast caused outside its host. Two hosts run the same scenarios: `hig` is `Toaster` and
// `toast()` from @bloxwap/hig/react/toast, and `sonner` is the least a host could write by hand over Sonner (its Toaster
// with the same figures and `toast.custom` drawing the same capsule), so the difference is what HIG's wrapper adds.
// Each runs unthrottled and with the CPU slowed 4x. HIG_PERF_HOSTS=hig and HIG_PERF_RATES=1 narrow a run.
// To find where a cost comes from: HIG_PERF_ROWS=5000 grows the page beside the toasts (a cost that does not grow with it
// stays inside the host), HIG_PERF_BURST=10 changes how many notices the first scenario raises (Sonner keeps every one
// mounted), and HIG_PERF_NOCSS=1 leaves out HIG's stylesheet (the capsules are then unstyled, so only its share of the
// style time compares).
// Frame intervals are headless Chromium's on this machine: read them against each other, not as a device's frame rate.
// The counts (commits, layouts, style recalculations, renders, elements) repeat exactly from run to run. The milliseconds
// vary by about a tenth on a quiet machine and far more on a busy one, so compare them only between runs made together.
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {launchBrowser} from '../browser-launcher.mjs';
const root=fileURLToPath(new URL('../..',import.meta.url));
const require=createRequire(`${root}/package.json`);
const {build}=require('esbuild');const {chromium}=require('@playwright/test');
const rows=Number(process.env.HIG_PERF_ROWS??500),burst=Number(process.env.HIG_PERF_BURST??30),nocss=process.env.HIG_PERF_NOCSS==='1';
const hosts=(process.env.HIG_PERF_HOSTS??'hig,sonner').split(','),rates=(process.env.HIG_PERF_RATES??'1,4').split(',').map(Number);
const source=`import React,{Profiler} from 'react';import {createRoot} from 'react-dom/client';
import {Toaster as SonnerToaster,toast as sonner} from 'sonner';
import * as en from '@bloxwap/hig/contracts/messages';
import {HIGProvider} from './packages/hig/react/src/provider';
import {Toaster,toast,dismissToast} from './packages/hig/react/src/toast';
import {ToastNotice} from './packages/hig/react/src/status';
const hig=window.benchHost==='hig';
const count={toaster:0,rows:0,toasterMs:0,capsules:0};
const onRender=(id,phase,actual)=>{count[id]++;if(id==='toaster')count.toasterMs+=actual;};
// Every draw of a HIG capsule asks the provider for the close control's name, so this counts them.
const messages={dismissNotice:(message,dismiss)=>{count.capsules++;return en.dismissNotice(message,dismiss);}};
function Bare({message,severity,onClose}){count.capsules++;return <ToastNotice message={message} severity={severity??'info'} dismissName={'Dismiss '+message} onDismiss={onClose}/>;}
function Rows(){return <ul id='rows'>{Array.from({length:window.benchRows},(_,index)=><li key={index}><span>Row {index}</span> <button type='button'>Open</button></li>)}</ul>;}
function App(){return <HIGProvider messages={hig?messages:undefined}>
 <Profiler id='rows' onRender={onRender}><Rows/></Profiler>
 <Profiler id='toaster' onRender={onRender}>{hig?<Toaster/>:<SonnerToaster position='bottom-center' theme='dark' visibleToasts={3} gap={14} duration={4000}/>}</Profiler>
</HIGProvider>;}
const sleep=ms=>new Promise(done=>setTimeout(done,ms));
let stamps=null;const tick=now=>{if(stamps===null)return;stamps.push(now);requestAnimationFrame(tick);};
window.bench={count,sleep,
 raise:hig?toast:(message,options={})=>sonner.custom(id=><Bare message={message} severity={options.severity} onClose={()=>sonner.dismiss(id)}/>,{id:options.id,duration:options.duration}),
 dismiss:hig?dismissToast:id=>sonner.dismiss(id),
 reset(){count.toaster=count.rows=count.toasterMs=count.capsules=0;},
 record(){stamps=[];requestAnimationFrame(tick);},
 stop(){const all=stamps;stamps=null;return all.slice(1).map((stamp,index)=>stamp-all[index]);},
 /** Calls \`call\` \`times\` times, \`gap\` ms apart on a fixed schedule, so a slow call does not push the later ones back. */
 async paced(times,gap,call){const start=performance.now();for(let index=0;index<times;index++){const wait=start+index*gap-performance.now();if(wait>0)await sleep(wait);call(index);}},
 kept:()=>({history:sonner.getHistory().length,active:sonner.getToasts().length}),
 shown:()=>document.querySelectorAll('[data-sonner-toast]').length,
 elements:()=>document.getElementsByTagName('*').length};
createRoot(document.getElementById('root')).render(<App/>);`;
// The profiling build of react-dom reports to React.Profiler in production mode; the plain production build does not.
const bundle=await build({stdin:{contents:source,resolveDir:root,loader:'tsx'},bundle:true,write:false,format:'iife',platform:'browser',alias:{'react-dom/client':'react-dom/profiling'},define:{'process.env.NODE_ENV':'"production"'}});
const css=readFileSync(`${root}/packages/hig/tokens/dist/tokens.css`,'utf8')+(nocss?'':readFileSync(`${root}/packages/hig/react/src/styles.css`,'utf8'))+'body{margin:24px;background:var(--hig-background);color:var(--hig-text);font-family:system-ui}';
// Timers still waiting to fire, counted by wrapping the page's own setTimeout before anything else runs.
const timers=`(()=>{const pending=new Set(),set=window.setTimeout,clear=window.clearTimeout;window.setTimeout=(run,delay,...rest)=>{const id=set(()=>{pending.delete(id);run(...rest);},delay);pending.add(id);return id;};window.clearTimeout=id=>{pending.delete(id);clear(id);};window.pendingTimers=()=>pending.size;})();`;
const severities=['info','success','warning','error'];
const round=(value,places=2)=>Math.round(value*10**places)/10**places;
const result={checkedAt:new Date().toISOString(),rows,stylesheet:!nocss,note:'Frame intervals are headless Chromium on this machine, not a device. Per-toast figures are the CDP Performance.getMetrics delta over the scenario divided by its toast() or dismissal count.',runs:{}};
const browser=await launchBrowser(chromium,{headless:true});
result.chromium=browser.version();
try{
 for(const host of hosts)for(const rate of rates){
  const page=await browser.newPage({viewport:{width:1280,height:800}});const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.setContent(`<html><head><style>${css}</style><script>window.benchHost=${JSON.stringify(host)};window.benchRows=${rows};${timers}</script></head><body><div id='root'></div></body></html>`);
  await page.addScriptTag({content:bundle.outputFiles[0].text});await page.locator('#rows').waitFor();
  const cdp=await page.context().newCDPSession(page);await cdp.send('Performance.enable');await cdp.send('HeapProfiler.enable');await cdp.send('Emulation.setCPUThrottlingRate',{rate});
  const metrics=async()=>Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(metric=>[metric.name,metric.value]));
  /** Nothing showing, garbage collected: what is in the page at rest. */
  const rest=async()=>{await page.evaluate(()=>window.bench.dismiss());await page.waitForFunction(()=>window.bench.shown()===0,null,{timeout:60000});await page.waitForTimeout(400);await cdp.send('HeapProfiler.collectGarbage');await cdp.send('HeapProfiler.collectGarbage');
   const now=await metrics();return {elements:await page.evaluate(()=>window.bench.elements()),nodes:now.Nodes,listeners:now.JSEventListeners,timers:await page.evaluate(()=>window.pendingTimers()),heapKB:round(now.JSHeapUsedSize/1024,0)};};
  /** One measured window: `run` is evaluated in the page between `record` and `stop`, and its cost is divided by `calls`. */
  const measure=async(calls,run,argument)=>{
   await page.evaluate(()=>window.bench.reset());const before=await metrics();
   const gaps=await page.evaluate(async([body,argument])=>{window.bench.record();await new Function('bench','argument',`return (${body})(bench,argument);`)(window.bench,argument);return window.bench.stop();},[run.toString(),argument]);
   const after=await metrics(),count=await page.evaluate(()=>({...window.bench.count}));
   const per=name=>(after[name]-before[name])/calls;
   return {calls,frames:gaps.length,over16_7:gaps.filter(gap=>gap>16.7).length,over20:gaps.filter(gap=>gap>20).length,over33:gaps.filter(gap=>gap>33).length,worstFrameMs:round(Math.max(0,...gaps),1),
    scriptMsPerCall:round(per('ScriptDuration')*1000,3),taskMsPerCall:round(per('TaskDuration')*1000,3),layoutMsPerCall:round(per('LayoutDuration')*1000,3),styleMsPerCall:round(per('RecalcStyleDuration')*1000,3),layoutsPerCall:round(per('LayoutCount')),styleRecalcsPerCall:round(per('RecalcStyleCount')),
    toasterCommitsPerCall:round(count.toaster/calls),toasterRenderMsPerCall:round(count.toasterMs/calls,3),capsuleRendersPerCall:round(count.capsules/calls),rowsCommits:count.rows};
  };
  const scenario=async run=>{const start=await rest(),measured=await run(),end=await rest();return {...measured,elementsStart:start.elements,elementsEnd:end.elements,atRest:{start,end}};};
  const run={};process.stderr.write(`${host} at ${rate}x\n`);
  // 1. A burst: 30 notices 50ms apart, then the last entrance (400ms) plays out.
  run[`raise${burst}`]=await scenario(()=>measure(burst,async(bench,[burst,severities])=>{await bench.paced(burst,50,index=>bench.raise(`Notice ${index}`,{severity:severities[index%4]}));await bench.sleep(600);},[burst,severities]));
  // 2. One notice replaced by id 100 times, a frame apart: a progress notice.
  run.replace100=await scenario(async()=>{await page.evaluate(()=>window.bench.raise('Sending',{id:'job',duration:Infinity}));await page.waitForTimeout(600);
   return measure(100,async bench=>{await bench.paced(100,16,index=>bench.raise(`Sending ${index+1}%`,{id:'job',duration:Infinity}));await bench.sleep(600);});});
  // 3. Ten notices up, then all dismissed at once. The dismissal is what is measured.
  run.dismissAll10=await scenario(async()=>{await page.evaluate(async()=>{await window.bench.paced(10,50,index=>window.bench.raise(`Notice ${index}`,{duration:Infinity}));});await page.waitForTimeout(600);
   return measure(10,async bench=>{bench.dismiss();await bench.sleep(800);});});
  // 4. Fifty notices over ten seconds, each leaving by itself after the default four: is anything left behind?
  run.autoDismiss50=await scenario(async()=>{const measured=await measure(50,async bench=>{await bench.paced(50,200,index=>bench.raise(`Notice ${index}`));while(bench.shown()>0)await bench.sleep(100);await bench.sleep(400);});
   return {...measured,sonnerKeeps:await page.evaluate(()=>window.bench.kept())};});
  const {start,end}=run.autoDismiss50.atRest;
  run.autoDismiss50.leftBehind={elements:end.elements-start.elements,nodes:end.nodes-start.nodes,listeners:end.listeners-start.listeners,timers:end.timers-start.timers,heapKB:end.heapKB-start.heapKB};
  // 5. The call alone: 1000 replacements of one id in one task, before Sonner or React do anything about them.
  await page.evaluate(()=>window.bench.raise('Sending',{id:'call',duration:Infinity}));await page.waitForTimeout(600);
  run.callMs=round(await page.evaluate(()=>{const start=performance.now();for(let index=0;index<1000;index++)window.bench.raise('Sending',{id:'call',duration:Infinity});return (performance.now()-start)/1000;}),4);
  await rest();
  if(errors.length)throw new Error(`${host} at ${rate}x: ${errors.join('; ')}`);
  result.runs[`${host}@${rate}x`]=run;await page.close();
 }
}finally{await browser.close();}
console.log(JSON.stringify(result,null,1));
