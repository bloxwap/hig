import React,{useEffect,useMemo,useRef,useState} from 'react';
import {FlatList,View} from 'react-native';
import {HIGProvider,useColors} from '@bloxwap/hig/native/provider';
import {Avatar} from '@bloxwap/hig/native/avatar';
import {Text} from '@bloxwap/hig/native/surface';
/**
 * Device run for the generated Avatar in a long list. Mount it from any screen; it needs no touch.
 * On mount it draws 300 rows (a generated face and a line of text), scrolls to the end and back three times in
 * animated quarter steps, then changes every seed once. It logs `[perf] avatar start` and `[perf] avatar done`
 * around the run, with one line between them for the JavaScript thread: how many animation frames it was given,
 * how many came later than 1.5 and 2 frames at 60 Hz, and the longest gap. That line is the JavaScript thread only;
 * read the UI thread's frames from the platform's own tools (Perf Monitor, Instruments, Android Studio).
 */
const count=300,rowHeight=56,passes=3,steps=4,stepMs=450,settleMs=600;
/** A repeatable stream of 32-bit numbers (mulberry32), so every run draws the same faces. */
function random(state:number){return()=>{state=state+0x6d2b79f5|0;let t=Math.imul(state^state>>>15,1|state);t=t+Math.imul(t^t>>>7,61|t)^t;return (t^t>>>14)>>>0;};}
interface Row {key:string;name:string;seed:string}
/** 300 rows with distinct 42-character addresses; another `generation` is another 300 addresses. */
function rowsOf(generation:number):Row[]{
 const next=random(20261117+generation);
 return Array.from({length:count},(_,index)=>{let seed='0x';for(let digit=0;digit<40;digit++)seed+='0123456789abcdef'[next()&15];return {key:String(index),name:`Trader ${index+1}`,seed};});
}
const wait=(ms:number)=>new Promise<void>(done=>setTimeout(done,ms));
function AvatarList(){
 const colors=useColors(),list=useRef<FlatList<Row>>(null);
 const [generation,setGeneration]=useState(0),rows=useMemo(()=>rowsOf(generation),[generation]);
 useEffect(()=>{
  let alive=true,frame=0,last=0,frames=0,late=0,veryLate=0,worst=0;
  const tick=(now:number)=>{if(last>0){const gap=now-last;frames++;if(gap>25)late++;if(gap>33.4)veryLate++;if(gap>worst)worst=gap;}last=now;if(alive)frame=requestAnimationFrame(tick);};
  void (async()=>{
   // The first rows are on screen before the run starts.
   await wait(settleMs);if(!alive)return;
   console.log('[perf] avatar start');frame=requestAnimationFrame(tick);
   // To the end in quarter steps and back again, three times.
   const there=Array.from({length:steps},(_,step)=>count*rowHeight*(step+1)/steps),back=[...there.slice(0,-1).reverse(),0];
   for(const offset of Array.from({length:passes},()=>[...there,...back]).flat()){
    if(!alive)return;
    list.current?.scrollToOffset({offset,animated:true});await wait(stepMs);
   }
   if(!alive)return;
   // Every row on screen gets a new seed: every mounted face is generated and drawn again.
   setGeneration(1);await wait(settleMs);if(!alive)return;
   cancelAnimationFrame(frame);
   console.log(`[perf] avatar js frames=${frames} over25ms=${late} over33ms=${veryLate} worstMs=${worst.toFixed(1)}`);
   console.log('[perf] avatar done');
  })();
  return()=>{alive=false;cancelAnimationFrame(frame);};
 },[]);
 return <FlatList ref={list} testID='avatar-perf' data={rows} style={{flex:1,backgroundColor:colors.background}} getItemLayout={(_,index)=>({length:rowHeight,offset:rowHeight*index,index})}
  renderItem={({item})=><View style={{height:rowHeight,flexDirection:'row',alignItems:'center',gap:12,paddingHorizontal:16}}><Avatar name={item.name} seed={item.seed} decorative/><Text numberOfLines={1}>{item.name}</Text></View>}/>;
}
export default function AvatarPerf(){return <HIGProvider><AvatarList/></HIGProvider>;}
