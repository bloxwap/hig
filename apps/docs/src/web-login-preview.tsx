import {useState} from 'react';
import {Stack,Text} from '@bloxwap/hig/react/surface';
import type {LoginBlockProps} from '@bloxwap/hig/react/blocks/login-block';
import {createLoginSheet} from './login-preview-sheet';

const Sheet=createLoginSheet(()=>import('@bloxwap/hig/react/blocks/login-block').then(module=>module.LoginBlock));
const providerNames={google:'Google',apple:'Apple',twitter:'X',email:'Email',wallet:'wallet'};

export function Example(){
 const [analytics,setAnalytics]=useState(false);
 const [lastUsed,setLastUsed]=useState<NonNullable<LoginBlockProps['lastUsed']>>('google');
 const [message,setMessage]=useState('');
 return <Stack><Sheet>{(Form,close)=>{
  function select(provider:NonNullable<LoginBlockProps['lastUsed']>){
   setLastUsed(provider);setMessage('Selected '+providerNames[provider]);close();
  }
  return <Form lastUsed={lastUsed} onLogin={select} onMoreLogin={select} onClose={close}
   analyticsEnabled={analytics} onAnalyticsChange={setAnalytics}/>;
 }}</Sheet>{message&&<Text>{message}</Text>}</Stack>;
}
