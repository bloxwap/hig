'use client';
import {useState} from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {LoginBlock,type LoginProvider} from '@bloxwap/hig/native/login-block';
import {HIGProvider} from '@bloxwap/hig/native/provider';
import {GestureSheet} from '@bloxwap/hig/react/gesture-sheet';
import {Button} from '@bloxwap/hig/react/button';

export default function NativeLoginPreview(){
 const [open,setOpen]=useState(false);
 const [analytics,setAnalytics]=useState(false);
 const [lastUsed,setLastUsed]=useState<LoginProvider>('twitter');
 return <GestureSheet open={open} onOpenChange={setOpen} title="Log in" titleHidden enableDynamicSizing closeButton={null}
  trigger={<Button>Log in</Button>} contentProps={{style:{maxWidth:390,marginInline:'auto'}}}>
  <SafeAreaProvider><HIGProvider fontFamily="var(--font-bloxwap-sans), sans-serif">
   <LoginBlock lastUsed={lastUsed} onLogin={provider=>{setLastUsed(provider);setOpen(false);}} onClose={()=>setOpen(false)}
    analyticsEnabled={analytics} onAnalyticsChange={setAnalytics}/>
  </HIGProvider></SafeAreaProvider>
 </GestureSheet>;
}
