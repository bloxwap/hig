import {useState} from 'react';
import type {LoginProvider} from '@bloxwap/hig/native/login-block';
import {createLoginSheet} from './login-preview-sheet';

const Sheet=createLoginSheet(()=>import('./native-login-form').then(module=>module.default));

export default function NativeLoginPreview(){
 const [analytics,setAnalytics]=useState(false);
 const [lastUsed,setLastUsed]=useState<LoginProvider>('twitter');
 return <Sheet>{(Form,close)=><Form lastUsed={lastUsed} onLogin={provider=>{setLastUsed(provider);close();}}
  onClose={close} analyticsEnabled={analytics} onAnalyticsChange={setAnalytics}/>}</Sheet>;
}
