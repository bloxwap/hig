import React,{useState} from 'react';
import {View} from 'react-native';
import {Text} from '@bloxwap/hig-native/surface';
import {nativeSrgb as colors} from '@bloxwap/hig-tokens';
import {HIGProvider} from '@bloxwap/hig-native/provider';
import {Button} from '@bloxwap/hig-native/button';
import {Switch,SwitchRow} from '@bloxwap/hig-native/switch';
/** Isolated host-row fixture: no payments, permissions or physical feedback. */
export default function SwitchContentCheck(){
 const [checked,setChecked]=useState(false),[pending,setPending]=useState(false),[changes,setChanges]=useState(0);
 return <HIGProvider><View style={{padding:24,gap:16,backgroundColor:colors.background}}>
  <Text accessibilityRole='header'>Native switch content</Text>
  <SwitchRow label='Notifications' checked={checked} disabled={pending} accessibilityHint='Order updates' accessibilityState={{busy:pending}} testID='custom-notifications' onCheckedChange={next=>{setChanges(count=>count+1);setChecked(next);}} style={({pressed})=>({padding:16,borderWidth:1,borderColor:colors.border,opacity:pressed?.7:1,alignSelf:'stretch'})}>
   <View style={{flexDirection:'row',alignItems:'center',gap:16}}><View style={{flex:1}}><Text>Notifications</Text><Text>Order updates</Text></View><View style={{width:48,height:28,borderRadius:14,backgroundColor:checked?colors.action:colors.nested}}/></View>
  </SwitchRow>
  <Text testID='change-count'>{`Changes: ${changes}`}</Text>
  <Button onPress={()=>setPending(value=>!value)}>{pending?'Finish request':'Begin request'}</Button>
  <Switch label='Default track' defaultChecked={false}/>
 </View></HIGProvider>;
}
