import {useFonts} from 'expo-font';
import React,{useCallback,useEffect,useRef,useState} from 'react';
import {Linking,View} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {BottomSheetModalProvider,BottomSheetScrollView} from '@gorhom/bottom-sheet';
import {useFrameCallback,useSharedValue,runOnJS} from 'react-native-reanimated';
import {SafeAreaProvider,SafeAreaView} from 'react-native-safe-area-context';
import {HIGProvider,useColors} from '@bloxwap/hig/native/provider';
import {GestureSheet as GorhomSheet} from '@bloxwap/hig/native/gesture-sheet';
import {GestureSheet as NextSheet,GestureSheetHost,GestureSheetScrollView,GestureSheetView} from '@bloxwap/hig/native/gesture-sheet-next';
import {Button} from '@bloxwap/hig/native/button';
import {Text} from '@bloxwap/hig/native/surface';
type Engine='next'|'gorhom';
type Case='list'|'content';
/**
 * Device check for HIG's own sheet against the Gorhom-backed one. Run with index-sheet-next.js.
 * `bloxwaphig://run?engine=next|gorhom&case=list|content` opens a case; `content` then switches between a short and a tall
 * pane eight times and closes itself, so a run needs no touch. Frame times on the UI thread are logged as `[sheet-check]`.
 */
const rows=(count:number)=>Array.from({length:count},(_,index)=>index);
function Row({index}:{index:number}){
 const colors=useColors();
 return <View style={{flexDirection:'row',alignItems:'center',gap:12,minHeight:56,paddingHorizontal:16}}>
  <View style={{width:36,height:36,borderRadius:18,backgroundColor:colors.nested}}/>
  <View style={{flex:1}}><Text style={{fontWeight:'600'}}>Market {index+1}</Text><Text style={{color:colors.muted,fontSize:13}}>Perpetual · 40×</Text></View>
  <Text style={{color:index%3===0?colors.negative:colors.positive}}>{index%3===0?'-':'+'}{(index*1.37%9).toFixed(2)}%</Text>
 </View>;
}
/** Counts UI-thread frames while `running`: logs the frame count, the mean rate and the frames that took longer than 1.5 frames at 60 Hz. */
function useFrameLog(label:string,running:boolean){
 const frames=useSharedValue(0),slow=useSharedValue(0),worst=useSharedValue(0),elapsed=useSharedValue(0);
 const report=useCallback((count:number,late:number,longest:number,total:number)=>{console.log(`[sheet-check] ${label} frames=${count} fps=${(count/(total/1000)).toFixed(1)} slow=${late} worstMs=${longest.toFixed(1)} windowMs=${total.toFixed(0)}`);},[label]);
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
 const [engine,setEngine]=useState<Engine>('next'),[open,setOpen]=useState<Case|null>(null),[tall,setTall]=useState(false),[status,setStatus]=useState('idle');
 const timers=useRef<ReturnType<typeof setTimeout>[]>([]);
 const clear=()=>{for(const timer of timers.current)clearTimeout(timer);timers.current=[];};
 const start=useCallback((next:Engine,which:Case)=>{
  clear();setEngine(next);setTall(false);setOpen(which);setStatus(`${next} ${which}`);
  if(which!=='content')return;
  // Short pane, tall pane, eight switches, then close: the card-to-card transition that jumps on Android today.
  for(let step=1;step<=8;step++)timers.current.push(setTimeout(()=>setTall(step%2===1),600+step*900));
  timers.current.push(setTimeout(()=>{setOpen(null);setStatus('done');},600+9*900+600));
 },[]);
 useEffect(()=>{
  const run=(url:string|null)=>{if(!url)return;const match=/engine=(next|gorhom).*case=(list|content)/.exec(url);if(match)start(match[1] as Engine,match[2] as Case);};
  void Linking.getInitialURL().then(run);const subscription=Linking.addEventListener('url',event=>run(event.url));
  return()=>{subscription.remove();clear();};
 },[start]);
 useFrameLog(`${engine} ${open??'none'}`,open!==null);
 const close=(value:boolean)=>{if(!value){clear();setOpen(null);setStatus('idle');}};
 const Sheet=engine==='next'?NextSheet:GorhomSheet,Scroller=engine==='next'?GestureSheetScrollView:BottomSheetScrollView;
 const pane=<View style={{paddingBottom:24}}>
  <Text style={{fontSize:17,fontWeight:'600',textAlign:'center',paddingVertical:10}}>{tall?'Tall pane':'Short pane'}</Text>
  {rows(tall?10:3).map(index=><Row key={index} index={index}/>)}
  <View style={{padding:16}}><Button onPress={()=>setTall(value=>!value)}>Switch pane</Button></View>
 </View>;
 return <SafeAreaView style={{flex:1,padding:24,gap:12,backgroundColor:colors.background}}>
  <Text style={{fontSize:20,fontWeight:'600'}}>Sheet engine check</Text>
  <Text testID='status' style={{color:colors.muted}}>Engine: {engine} · {status}</Text>
  <Button testID='next-list' onPress={()=>start('next','list')}>New engine: list with detents</Button>
  <Button testID='next-content' onPress={()=>start('next','content')}>New engine: pane switches</Button>
  <Button testID='gorhom-list' intent='secondary' onPress={()=>start('gorhom','list')}>Gorhom: list with detents</Button>
  <Button testID='gorhom-content' intent='secondary' onPress={()=>start('gorhom','content')}>Gorhom: pane switches</Button>
  <Sheet open={open==='list'} onOpenChange={close} title='Markets' contentMode='custom' snapPoints={['50%','90%']}>
   <Scroller>{rows(60).map(index=><Row key={index} index={index}/>)}</Scroller>
  </Sheet>
  <Sheet open={open==='content'} onOpenChange={close} title='Panes' contentMode='custom' enableDynamicSizing>{engine==='next'?<GestureSheetView viewKey={tall?'tall':'short'}>{pane}</GestureSheetView>:pane}</Sheet>
 </SafeAreaView>;
}
export default function SheetNextCheck(){
 // Metro requires static asset references.
 // eslint-disable-next-line @typescript-eslint/no-require-imports
 const [loaded,error]=useFonts({BloxwapSansRegular:require('@bloxwap/hig/native-fonts/fonts/BloxwapSans.ttf'),BloxwapSansSemiBold:require('@bloxwap/hig/native-fonts/fonts/BloxwapSans-SemiBold.ttf')});
 if(error)return <Text>Font loading failed: {error.message}</Text>;if(!loaded)return <Text>Loading Bloxwap fonts…</Text>;
 return <GestureHandlerRootView style={{flex:1}}><SafeAreaProvider><HIGProvider fontFamily='BloxwapSansRegular' fontFamilies={{400:'BloxwapSansRegular',600:'BloxwapSansSemiBold'}}><BottomSheetModalProvider><GestureSheetHost><Check/></GestureSheetHost></BottomSheetModalProvider></HIGProvider></SafeAreaProvider></GestureHandlerRootView>;
}
