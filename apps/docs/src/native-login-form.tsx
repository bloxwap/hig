import {SafeAreaProvider} from 'react-native-safe-area-context';
import {LoginBlock} from '@bloxwap/hig/native/login-block';
import {HIGProvider} from '@bloxwap/hig/native/provider';
import type {ComponentProps} from 'react';

export default function NativeLoginForm(props:ComponentProps<typeof LoginBlock>){
 return <SafeAreaProvider><HIGProvider fontFamily="var(--font-bloxwap-sans), sans-serif">
  <LoginBlock {...props}/>
 </HIGProvider></SafeAreaProvider>;
}
