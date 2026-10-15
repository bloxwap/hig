import {useFonts} from 'expo-font';
import React,{useState,useEffect} from 'react';
import {ScrollView,View,KeyboardAvoidingView,AppState,Linking,I18nManager,PixelRatio,Platform,AccessibilityInfo,useWindowDimensions} from 'react-native';
import {SafeAreaView,SafeAreaProvider} from 'react-native-safe-area-context';
import {nativeColors as colors} from '@bloxwap/hig-tokens';
import {FeedbackProvider,useFeedback} from '@bloxwap/hig-feedback/react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {jsonStorage} from '@bloxwap/hig-feedback/preferences';
import {createController} from './feedback';
import {HIGProvider} from '@bloxwap/hig-native/provider';
import {TradeEntry,BalanceCard,MarketRow,InstallCommand,CodeWindow} from '@bloxwap/hig-native/recipes';
import {Switch} from '@bloxwap/hig-native/switch';
import {Slider} from '@bloxwap/hig-native/slider';
import {Select} from '@bloxwap/hig-native/select';
import {Heading,Text,Stack} from '@bloxwap/hig-native/surface';
import {Alert} from '@bloxwap/hig-native/status';
import {List,Row,NumberReadout} from '@bloxwap/hig-native/data';
import {Example} from './gallery';
import gallery from './gallery-manifest.json';
import {BrandMark} from '@bloxwap/hig-native/brand';
import {parseGalleryRoute,feedbackLog,type GalleryRoute} from './native-verification';
/** Verification-only readout of what the OS reports; shown with ?diag=1. */
function Diagnostics({direction}:{direction:'ltr'|'rtl'}){
 const {width,height,scale,fontScale}=useWindowDimensions();const [reduced,setReduced]=useState<boolean|null>(null),[reader,setReader]=useState<boolean|null>(null),[log,setLog]=useState(feedbackLog.entries());
 useEffect(()=>{let alive=true;void AccessibilityInfo.isReduceMotionEnabled().then(v=>{if(alive)setReduced(v);});void AccessibilityInfo.isScreenReaderEnabled().then(v=>{if(alive)setReader(v);});const subs=[AccessibilityInfo.addEventListener('reduceMotionChanged',setReduced),AccessibilityInfo.addEventListener('screenReaderChanged',setReader)];const off=feedbackLog.subscribe(()=>setLog(feedbackLog.entries()));return()=>{alive=false;subs.forEach(s=>s.remove());off();};},[]);
 const rn=Platform.constants.reactNativeVersion;const hermes=typeof (globalThis as {HermesInternal?:unknown}).HermesInternal==='object';
 return <View testID='native-diagnostics'><Text>{`Runtime: ${Platform.OS} ${String(Platform.Version)} · RN ${rn.major}.${rn.minor}.${rn.patch} · Hermes ${hermes?'yes':'no'}`}</Text><Text>{`Font scale: ${fontScale.toFixed(2)} (PixelRatio ${PixelRatio.getFontScale().toFixed(2)}) · window ${Math.round(width)}x${Math.round(height)} @${scale}x`}</Text><Text>{`OS RTL: ${I18nManager.isRTL} · HIG direction: ${direction}`}</Text><Text>{`OS reduce motion: ${reduced} · screen reader: ${reader}`}</Text><Text>{`Feedback calls: ${log.length?log.map(e=>`#${e.sequence} ${e.channel} ${e.call} ${e.result}`).join(' | '):'none'}`}</Text><Text>Mixed script: Bloxwap 한국어 中文 العربية Ελληνικά ₿ 0.0001</Text><NumberReadout value={1111.11} options={{minimumFractionDigits:2}}/><NumberReadout value={8888.88} options={{minimumFractionDigits:2}}/><CodeWindow language='Code ligatures'>{'a >= b && c !== d => 0x10'}</CodeWindow></View>;
}
// Host keyboard avoidance: Android 15 edge-to-edge no longer resizes for the IME, and iOS needs keyboard insets.
function Gallery(){
 const [component,setComponent]=useState('Button'),[exampleState,setExampleState]=useState('default'),[direction,setDirection]=useState<'ltr'|'rtl'>('ltr'),[diagnostics,setDiagnostics]=useState(false),[rows,setRows]=useState(0),[amount,setAmount]=useState('0.01'),[status,setStatus]=useState('Demo only; no trade is submitted.');
 const {preferences,update,sink,controller}=useFeedback();
 useEffect(()=>{const apply=(route:GalleryRoute|null)=>{if(!route)return;if(route.component&&gallery.examples.some(e=>e.name===route.component)){setComponent(route.component);setExampleState(route.state??'default');}if(route.direction)setDirection(route.direction);if(route.diagnostics!==undefined)setDiagnostics(route.diagnostics);setRows(route.rows??0);};void Linking.getInitialURL().then(url=>apply(parseGalleryRoute(url))).catch(()=>{});const sub=Linking.addEventListener('url',({url})=>apply(parseGalleryRoute(url)));return()=>sub.remove();},[]);
 useEffect(()=>{controller()?.setBackground(AppState.currentState!=='active');const sub=AppState.addEventListener('change',state=>controller()?.setBackground(state!=='active'));return()=>sub.remove();},[controller]);
 const header=<Stack><BrandMark label='Bloxwap'/><Heading>Native HIG gallery</Heading><Select label='Component' options={gallery.examples.map(e=>({value:e.name,label:e.name}))} value={component} onValueChange={v=>{setComponent(v);setExampleState('default');}}/><Select label='Example state' options={(gallery.examples.find(e=>e.name===component)?.states??['default']).map(v=>({value:v,label:v}))} value={exampleState} onValueChange={setExampleState}/><Text>0.1.0 · pinned Bloxwap Sans static faces registered</Text>{diagnostics&&<Diagnostics direction={direction}/>}</Stack>;
 const longRows=React.useMemo(()=>Array.from({length:rows},(_,i)=>({id:String(i+1),label:`Verification row ${i+1}`,value:60000+i*1.25})),[rows]);
 // rows=N swaps in a long list for scroll verification; the generated example keeps its single row.
 const example=component==='List'&&rows>0?<List label='Verification rows' items={longRows} keyFor={r=>r.id} render={r=><Row><Text>{r.label}</Text><NumberReadout value={r.value}/></Row>}/>:<Example key={component} name={component} state={exampleState}/>;
 const listMode=['List','Table','PriceChart','ActivityList'].includes(component);
 return <HIGProvider fontFamily='BloxwapSansRegular' fontFamilies={{400:'BloxwapSansRegular',600:'BloxwapSansSemiBold'}} monoFontFamily='BloxwapMonoRegular' direction={direction} feedback={sink} reducedMotion={!preferences.motion?true:undefined}><SafeAreaView style={{flex:1,backgroundColor:colors.android.background}}>{listMode?<View style={{flex:1,padding:24,gap:16}}>{header}{example}</View>:<KeyboardAvoidingView style={{flex:1}} behavior='padding' enabled={Platform.OS==='android'}><ScrollView contentContainerStyle={{padding:24}} keyboardShouldPersistTaps='handled' automaticallyAdjustKeyboardInsets><Stack>{header}{example}<TradeEntry asset='BTC' amount={amount} onAmountChange={setAmount} available='0.25 BTC' onConfirm={()=>{setStatus('Demo confirmation accepted');sink.emit({id:`demo-${Date.now()}`,source:'trade-demo',intent:'success',origin:'programmatic'});}}/><BalanceCard label='Sample balance' balance={1250.45}/><MarketRow symbol='BTC' name='Bitcoin' price={67234.56} change={2.5} onSelect={()=>setStatus('Bitcoin selected')}/><Switch label='Sound' checked={preferences.sound} onCheckedChange={v=>update({sound:v})}/><Switch label='Haptics' checked={preferences.haptics} onCheckedChange={v=>update({haptics:v})}/><Slider label='Volume' value={Math.round(preferences.volume*100)} onValueChange={v=>update({volume:v/100})}/><Switch label='Motion' checked={preferences.motion} onCheckedChange={v=>update({motion:v})}/><Alert title='Sample outcome'><Text>{status}</Text></Alert><InstallCommand command='npm install ./bloxwap-hig-native-0.1.0.tgz' onCopy={()=>{throw new Error('Host clipboard adapter required');}}/></Stack></ScrollView></KeyboardAvoidingView>}</SafeAreaView></HIGProvider>;
}
const storage=jsonStorage(AsyncStorage);
// Metro asset dependencies must be statically analyzable.
// eslint-disable-next-line @typescript-eslint/no-require-imports
export default function App(){const [loaded,error]=useFonts({BloxwapSansRegular:require('@bloxwap/hig-tokens/fonts/BloxwapSans.ttf'),BloxwapSansSemiBold:require('@bloxwap/hig-tokens/fonts/BloxwapSans-SemiBold.ttf'),BloxwapMonoRegular:require('@bloxwap/hig-tokens/fonts/BloxwapMono.ttf')});if(error)return <Text accessibilityRole='alert'>Font loading failed: {error.message}</Text>;if(!loaded)return <Text>Loading Bloxwap fonts…</Text>;return <SafeAreaProvider><FeedbackProvider createController={createController} storage={storage}><Gallery/></FeedbackProvider></SafeAreaProvider>;}
