import React,{Profiler,useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {View} from 'react-native';
import {useFrameCallback,useSharedValue,type FrameInfo} from 'react-native-reanimated';
import {HIGProvider} from '@bloxwap/hig/native/provider';
import {NumberFlow} from '@bloxwap/hig/native/animated-number';
/**
 * Device load for the native NumberFlow, the twin of scripts/perf/number-flow-web.mjs. Mount it and it runs by itself, no touch:
 *  (a) tickers: 40 figures in mixed currency and percent formats, each given a new random-walk value every 100 ms for 5 s;
 *  (b) interrupt: one figure given a new value every animation frame for 3 s, so every change interrupts the one before.
 * It logs `[perf] number-flow start`, one line per scenario and `[perf] number-flow done`. A scenario's line carries the frames
 * the JS thread got (requestAnimationFrame) and the frames the UI thread drew (a Reanimated frame callback), with how many ran
 * longer than 1.5 frames at 60 Hz, the longest gap, intervals within 0.5 ms of 120 Hz, and React's commits. A fresh 40-figure board then measures
 * its first animation independently, followed by ten steady ticks. Commits read 0 in a release build, where React does
 * not profile. The figures move whatever the OS says about reduced motion, so a run always measures motion.
 */
const usd={style:'currency',currency:'USD',minimumFractionDigits:2,maximumFractionDigits:2} as const;
// The first currency crosses 1,000 and the first percentage crosses zero, so figures gain and lose places and signs as well as roll.
const formats:readonly {options:Intl.NumberFormatOptions;start:number;step:number}[]=[{options:usd,start:997.25,step:2.5},{options:{style:'percent',minimumFractionDigits:2,maximumFractionDigits:2,signDisplay:'exceptZero'},start:0.0042,step:0.006},{options:usd,start:64250.1,step:180},{options:{style:'percent',maximumFractionDigits:1},start:0.482,step:0.02}];
const starts=(count:number)=>Array.from({length:count},(_,index)=>formats[index%formats.length].start*(1+Math.floor(index/formats.length)*0.01));
/** The same sequence every run (mulberry32), so two runs give the figures the same values. */
function random(seed:number){return()=>{seed=(seed+0x6d2b79f5)|0;let t=Math.imul(seed^(seed>>>15),1|seed);t=(t+Math.imul(t^(t>>>7),61|t))^t;return ((t^(t>>>14))>>>0)/4294967296;};}
const wait=(ms:number)=>new Promise<void>(done=>setTimeout(done,ms));
const frame=()=>new Promise<number>(done=>requestAnimationFrame(done));
function near120HzInterval(ms:number){
 'worklet';
 return Math.abs(ms-1000/120)<=0.5;
}
const gaps=(stamps:readonly number[])=>{const steps=stamps.slice(1).map((stamp,index)=>stamp-stamps[index]);return `jsFrames=${steps.length} jsSlow=${steps.filter(step=>step>25).length} jsWorstMs=${Math.max(0,...steps).toFixed(1)} jsNear120=${steps.filter(near120HzInterval).length}`;};
/** Counts the frames the UI thread draws between `start` and `stop`. */
function useUIFrames(){
 const frames=useSharedValue(0),slow=useSharedValue(0),worst=useSharedValue(0),near120=useSharedValue(0);
 const record=useCallback((info:FrameInfo)=>{
  'worklet';
  const step=info.timeSincePreviousFrame??0;
  frames.value+=1;if(near120HzInterval(step))near120.value+=1;if(step>25)slow.value+=1;if(step>worst.value)worst.value=step;
 },[frames,near120,slow,worst]);
 const callback=useFrameCallback(record,false);
 return useMemo(()=>({start(){frames.value=0;slow.value=0;worst.value=0;near120.value=0;callback.setActive(true);},stop(){callback.setActive(false);return `uiFrames=${frames.value} uiSlow=${slow.value} uiWorstMs=${worst.value.toFixed(1)} uiNear120=${near120.value}`;}}),[callback,frames,slow,worst,near120]);
}
export default function NumberFlowPerf({onDone}:{onDone?:()=>void}){
 const [boardKey,setBoardKey]=useState(0);
 const [values,setValues]=useState<readonly number[]>(()=>starts(40)),commits=useRef(0),ui=useUIFrames(),done=useRef(onDone);done.current=onDone;
 useEffect(()=>{
  // Unmounting stops the run at its next step.
  const mounted={current:true};
  const run=async()=>{
   // The reels draw once the ten digits are measured; give the first layout time to land.
   await wait(800);if(!mounted.current)return;
   console.log('[perf] number-flow start');
   const next=random(20260117);let board=starts(40),stamps:number[]=[],recording=true;
   const record=(now:number)=>{if(!mounted.current||!recording)return;stamps.push(now);requestAnimationFrame(record);};
   commits.current=0;ui.start();requestAnimationFrame(record);
   const began=Date.now(),ticks=50;
   for(let tick=0;tick<ticks&&mounted.current;tick++){await wait(Math.max(0,began+tick*100-Date.now()));board=board.map((value,index)=>value+(next()*2-1)*formats[index%formats.length].step);setValues(board);}
   await wait(Math.max(0,began+ticks*100-Date.now()));if(!mounted.current)return;recording=false;
   console.log(`[perf] number-flow tickers figures=40 ticks=${ticks} updates=${ticks*40} commits=${commits.current} ${gaps(stamps)} ${ui.stop()}`);
   // Let the last rolls land, then one figure alone.
   await wait(1500);if(!mounted.current)return;
   let value=formats[0].start,updates=0;setValues([value]);await wait(500);if(!mounted.current)return;
   stamps=[];commits.current=0;ui.start();
   for(let now=await frame();mounted.current&&(!stamps.length||now-stamps[0]<3000);now=await frame()){stamps.push(now);value+=(next()*2-1)*7.5;setValues([value]);updates++;}
   if(!mounted.current)return;
   console.log(`[perf] number-flow interrupt figures=1 updates=${updates} commits=${commits.current} ${gaps(stamps)} ${ui.stop()}`);
   await wait(1500);if(!mounted.current)return;
   // The first change creates digit strips. Isolate it from subsequent changes on the same board.
   board=starts(40);setBoardKey(1);setValues(board);
   await wait(800);if(!mounted.current)return;
   const phaseRandom=random(20260117);
   for(const [phase,count] of [['first-tick',1],['steady',10]] as const){
    if(!mounted.current)return;
    ui.start();
    const phaseStamps=[await frame()];
    if(!mounted.current){ui.stop();return;}
    let frameId=0;
    const sample=(time:number)=>{if(mounted.current){phaseStamps.push(time);frameId=requestAnimationFrame(sample);}};
    frameId=requestAnimationFrame(sample);
    const start=Date.now();
    for(let tick=0;tick<count&&mounted.current;tick++){
     if(tick)await wait(Math.max(0,start+tick*100-Date.now()));
     if(!mounted.current)break;
     board=board.map((v,index)=>v+(phaseRandom()*2-1)*formats[index%formats.length].step);
     setValues(board);
    }
    // Include the full first transition and allow the last steady update to land.
    await wait(Math.max(0,start+(count-1)*100+500-Date.now()));
    cancelAnimationFrame(frameId);
    const uiMetrics=ui.stop();
    if(!mounted.current)return;
    console.log(`[perf] number-flow ${phase} figures=40 ticks=${count} ${gaps(phaseStamps)} ${uiMetrics}`);
   }
   console.log('[perf] number-flow done');done.current?.();
  };
  void run();
  return()=>{mounted.current=false;};
 },[ui]);
 return <HIGProvider reducedMotion={false}><Profiler id='number-flow' onRender={()=>{commits.current+=1;}}>
  <View key={boardKey} style={{flexDirection:'row',flexWrap:'wrap',columnGap:16,rowGap:8,padding:16}}>{values.map((value,index)=><View key={index} style={{width:140}}><NumberFlow value={value} options={formats[index%formats.length].options}/></View>)}</View>
 </Profiler></HIGProvider>;
}
