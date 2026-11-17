import React,{Profiler,useEffect,useRef} from 'react';
import {ScrollView,StyleSheet,Text,View} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {useFrameCallback,useSharedValue} from 'react-native-reanimated';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {HIGProvider,useColors} from '@bloxwap/hig/native/provider';
import {Toaster,dismissToast,toast} from '@bloxwap/hig/native/toast';
/**
 * Device run for the native toast host: mount it and it runs by itself, with no touch. Over a list of 200 plain rows it
 * raises 12 notices 150ms apart, replaces one notice by id 40 times 50ms apart, then dismisses everything. It logs
 * `[perf] toast start`, one line per phase, and `[perf] toast done`.
 *
 * Each phase line carries the frames of the UI thread (where the notices move) and of the JS thread (where `toast()` and
 * React run): how many, how many took longer than 25ms (1.5 frames at 60Hz), and the longest. `hostCommits` is how often
 * the Toaster committed and `rowsRenders` how often the list beside it rendered, which should stay 0. React.Profiler
 * reports only in a development build, so `hostCommits` reads 0 in a release build; `rowsRenders` counts in both.
 *
 * It brings its own HIGProvider, SafeAreaProvider and GestureHandlerRootView, so any screen can mount it as it is.
 */
const ROWS=Array.from({length:200},(_,index)=>index);
const SEVERITIES=['info','success','warning','error'] as const;
const wait=(ms:number)=>new Promise<void>(done=>{setTimeout(done,ms);});
interface Seen {host:number;rows:number}
function Rows({seen}:{seen:Seen}){
 const colors=useColors();seen.rows+=1;
 return <ScrollView style={styles.fill}>{ROWS.map(index=><View key={index} style={styles.row}><Text style={{color:colors.text}}>Row {index}</Text><Text style={{color:colors.muted}}>Plain text beside the toasts</Text></View>)}</ScrollView>;
}
function Run(){
 const colors=useColors();
 const seen=useRef<Seen>({host:0,rows:0}).current;
 const frames=useSharedValue(0),slow=useSharedValue(0),worst=useSharedValue(0);
 useFrameCallback(info=>{
  'worklet';
  const step=info.timeSincePreviousFrame??0;
  frames.value+=1;if(step>25)slow.value+=1;if(step>worst.value)worst.value=step;
 });
 useEffect(()=>{
  // Cleared on unmount: nothing is raised or logged after that.
  const run={alive:true};
  /** Calls `call` `times` times, `gap` ms apart on a fixed schedule, so a slow call does not push the later ones back. */
  const paced=async(times:number,gap:number,call:(index:number)=>void)=>{const start=Date.now();for(let index=0;index<times&&run.alive;index++){const rest=start+index*gap-Date.now();if(rest>0)await wait(rest);if(run.alive)call(index);}};
  const phase=async(name:string,body:()=>Promise<void>)=>{
   if(!run.alive)return;
   const js={frames:0,slow:0,worst:0};let last=0,counting=true;
   const tick=(now:number)=>{if(!counting)return;if(last>0){const step=now-last;js.frames+=1;if(step>25)js.slow+=1;if(step>js.worst)js.worst=step;}last=now;requestAnimationFrame(tick);};
   frames.value=0;slow.value=0;worst.value=0;seen.host=0;seen.rows=0;requestAnimationFrame(tick);
   await body();counting=false;
   if(run.alive)console.log(`[perf] toast ${name} ui frames=${frames.value} slow=${slow.value} worstMs=${worst.value.toFixed(1)} js frames=${js.frames} slow=${js.slow} worstMs=${js.worst.toFixed(1)} hostCommits=${seen.host} rowsRenders=${seen.rows}`);
  };
  void (async()=>{
   // The screen's own mount is not part of the run.
   await wait(1000);if(!run.alive)return;
   console.log('[perf] toast start');
   await phase('raise 12',async()=>{await paced(12,150,index=>{toast(`Notice ${index+1}`,{severity:SEVERITIES[index%4],description:index%3===0?'A second line under the message.':undefined});});await wait(600);});
   await phase('replace 40',async()=>{await paced(40,50,index=>{toast(`Sending ${Math.round((index+1)*2.5)}%`,{id:'perf-job',duration:Infinity});});await wait(600);});
   await phase('dismiss all',async()=>{dismissToast();await wait(600);});
   if(run.alive)console.log('[perf] toast done');
  })();
  return()=>{run.alive=false;dismissToast();};
 },[frames,slow,worst,seen]);
 return <View style={[styles.fill,{backgroundColor:colors.background}]}>
  <Rows seen={seen}/>
  <Profiler id='host' onRender={()=>{seen.host+=1;}}><Toaster testID='perf-toasts'/></Profiler>
 </View>;
}
export default function ToastPerf(){return <GestureHandlerRootView style={styles.fill}><SafeAreaProvider><HIGProvider><Run/></HIGProvider></SafeAreaProvider></GestureHandlerRootView>;}
const styles=StyleSheet.create({fill:{flex:1},row:{paddingVertical:10,paddingHorizontal:16,gap:2}});
