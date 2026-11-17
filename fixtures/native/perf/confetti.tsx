import React,{useEffect,useRef} from 'react';
import {StyleSheet,View} from 'react-native';
import {useFrameCallback,useSharedValue} from 'react-native-reanimated';
import {HIGProvider} from '@bloxwap/hig/native/provider';
import {Confetti,confetti,type ConfettiOptions} from '@bloxwap/hig/native/confetti';
/**
 * Device run for native confetti: mount it and it flies on its own, with no touch. It mounts its own provider and confetti
 * layer, then fires a burst of 100 pieces, a burst of 300, and five bursts of 100 fired 100 ms apart, each stage when the
 * one before has gone. It logs `[perf] confetti start`, one line a stage with the frames the UI thread drew while the stage
 * flew (how many, how many came more than 20 ms and more than 33 ms after the one before, and the longest wait), then
 * `[perf] confetti done`. The bursts fly under the system's reduced motion setting too, so a run always measures something.
 * The numbers mean something on a device in a release build only; nothing here has been run on one.
 */
const burst=(particleCount:number):ConfettiOptions=>({particleCount,spread:70,origin:{y:0.7},disableForReducedMotion:false});
const wait=(ms:number)=>new Promise<void>(resolve=>{setTimeout(resolve,ms);});
const stages:readonly {name:string;pieces:number;run:()=>Promise<unknown>}[]=[
 {name:'burst100',pieces:100,run:()=>confetti(burst(100))},
 {name:'burst300',pieces:300,run:()=>confetti(burst(300))},
 {name:'overlap5x100',pieces:500,run:()=>Promise.all([0,1,2,3,4].map(async index=>{await wait(index*100);await confetti(burst(100));}))},
];
export default function ConfettiPerf(){
 const frames=useSharedValue(0),late=useSharedValue(0),missed=useSharedValue(0),worst=useSharedValue(0),elapsed=useSharedValue(0),started=useRef(false);
 const meter=useFrameCallback(info=>{
  'worklet';
  const step=info.timeSincePreviousFrame??0;
  frames.value+=1;elapsed.value+=step;if(step>20)late.value+=1;if(step>33)missed.value+=1;if(step>worst.value)worst.value=step;
 },false);
 useEffect(()=>{
  // Once, also when React runs the effect twice in development.
  if(started.current)return;started.current=true;
  void (async()=>{
   console.log('[perf] confetti start');
   for(const stage of stages){
    frames.value=0;late.value=0;missed.value=0;worst.value=0;elapsed.value=0;meter.setActive(true);
    const before=Date.now();await stage.run();meter.setActive(false);
    const total=elapsed.value,rate=total>0?frames.value/(total/1000):0;
    console.log(`[perf] confetti ${stage.name} pieces=${stage.pieces} ms=${Date.now()-before} frames=${frames.value} fps=${rate.toFixed(1)} over20=${late.value} over33=${missed.value} worstMs=${worst.value.toFixed(1)}`);
    await wait(300);
   }
   console.log('[perf] confetti done');
  })();
 },[frames,late,missed,worst,elapsed,meter]);
 return <HIGProvider><View style={styles.screen}><Confetti testID='perf-confetti'/></View></HIGProvider>;
}
const styles=StyleSheet.create({screen:{flex:1}});
