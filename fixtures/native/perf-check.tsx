import React,{useEffect,useState} from 'react';
import {Linking,Pressable,Text,View} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider,SafeAreaView} from 'react-native-safe-area-context';
import AvatarPerf from './perf/avatar';
import ConfettiPerf from './perf/confetti';
import NumberFlowPerf from './perf/number-flow';
import QRCodePerf from './perf/qr-code';
import ToastPerf from './perf/toast';
/**
 * Device run of the five component load tests in fixtures/native/perf. Run with index-perf.js.
 * `bloxwaphig://perf?case=number-flow|confetti|toast|qr-code|avatar` mounts one; it runs with no touch and logs `[perf] <case> done`.
 * Read frame times with `adb shell dumpsys gfxinfo <package>` around a run.
 */
const cases={'number-flow':NumberFlowPerf,confetti:ConfettiPerf,toast:ToastPerf,'qr-code':QRCodePerf,avatar:AvatarPerf} as const;
type Case=keyof typeof cases;
const names=Object.keys(cases) as Case[];
export default function PerfCheck(){
 const [run,setRun]=useState<{name:Case;turn:number}|null>(null);
 useEffect(()=>{
  const open=(url:string|null|undefined)=>{const match=url?/case=([a-z-]+)/.exec(url):null;const name=match?.[1] as Case|undefined;if(name&&name in cases)setRun(current=>({name,turn:(current?.turn??0)+1}));};
  void Linking.getInitialURL().then(open);const subscription=Linking.addEventListener('url',event=>open(event.url));
  return()=>subscription.remove();
 },[]);
 const Active=run?cases[run.name]:null;
 // Each run is a fresh mount, so a case can be repeated.
 return <GestureHandlerRootView style={{flex:1}}><SafeAreaProvider><SafeAreaView style={{flex:1}}>
  {Active?<Active key={`${run!.name}:${run!.turn}`}/>:<View style={{flex:1,justifyContent:'center',gap:12,padding:24}}>
   {names.map(name=><Pressable key={name} testID={`perf-${name}`} onPress={()=>setRun(current=>({name,turn:(current?.turn??0)+1}))} style={{minHeight:48,justifyContent:'center'}}><Text style={{fontSize:18}}>{name}</Text></Pressable>)}
  </View>}
 </SafeAreaView></SafeAreaProvider></GestureHandlerRootView>;
}
