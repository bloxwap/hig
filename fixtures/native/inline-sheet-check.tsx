import React,{useEffect,useImperativeHandle,useRef,useState} from 'react';
import {BackHandler,ScrollView,View} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider,SafeAreaView,useSafeAreaInsets} from 'react-native-safe-area-context';
import BottomSheet,{BottomSheetModalProvider,BottomSheetScrollView,BottomSheetTextInput,BottomSheetBackdrop} from '@gorhom/bottom-sheet';
import {GestureSheet,type GestureSheetProps} from '@bloxwap/hig-native/gesture-sheet';
import {HIGProvider} from '@bloxwap/hig-native/provider';
import {Button} from '@bloxwap/hig-native/button';
import {Heading,Text} from '@bloxwap/hig-native/surface';

function PersistentPicker({onMount,onClose,onReject,onTryClose}: {onMount:()=>void;onClose:()=>void;onReject:()=>void;onTryClose:()=>void}){
 const [query,setQuery]=useState(''),[selected,setSelected]=useState(false);
 useEffect(onMount,[]);
 return <View style={{flex:1,maxHeight:'100%',overflow:'hidden',padding:16,gap:12}}>
  <Heading testID='inline-title'>Persistent markets</Heading>
  <BottomSheetTextInput accessibilityLabel='Market query' testID='inline-query' returnKeyType='done' blurOnSubmit value={query} onChangeText={setQuery} style={{color:'white',borderColor:'gray',borderWidth:1,minHeight:48,padding:8}}/>
  <Text testID='inline-selection'>{selected?'Selected ETH':'All markets'}</Text>
  <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}><Button onPress={()=>setSelected(true)}>Choose ETH</Button><Button onPress={onReject}>Reject next close</Button><Button onPress={onTryClose}>Try close</Button><Button onPress={onClose}>Done</Button></View>
  <BottomSheetScrollView style={{flex:1}} testID='inline-list' contentContainerStyle={{gap:16,paddingBottom:24}}>{Array.from({length:30},(_,i)=><Text key={i}>{`Persistent row ${i+1}`}</Text>)}<Button onPress={()=>setQuery('Reached last row')} testID='inline-end'>Last market action</Button></BottomSheetScrollView>
 </View>;
}

function BaselineSheet(props:Extract<GestureSheetProps,{presentation:'inline'}>){
 const ref=useRef<BottomSheet>(null),presented=useRef(false),insets=useSafeAreaInsets();
 useImperativeHandle(props.sheetRef,()=>ref.current!);
 useEffect(()=>{if(props.open){presented.current=true;ref.current?.expand();}else if(presented.current)ref.current?.close();},[props.open]);
 return <BottomSheet ref={ref} index={props.open?0:-1} snapPoints={['70%']} enableDynamicSizing={false} enableContentPanningGesture={false} keyboardBehavior='interactive' keyboardBlurBehavior='restore' android_keyboardInputMode='adjustResize' topInset={insets.top} bottomInset={0} accessible={false} backdropComponent={backdrop=><BottomSheetBackdrop {...backdrop} appearsOnIndex={0} disappearsOnIndex={-1}/>} onClose={()=>{if(presented.current)props.onOpenChange(false);}}>{props.children}</BottomSheet>;
}

function Checks(){
 const [open,setOpen]=useState(false),[mounts,setMounts]=useState(0),[dismisses,setDismisses]=useState(0),[reject,setReject]=useState(false),[result,setResult]=useState('Ready'),[fallback,setFallback]=useState(0),[contentOpen,setContentOpen]=useState(false),[rows,setRows]=useState(2),[baseline,setBaseline]=useState(false);
 const InlineBackend=baseline?BaselineSheet:GestureSheet;
 const sheetRef=useRef<BottomSheet>(null),trigger=useRef<View>(null);
 useEffect(()=>{const sub=BackHandler.addEventListener('hardwareBackPress',()=>{setFallback(value=>value+1);return true;});return()=>sub.remove();},[]);
 return <SafeAreaView style={{flex:1,backgroundColor:'#0a0a0a',padding:16,gap:12}}>
  <Text testID='inline-ready'>{`Inline ${open?'open':'closed'} · mounts ${mounts} · settled ${dismisses} · fallback ${fallback}`}</Text>
  <Text testID='inline-result'>{result}</Text><Button onPress={()=>setBaseline(value=>!value)}>{baseline?'Use HIG backend':'Use public baseline'}</Button>
  <Button ref={trigger} testID='inline-open' onPress={()=>setOpen(true)}>Open retained picker</Button>
  <Button onPress={()=>{setRows(2);setContentOpen(true);}}>Open measured card</Button>
  <InlineBackend presentation='inline' sheetRef={sheetRef} open={open} onOpenChange={next=>{if(!next&&reject){setReject(false);setResult('Close rejected');return;}setOpen(next);}} onDismiss={()=>{setDismisses(value=>value+1);setResult('Inline settled');}} returnFocusRef={trigger} title='Persistent markets' contentMode='custom' snapPoints={['70%']} enableContentPanningGesture={false} bottomInset={0}>
   <PersistentPicker onMount={()=>setMounts(value=>value+1)} onClose={()=>setOpen(false)} onReject={()=>{setReject(true);setResult('Next close rejected');}} onTryClose={()=>sheetRef.current?.close()}/>
  </InlineBackend>
  <GestureSheet open={contentOpen} onOpenChange={setContentOpen} title='Measured card' contentMode='custom' enableContentPanningGesture={false} enableDynamicSizing maxDynamicContentSize={560} bottomInset={0}>
   <View style={{padding:16,gap:12}}><Heading>Measured card</Heading><Button onPress={()=>setRows(value=>value===2?12:2)}>Change content height</Button><Button onPress={()=>setContentOpen(false)}>Close measured card</Button><ScrollView testID='dynamic-list' style={{height:Math.min(rows*36-12,340)}} contentContainerStyle={{gap:12}}>{Array.from({length:rows},(_,i)=><Text key={i}>{`Measured row ${i+1}`}</Text>)}</ScrollView></View>
  </GestureSheet>
 </SafeAreaView>;
}

/** Optional lifecycle fixture; no gallery or default-font budget is affected. */
export default function InlineSheetCheck(){return <GestureHandlerRootView style={{flex:1}}><SafeAreaProvider><HIGProvider reducedMotion><BottomSheetModalProvider><Checks/></BottomSheetModalProvider></HIGProvider></SafeAreaProvider></GestureHandlerRootView>;}
