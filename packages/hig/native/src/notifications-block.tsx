import React from 'react';
import {View} from 'react-native';
import {useColors} from './provider.js';
import {Text} from './surface.js';
import {SettingCard,SettingHeader,SettingSwitch} from './setting-switch.js';
/** One kind of notification. Every word is host text. */
export interface NotificationsItem {
 id:string;label:string;description?:string;
 checked:boolean;onCheckedChange:(checked:boolean)=>void;disabled?:boolean;
 /** Why turning it on failed, under the card: Push request timed out. It is announced when it appears. */
 error?:string;
}
export interface NotificationsBlockProps {
 /** Heading: Notifications. */
 title:string;
 /** One card each, in order. */
 items:readonly NotificationsItem[];
 /** Shows Back on the leading edge of the header. */
 onBack?:()=>void;
 /** A control on the trailing edge of the header, usually an IconButton. */
 headerAction?:React.ReactNode;
 testID?:string;
}
/** The notifications the viewer receives, as a screen: each kind is a card with a switch and a line of explanation, and a failure to turn one on reads under its card. */
export function NotificationsBlock({title,items,onBack,headerAction,testID}:NotificationsBlockProps){
 const colors=useColors();
 const cards=items.map(item=>{
  const id=`notifications-${item.id}`;
  return <View key={item.id} style={{gap:8}}>
   <SettingCard testID={id}><SettingSwitch testID={`${id}-switch`} label={item.label} description={item.description} checked={item.checked} disabled={item.disabled} onCheckedChange={item.onCheckedChange}/></SettingCard>
   {item.error?<Text testID={`${id}-error`} accessibilityRole='alert' accessibilityLiveRegion='polite' style={{paddingHorizontal:20,fontSize:14,lineHeight:21,color:colors.negative}}>{item.error}</Text>:null}
  </View>;
 });
 return <View testID={testID} style={{padding:16}}>
  <SettingHeader testID='notifications' title={title} onBack={onBack} action={headerAction}/>
  {items.length>0?<View testID='notifications-items' style={{gap:8,marginTop:16}}>{cards}</View>:null}
 </View>;
}
