import React,{useState,useEffect} from 'react';
import {SafeAreaView,ScrollView,AppState} from 'react-native';
import {nativeColors as colors} from '@bloxwap/hig-tokens';
import {FeedbackProvider,useFeedback} from '@bloxwap/hig-feedback/react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {jsonStorage} from '@bloxwap/hig-feedback/preferences';
import {createController} from './feedback';
import {HIGProvider} from '@bloxwap/hig-native/provider';
import {TradeEntry,BalanceCard,MarketRow,InstallCommand} from '@bloxwap/hig-native/recipes';
import {Switch,Slider} from '@bloxwap/hig-native/selection';
import {Heading,Text,Stack} from '@bloxwap/hig-native/surface';
import {Alert} from '@bloxwap/hig-native/status';
import {BrandMark} from '@bloxwap/hig-native/brand';
function Gallery(){const [amount,setAmount]=useState('0.01');const {preferences,update,sink,controller}=useFeedback();useEffect(()=>{controller()?.setBackground(AppState.currentState!=='active');const sub=AppState.addEventListener('change',state=>controller()?.setBackground(state!=='active'));return()=>sub.remove();},[controller]);const [status,setStatus]=useState('Demo only; no trade is submitted.');return <HIGProvider feedback={sink} reducedMotion={!preferences.motion?true:undefined}><SafeAreaView style={{flex:1,backgroundColor:colors.android.background}}><ScrollView contentContainerStyle={{padding:24}} keyboardShouldPersistTaps='handled'><Stack><BrandMark label='Bloxwap'/><Heading>Native HIG gallery</Heading><Text>0.1.0 · static font manifest pending; system fallback is explicit</Text><TradeEntry asset='BTC' amount={amount} onAmountChange={setAmount} available='0.25 BTC' onConfirm={()=>{setStatus('Demo confirmation accepted');sink.emit({id:`demo-${Date.now()}`,source:'trade-demo',intent:'success',origin:'programmatic'});}}/><BalanceCard label='Sample balance' balance={1250.45}/><MarketRow symbol='BTC' name='Bitcoin' price={67234.56} change={2.5} onSelect={()=>setStatus('Bitcoin selected')}/><Switch label='Sound' checked={preferences.sound} onCheckedChange={v=>update({sound:v})}/><Switch label='Haptics' checked={preferences.haptics} onCheckedChange={v=>update({haptics:v})}/><Slider label='Volume' value={Math.round(preferences.volume*100)} onValueChange={v=>update({volume:v/100})}/><Switch label='Motion' checked={preferences.motion} onCheckedChange={v=>update({motion:v})}/><Alert title='Sample outcome'><Text>{status}</Text></Alert><InstallCommand command='npm install @bloxwap/hig-native@0.1.0' onCopy={()=>{throw new Error('Host clipboard adapter required');}}/></Stack></ScrollView></SafeAreaView></HIGProvider>;}

const storage=jsonStorage(AsyncStorage);
export default function App(){return <FeedbackProvider createController={createController} storage={storage}><Gallery/></FeedbackProvider>;}
