import React,{useState} from 'react';
import {View} from 'react-native';
import {HIGProvider} from '@bloxwap/hig-native/provider';
import {Text} from '@bloxwap/hig-native/surface';
import {Button,Link} from '@bloxwap/hig-native/button';
import {nativeSrgb as colors} from '@bloxwap/hig-tokens';
/** Host layout/navigation fixture; every action is local and inert. */
export default function NativeActionCheck(){
 const [busy,setBusy]=useState(false),[actions,setActions]=useState(0),[navigation,setNavigation]=useState(0);
 return <HIGProvider><View style={{padding:24,gap:16,backgroundColor:colors.background}}>
  <Text accessibilityRole='header'>Native host actions</Text>
  <Button contentMode='custom' intent='secondary' accessibilityLabel='Open account' busy={busy} busyLabel='' onPress={()=>setActions(value=>value+1)} style={{paddingHorizontal:16,paddingVertical:8,alignSelf:'stretch',flexDirection:'row',justifyContent:'space-between'}}><Text testID='account-identity'>Account</Text><Text testID='account-trailing'>Details</Text></Button>
  <Text testID='action-count'>{`Actions: ${actions}`}</Text>
  <Button onPress={()=>setBusy(value=>!value)}>{busy?'Finish request':'Begin request'}</Button>
  <Link href='https://example.test/terms' contentMode='custom' accessibilityLabel='Terms' accessibilityHint='Open in host browser' disabled={busy} onPress={()=>setNavigation(value=>value+1)} style={{paddingHorizontal:16,alignSelf:'stretch',flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}><Text testID='terms-identity'>Terms</Text><Text testID='terms-trailing'>Browser</Text></Link>
  <Text testID='navigation-count'>{`Navigations: ${navigation}`}</Text>
 </View></HIGProvider>;
}
