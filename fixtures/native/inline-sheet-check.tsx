import React,{useEffect,useRef,useState} from 'react';
import {BackHandler,Linking,ScrollView,TextInput,View} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider,SafeAreaView} from 'react-native-safe-area-context';
import {GestureSheet,GestureSheetHost,GestureSheetScrollView} from '@bloxwap/hig/native/gesture-sheet';
import {HIGProvider} from '@bloxwap/hig/native/provider';
import {Button} from '@bloxwap/hig/native/button';
import {Heading,Text} from '@bloxwap/hig/native/surface';

function PersistentPicker({onMount,onClose,onReject,onTryClose}: {onMount:()=>void;onClose:()=>void;onReject:()=>void;onTryClose:()=>void}){
 const [query,setQuery]=useState(''),[selected,setSelected]=useState(false);
 useEffect(onMount,[]);
 return <View style={{flex:1,maxHeight:'100%',overflow:'hidden',padding:16,gap:12}}>
  <Heading testID='inline-title'>Persistent markets</Heading>
  <TextInput accessibilityLabel='Market query' testID='inline-query' returnKeyType='done' blurOnSubmit value={query} onChangeText={setQuery} style={{color:'white',borderColor:'gray',borderWidth:1,minHeight:48,padding:8}}/>
  <Text testID='inline-selection'>{selected?'Selected ETH':'All markets'}</Text>
  <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}><Button onPress={()=>setSelected(true)}>Choose ETH</Button><Button onPress={onReject}>Reject next close</Button><Button onPress={onTryClose}>Try close</Button><Button onPress={onClose}>Done</Button></View>
  <GestureSheetScrollView style={{flex:1}} testID='inline-list' contentContainerStyle={{gap:16,paddingBottom:24}}>{Array.from({length:30},(_,i)=><Text key={i}>{`Persistent row ${i+1}`}</Text>)}<Button onPress={()=>setQuery('Reached last row')} testID='inline-end'>Last market action</Button></GestureSheetScrollView>
 </View>;
}

function Checks({motion}:{motion:'normal'|'reduced'}){
 const [open,setOpen]=useState(false),[mounts,setMounts]=useState(0),[dismisses,setDismisses]=useState(0),[reject,setReject]=useState(false),[result,setResult]=useState('Ready'),[fallback,setFallback]=useState(0),[contentOpen,setContentOpen]=useState(false),[rows,setRows]=useState(2);
 const trigger=useRef<React.ComponentRef<typeof View>>(null);
 // A close the host may decline once: the sheet asks, and the host answers.
 const change=(next:boolean)=>{if(!next&&reject){setReject(false);setResult('Close rejected');return;}setOpen(next);};
 useEffect(()=>{const sub=BackHandler.addEventListener('hardwareBackPress',()=>{setFallback(value=>value+1);return true;});return()=>sub.remove();},[]);
 return <SafeAreaView style={{flex:1,backgroundColor:'#0a0a0a',padding:16,gap:12}}>
  <Text testID='inline-ready'>{`Inline ${open?'open':'closed'} · mounts ${mounts} · settled ${dismisses} · fallback ${fallback} · motion ${motion}`}</Text>
  <Text testID='inline-result'>{result}</Text>
  <Button ref={trigger} testID='inline-open' onPress={()=>setOpen(true)}>Open retained picker</Button>
  <Button testID='dynamic-open' onPress={()=>{setRows(2);setContentOpen(true);}}>Open measured card</Button>
  <GestureSheet presentation='inline' open={open} onOpenChange={change} onDismiss={()=>{setDismisses(value=>value+1);setResult('Inline settled');}} returnFocusRef={trigger} title='Persistent markets' contentMode='custom' snapPoints={['70%']} bottomInset={0}>
   <PersistentPicker onMount={()=>setMounts(value=>value+1)} onClose={()=>setOpen(false)} onReject={()=>{setReject(true);setResult('Next close rejected');}} onTryClose={()=>change(false)}/>
  </GestureSheet>
  <GestureSheet open={contentOpen} onOpenChange={setContentOpen} title='Measured card' contentMode='custom' enableDynamicSizing maxDynamicContentSize={560} bottomInset={0}>
   <View testID='dynamic-content' style={{padding:16,gap:12}}><Heading testID='dynamic-title'>Measured card</Heading><Button testID='dynamic-toggle' onPress={()=>setRows(value=>value===2?12:2)}>Change content height</Button><Button testID='dynamic-close' onPress={()=>setContentOpen(false)}>Close measured card</Button><ScrollView testID='dynamic-list' style={{height:Math.min(rows*36-12,340)}} contentContainerStyle={{gap:12}}>{Array.from({length:rows},(_,i)=><Text key={i}>{`Measured row ${i+1}`}</Text>)}</ScrollView></View>
  </GestureSheet>
 </SafeAreaView>;
}

/** Lifecycle fixture; deep links select deterministic normal/reduced motion. */
export default function InlineSheetCheck(){
 const [motion,setMotion]=useState<'normal'|'reduced'>('normal');
 useEffect(()=>{const apply=(url:string|null|undefined)=>{const next=url?.match(/[?&]motion=(normal|reduced)(?:&|$)/)?.[1];if(next==='normal'||next==='reduced')setMotion(next);};void Linking.getInitialURL().then(apply);const subscription=Linking.addEventListener('url',({url})=>apply(url));return()=>subscription.remove();},[]);
 return <GestureHandlerRootView style={{flex:1}}><SafeAreaProvider><HIGProvider reducedMotion={motion==='reduced'}><GestureSheetHost><Checks motion={motion}/></GestureSheetHost></HIGProvider></SafeAreaProvider></GestureHandlerRootView>;
}
