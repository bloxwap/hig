import {useFonts} from 'expo-font';
import React,{useCallback,useEffect,useState} from 'react';
import {Linking} from 'react-native';
import {useFrameCallback,useSharedValue,runOnJS} from 'react-native-reanimated';
import {SafeAreaProvider,SafeAreaView} from 'react-native-safe-area-context';
import {HIGProvider,useColors} from '@bloxwap/hig/native/provider';
import {Confetti,confetti,type ConfettiOptions} from '@bloxwap/hig/native/confetti';
import {Button} from '@bloxwap/hig/native/button';
import {Text} from '@bloxwap/hig/native/surface';
/**
 * Device check for HIG's confetti. Run with index-confetti.js. `bloxwaphig://run?pieces=100` fires one burst of that many
 * pieces from the lower middle of the screen; `pieces=fireworks` fires a five-burst celebration of 200 pieces, so a run
 * needs no touch. Frame times on the UI thread while pieces fly are logged as `[confetti-check]`.
 */
const base:ConfettiOptions={origin:{y:0.7}};
const fireworks:readonly ConfettiOptions[]=[{...base,particleCount:50,spread:26,startVelocity:55},{...base,particleCount:40,spread:60},{...base,particleCount:70,spread:100,decay:0.91,scalar:0.8},{...base,particleCount:20,spread:120,startVelocity:25,decay:0.92,scalar:1.2},{...base,particleCount:20,spread:120,startVelocity:45}];
/** Counts UI-thread frames while `running`: logs the frame count, the mean rate and the frames that took longer than 1.5 frames at 60 Hz. */
function useFrameLog(label:string,running:boolean){
 const frames=useSharedValue(0),slow=useSharedValue(0),worst=useSharedValue(0),elapsed=useSharedValue(0);
 const report=useCallback((count:number,late:number,longest:number,total:number)=>{console.log(`[confetti-check] ${label} frames=${count} fps=${(count/(total/1000)).toFixed(1)} slow=${late} worstMs=${longest.toFixed(1)} windowMs=${total.toFixed(0)}`);},[label]);
 const callback=useFrameCallback(info=>{
  'worklet';
  const step=info.timeSincePreviousFrame??0;
  frames.value+=1;elapsed.value+=step;if(step>25)slow.value+=1;if(step>worst.value)worst.value=step;
 },false);
 useEffect(()=>{
  if(running){frames.value=0;slow.value=0;worst.value=0;elapsed.value=0;callback.setActive(true);return;}
  callback.setActive(false);if(frames.value>0)runOnJS(report)(frames.value,slow.value,worst.value,elapsed.value);
 },[running]);
}
function Check(){
 const colors=useColors();
 const [label,setLabel]=useState('idle'),[running,setRunning]=useState(false);
 const run=useCallback((name:string,bursts:readonly ConfettiOptions[])=>{
  setLabel(name);setRunning(true);
  void Promise.all(bursts.map(options=>confetti(options))).then(()=>setRunning(false));
 },[]);
 const pieces=useCallback((count:number)=>run(`${count} pieces`,[{...base,particleCount:count,spread:70}]),[run]);
 useEffect(()=>{
  const open=(url:string|null|undefined)=>{if(!url)return;const match=/pieces=(\d+|fireworks)/.exec(url);if(!match)return;if(match[1]==='fireworks')run('fireworks',fireworks);else pieces(Number(match[1]));};
  void Linking.getInitialURL().then(open);const subscription=Linking.addEventListener('url',event=>open(event.url));
  return()=>subscription.remove();
 },[run,pieces]);
 useFrameLog(label,running);
 return <SafeAreaView style={{flex:1,padding:24,gap:12,backgroundColor:colors.background}}>
  <Text style={{fontSize:20,fontWeight:'600'}}>Confetti check</Text>
  <Text testID='status' style={{color:colors.muted}}>{label} · {running?'flying':'at rest'}</Text>
  <Button testID='pieces-50' onPress={()=>pieces(50)}>50 pieces</Button>
  <Button testID='pieces-100' onPress={()=>pieces(100)}>100 pieces</Button>
  <Button testID='pieces-200' intent='secondary' onPress={()=>pieces(200)}>200 pieces</Button>
  <Button testID='fireworks' intent='secondary' onPress={()=>run('fireworks',fireworks)}>Fireworks: five bursts, 200 pieces</Button>
  <Confetti testID='confetti'/>
 </SafeAreaView>;
}
export default function ConfettiCheck(){
 // Metro requires static asset references.
 // eslint-disable-next-line @typescript-eslint/no-require-imports
 const [loaded,error]=useFonts({BloxwapSansRegular:require('@bloxwap/hig/native-fonts/fonts/BloxwapSans.ttf'),BloxwapSansSemiBold:require('@bloxwap/hig/native-fonts/fonts/BloxwapSans-SemiBold.ttf')});
 if(error)return <Text>Font loading failed: {error.message}</Text>;if(!loaded)return <Text>Loading Bloxwap fonts…</Text>;
 return <SafeAreaProvider><HIGProvider fontFamily='BloxwapSansRegular' fontFamilies={{400:'BloxwapSansRegular',600:'BloxwapSansSemiBold'}}><Check/></HIGProvider></SafeAreaProvider>;
}
