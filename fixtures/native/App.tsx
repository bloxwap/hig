import React,{useState} from 'react';
import {SafeAreaView,ScrollView} from 'react-native';
import {nativeColors as colors} from '@bloxwap/hig-tokens';
import {HIGProvider} from '@bloxwap/hig-native/provider';
import {TradeEntry,BalanceCard,MarketRow,InstallCommand} from '@bloxwap/hig-native/recipes';
import {Switch,Slider} from '@bloxwap/hig-native/selection';
import {Heading,Text,Stack} from '@bloxwap/hig-native/surface';
import {Alert} from '@bloxwap/hig-native/status';
import {BrandMark} from '@bloxwap/hig-native/brand';
export default function App(){const [amount,setAmount]=useState('0.01');const [sound,setSound]=useState(false);const [volume,setVolume]=useState(30);const [status,setStatus]=useState('Demo only; no trade is submitted.');return <HIGProvider><SafeAreaView style={{flex:1,backgroundColor:colors.android.background}}><ScrollView contentContainerStyle={{padding:24}} keyboardShouldPersistTaps='handled'><Stack><BrandMark label='Bloxwap'/><Heading>Native HIG gallery</Heading><Text>0.1.0 · static font manifest pending; system fallback is explicit</Text><TradeEntry asset='BTC' amount={amount} onAmountChange={setAmount} available='0.25 BTC' onConfirm={()=>setStatus('Demo confirmation accepted')}/><BalanceCard label='Sample balance' balance={1250.45}/><MarketRow symbol='BTC' name='Bitcoin' price={67234.56} change={2.5} onSelect={()=>setStatus('Bitcoin selected')}/><Switch label='Sound preference preview' checked={sound} onCheckedChange={setSound}/><Slider label='Volume preference preview' value={volume} onValueChange={setVolume}/><Alert title='Sample outcome'><Text>{status}</Text></Alert><InstallCommand command='npm install @bloxwap/hig-native@0.1.0' onCopy={()=>{throw new Error('Host clipboard adapter required');}}/></Stack></ScrollView></SafeAreaView></HIGProvider>;}
