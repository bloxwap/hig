// Micro-benchmark of the toast store and arithmetic both hosts share (@bloxwap/hig/contracts/toast): operations per second
// in Node, for a stack of 3 (what is visible), 16 (the native store's limit) and 64 notices. Run after `node scripts/build.mjs`:
// node scripts/perf/toast-model.mjs. Prints one JSON object. These are V8's figures on this machine; Hermes on a phone is
// slower, so read them against each other and against the 16.7ms a frame has, not as a device's.
import {TOAST_GAP,TOAST_VISIBLE,toastClockPause,toastClockRun,toastDrag,toastGrab,toastLeave,toastOrder,toastRemove,toastSlot,toastSwipeAxis,toastSwipeDismisses,toastSwipeOut,toastUpsert} from '@bloxwap/hig/contracts/toast';
const sizes=[3,16,64];
let sink=0;
/** Median operations per second of `run` over seven rounds of at least 150ms each, after a warm-up. `run(i)` returns something, which is kept alive so the work is not optimised away. */
function rate(run){
 const round=()=>{let calls=0,batch=1024;const start=performance.now();let now=start;while(now-start<150){for(let index=0;index<batch;index++){const out=run(calls+index);sink+=typeof out==='number'?out:out===null||out===undefined?0:1;}calls+=batch;now=performance.now();}return calls/((now-start)/1000);};
 round();const rounds=Array.from({length:7},round).sort((a,b)=>a-b);
 return Math.round(rounds[3]);
}
const stack=size=>{let list=[];for(let key=1;key<=size;key++)list=toastUpsert(list,{key,id:key,duration:4000,value:`Notice ${key}`},size);return list;};
const result={checkedAt:new Date().toISOString(),node:process.version,unit:'operations per second (median of 7 rounds)',store:{},layout:{},gesture:{},clock:{}};
for(const size of sizes){
 const full=stack(size),middle=full[Math.floor(size/2)],leaving=toastLeave(full,middle.id);
 const heights=full.map((entry,index)=>44+(index%3)*18);
 let key=size;
 result.store[size]={
  // A new notice on a full store: the newest joins and the cap drops the oldest.
  add:rate(()=>toastUpsert(full,{key:++key,id:key,duration:4000,value:'New'},size)),
  // A notice replaced by id where it stands.
  replace:rate(()=>toastUpsert(full,{key:++key,id:middle.id,duration:4000,value:'Replaced'},size)),
  dismissOne:rate(()=>toastLeave(full,middle.id)),
  dismissAll:rate(()=>toastLeave(full)),
  dismissMissing:rate(()=>toastLeave(full,-1)),
  remove:rate(()=>toastRemove(leaving,middle.key)),
  order:rate(()=>toastOrder(leaving)),
  // One notice's whole life on a store that already holds size - 1: raised, dismissed, dropped.
  life:rate(()=>{const raised=toastUpsert(full,{key:++key,id:key,duration:4000,value:'New'},size+1);return toastRemove(toastLeave(raised,key),key);}),
 };
 result.layout[size]={
  // One restack as the UI thread does it: every mounted notice finds its place in the shared stack.
  restackCollapsed:rate(()=>{let y=0;for(let index=0;index<size;index++)y+=toastSlot(index,heights,false,TOAST_GAP,TOAST_VISIBLE,-1).y;return y;}),
  restackExpanded:rate(()=>{let y=0;for(let index=0;index<size;index++)y+=toastSlot(index,heights,true,TOAST_GAP,TOAST_VISIBLE,-1).y;return y;}),
  // One notice's place, the furthest back: the worst single call.
  slotLastExpanded:rate(()=>toastSlot(size-1,heights,true,TOAST_GAP,TOAST_VISIBLE,-1).y),
 };
}
// What a finger costs: one frame of a drag, and the release.
result.gesture={
 axis:rate(index=>toastSwipeAxis(index%7-3,index%5-2)==='x'?1:0),
 dragAllowed:rate(index=>toastDrag(index%90,false,true)),
 dragResisted:rate(index=>toastDrag(-(index%90),false,true)),
 grab:rate(index=>toastGrab(-(index%19),false,true)),
 release:rate(index=>toastSwipeDismisses(index%90,index%900,false,true)?toastSwipeOut(index%90,index%900,44).duration:0),
};
result.clock={runPause:rate(index=>toastClockPause(toastClockRun({remaining:4000,startedAt:null},index),index+250).remaining)};
if(Number.isNaN(sink))throw new Error("a benchmarked function returned NaN");
console.log(JSON.stringify(result,null,1));
