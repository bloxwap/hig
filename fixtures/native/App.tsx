import {useFonts} from 'expo-font';
import React,{useState,useEffect} from 'react';
import {ScrollView,View,AppState} from 'react-native';
import {SafeAreaView,SafeAreaProvider} from 'react-native-safe-area-context';
import {nativeColors as colors} from '@bloxwap/hig-tokens';
import {FeedbackProvider,useFeedback} from '@bloxwap/hig-feedback/react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {jsonStorage} from '@bloxwap/hig-feedback/preferences';
import {createController} from './feedback';
import {HIGProvider} from '@bloxwap/hig-native/provider';
import {TradeEntry,BalanceCard,MarketRow,InstallCommand} from '@bloxwap/hig-native/recipes';
import {Switch} from '@bloxwap/hig-native/switch';
import {Slider} from '@bloxwap/hig-native/slider';
import {Select} from '@bloxwap/hig-native/select';
import {Heading,Text,Stack} from '@bloxwap/hig-native/surface';
import {Alert} from '@bloxwap/hig-native/status';
import {Example} from './gallery';
import gallery from './gallery-manifest.json';
import {BrandMark} from '@bloxwap/hig-native/brand';
function Gallery(){
 const [component,setComponent]=useState('Button'),[exampleState,setExampleState]=useState('default'),[amount,setAmount]=useState('0.01'),[status,setStatus]=useState('Demo only; no trade is submitted.');
 const {preferences,update,sink,controller}=useFeedback();
 useEffect(()=>{controller()?.setBackground(AppState.currentState!=='active');const sub=AppState.addEventListener('change',state=>controller()?.setBackground(state!=='active'));return()=>sub.remove();},[controller]);
 const header=<Stack><BrandMark label='Bloxwap'/><Heading>Native HIG gallery</Heading><Select label='Component' options={gallery.examples.map(e=>({value:e.name,label:e.name}))} value={component} onValueChange={v=>{setComponent(v);setExampleState('default');}}/><Select label='Example state' options={(gallery.examples.find(e=>e.name===component)?.states??['default']).map(v=>({value:v,label:v}))} value={exampleState} onValueChange={setExampleState}/><Text>0.1.0 · pinned Bloxwap Sans static faces registered</Text></Stack>;
 const example=<Example key={component} name={component} state={exampleState}/>;
 const listMode=['List','Table','PriceChart','ActivityList'].includes(component);
 return <HIGProvider fontFamily='BloxwapSansRegular' fontFamilies={{400:'BloxwapSansRegular',600:'BloxwapSansSemiBold'}} feedback={sink} reducedMotion={!preferences.motion?true:undefined}><SafeAreaView style={{flex:1,backgroundColor:colors.android.background}}>{listMode?<View style={{flex:1,padding:24,gap:16}}>{header}{example}</View>:<ScrollView contentContainerStyle={{padding:24}} keyboardShouldPersistTaps='handled'><Stack>{header}{example}<TradeEntry asset='BTC' amount={amount} onAmountChange={setAmount} available='0.25 BTC' onConfirm={()=>{setStatus('Demo confirmation accepted');sink.emit({id:`demo-${Date.now()}`,source:'trade-demo',intent:'success',origin:'programmatic'});}}/><BalanceCard label='Sample balance' balance={1250.45}/><MarketRow symbol='BTC' name='Bitcoin' price={67234.56} change={2.5} onSelect={()=>setStatus('Bitcoin selected')}/><Switch label='Sound' checked={preferences.sound} onCheckedChange={v=>update({sound:v})}/><Switch label='Haptics' checked={preferences.haptics} onCheckedChange={v=>update({haptics:v})}/><Slider label='Volume' value={Math.round(preferences.volume*100)} onValueChange={v=>update({volume:v/100})}/><Switch label='Motion' checked={preferences.motion} onCheckedChange={v=>update({motion:v})}/><Alert title='Sample outcome'><Text>{status}</Text></Alert><InstallCommand command='npm install ./bloxwap-hig-native-0.1.0.tgz' onCopy={()=>{throw new Error('Host clipboard adapter required');}}/></Stack></ScrollView>}</SafeAreaView></HIGProvider>;
}
const storage=jsonStorage(AsyncStorage);
// Metro asset dependencies must be statically analyzable.
// eslint-disable-next-line @typescript-eslint/no-require-imports
export default function App(){const [loaded,error]=useFonts({BloxwapSansRegular:require('@bloxwap/hig-tokens/fonts/BloxwapSans.ttf'),BloxwapSansSemiBold:require('@bloxwap/hig-tokens/fonts/BloxwapSans-SemiBold.ttf'),BloxwapMonoRegular:require('@bloxwap/hig-tokens/fonts/BloxwapMono.ttf')});if(error)return <Text accessibilityRole='alert'>Font loading failed: {error.message}</Text>;if(!loaded)return <Text>Loading Bloxwap fonts…</Text>;return <SafeAreaProvider><FeedbackProvider createController={createController} storage={storage}><Gallery/></FeedbackProvider></SafeAreaProvider>;}
