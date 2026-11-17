import React,{useEffect,useLayoutEffect,useRef,useState} from 'react';
import {ScrollView,Text,View} from 'react-native';
import {HIGProvider,useColors} from '@bloxwap/hig/native/provider';
import {QRCode} from '@bloxwap/hig/native/qr-code';
import {encodeQR,qrErrorCorrection,qrGeometry} from '@bloxwap/hig/contracts/qr';
/**
 * Device timing for HIG's QRCode, with no touch needed. On mount it draws one code (an address under an arena, so high error
 * correction), then changes its value 40 times 100 ms apart, then mounts a list of 30 codes, and logs as `[perf] qr-code`:
 *
 * - `encode`: the JS milliseconds the shared encoder (`encodeMs`) and path builder (`geometryMs`) took for that value, timed
 *   with `performance.now()` around the same two calls the component makes, just before the component is given the value;
 * - `commit`: the JS milliseconds from setting the state to the layout effect after React committed, which holds the
 *   component's own encode and the render. It does not hold react-native-svg parsing the path or drawing it on the UI thread:
 *   read those from the frame times of a profiler or `adb shell dumpsys gfxinfo` while this runs.
 *
 * Mount it from any screen: it brings its own `HIGProvider` and needs only `react-native-svg`.
 */
const address='0x9e0fD0622874ca1cBf79DA087BaF4622Faf77688',CHANGES=40,LIST=30,INTERVAL=100;
const hex=(index:number)=>`0x${Array.from({length:40},(_,k)=>'0123456789abcdef'[(index*7+k*13+index*k)%16]).join('')}`;
const now=()=>performance.now();
const median=(values:readonly number[])=>[...values].sort((a,b)=>a-b)[values.length>>1]??0;
/** Times the shared model for one value, as `QRCode` runs it, and logs the two steps. */
function measure(phase:string,index:number,value:string,arena:boolean){
 const start=now(),matrix=encodeQR(value,{errorCorrection:qrErrorCorrection(undefined,arena)}),encoded=now(),geometry=qrGeometry(matrix,{arena}),done=now();
 console.log(`[perf] qr-code encode phase=${phase} index=${index} bytes=${value.length} modules=${matrix.size} dots=${geometry.dots} pathChars=${geometry.path.length} encodeMs=${(encoded-start).toFixed(3)} geometryMs=${(done-encoded).toFixed(3)}`);
 return {encodeMs:encoded-start,geometryMs:done-encoded};
}
type Step={phase:'idle'|'mount'|'values'|'list'|'done';index:number;value:string};
function Check(){
 const colors=useColors();
 const [step,setStep]=useState<Step>({phase:'idle',index:0,value:address});
 const set=useRef(0),encodes=useRef<number[]>([]),geometries=useRef<number[]>([]),commits=useRef<number[]>([]);
 useEffect(()=>{
  console.log('[perf] qr-code start');
  const timers:ReturnType<typeof setTimeout>[]=[];
  const go=(next:Step,values:readonly string[],arena:boolean)=>{
   for(const [index,value] of values.entries()){const {encodeMs,geometryMs}=measure(next.phase,next.index+index,value,arena);encodes.current.push(encodeMs);geometries.current.push(geometryMs);}
   set.current=now();setStep(next);
  };
  timers.push(setTimeout(()=>go({phase:'mount',index:0,value:address},[address],true),INTERVAL));
  for(let index=0;index<CHANGES;index++){const value=`ethereum:${hex(index)}@8453?value=${index}`;timers.push(setTimeout(()=>go({phase:'values',index,value},[value],true),INTERVAL*(index+2)));}
  timers.push(setTimeout(()=>go({phase:'list',index:0,value:address},Array.from({length:LIST},(_,index)=>hex(index+100)),false),INTERVAL*(CHANGES+2)));
  timers.push(setTimeout(()=>{
   const worst=Math.max(...encodes.current.map((ms,index)=>ms+geometries.current[index]!));
   console.log(`[perf] qr-code done encodes=${encodes.current.length} encodeMedianMs=${median(encodes.current).toFixed(3)} geometryMedianMs=${median(geometries.current).toFixed(3)} worstModelMs=${worst.toFixed(3)} commitMedianMs=${median(commits.current).toFixed(3)} commitMaxMs=${Math.max(...commits.current).toFixed(3)}`);
   setStep(current=>({...current,phase:'done'}));
  },INTERVAL*(CHANGES+2)+1000));
  return()=>{for(const timer of timers)clearTimeout(timer);};
 },[]);
 useLayoutEffect(()=>{
  if(step.phase==='idle'||step.phase==='done')return;
  const ms=now()-set.current;commits.current.push(ms);
  console.log(`[perf] qr-code commit phase=${step.phase} index=${step.index} commitMs=${ms.toFixed(3)}`);
 },[step]);
 const listed=step.phase==='list'||step.phase==='done';
 return <ScrollView testID='qr-code-perf' style={{flex:1,backgroundColor:colors.background}} contentContainerStyle={{padding:24,gap:12,alignItems:'center'}}>
  <Text testID='qr-code-perf-status' style={{color:colors.muted}}>{`QRCode perf · ${step.phase} ${step.index}`}</Text>
  {step.phase==='idle'?null:<QRCode testID='qr-code-perf-one' value={step.value} arena={<View style={{width:'100%',height:'100%',backgroundColor:colors.action}}/>}/>}
  {listed?<View style={{flexDirection:'row',flexWrap:'wrap',gap:8,justifyContent:'center'}}>{Array.from({length:LIST},(_,index)=><QRCode key={index} value={hex(index+100)} size={96}/>)}</View>:null}
 </ScrollView>;
}
export default function QRCodePerf(){return <HIGProvider><Check/></HIGProvider>;}
