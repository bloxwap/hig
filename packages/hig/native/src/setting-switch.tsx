import React from 'react';
import {View} from 'react-native';
import {useColors,useFills,useHIG} from './provider.js';
import {Text} from './surface.js';
import {SwitchRow} from './switch-row.js';
/** A secondary button under a setting, such as Open Settings. `feedback: false` keeps the provider's press feedback off this one button, for a host that plays its own cue for it; by default it plays like any `Button`. */
export interface SettingAction {label:string;onSelect:()=>void;disabled?:boolean;feedback?:boolean}
export interface SettingSwitchProps {
 label:string;description?:string;checked:boolean;onCheckedChange:(checked:boolean)=>void;disabled?:boolean;testID?:string;
 /** Always on and not changeable: the switch shows on at full strength and is read as unavailable. Presses do nothing. */
 locked?:boolean;
 /** Host content after the label, such as a badge. It is drawn only: the switch is read by `label` (and `labelAccessoryLabel`), so put any meaning it carries there or in the description. */
 labelAccessory?:React.ReactNode;
 /** Host words for the `labelAccessory`, read after the label and a pause: `Feed, New`. Same prop on web. */
 labelAccessoryLabel?:string;
}
/** One setting as a switch: the label over an optional description on the leading edge, the track on the trailing edge. The whole row is the switch; the label names it and the description is its hint. */
export function SettingSwitch({label,description,checked:requested,onCheckedChange,disabled,locked,labelAccessory,labelAccessoryLabel,testID}:SettingSwitchProps){
 const colors=useColors(),fills=useFills(),{direction}=useHIG();const checked=locked?true:requested;
 const name=<Text style={{fontSize:16,lineHeight:24,color:colors.text}}>{label}</Text>;
 const named=labelAccessoryLabel&&labelAccessory!=null&&labelAccessory!==false?`${label}, ${labelAccessoryLabel}`:label;
 // As on web: the switch is a 48dp target (SwitchRow's own minimum) with 12 above and below the text, and the track sits on
 // the first line. A row is 56dp in its card, 79dp with a one-line description (24 + 2 + 21 + 12 + 12, plus the card's 4 + 4).
 return <SwitchRow testID={testID} label={named}accessibilityHint={description} checked={checked} disabled={locked?true:disabled} onCheckedChange={onCheckedChange} style={{opacity:disabled?0.5:1}}>
  <View style={{direction,flex:1,flexDirection:'row',alignItems:'flex-start',gap:12,paddingVertical:12}}>
   <View style={{flex:1,minWidth:0,gap:2}}>
    {labelAccessory!=null&&labelAccessory!==false?<View testID={testID?`${testID}-label`:undefined} style={{direction,flexDirection:'row',alignItems:'center',flexWrap:'wrap',gap:8}}>{name}{labelAccessory}</View>:name}
    {description?<Text style={{fontSize:14,lineHeight:21,color:colors.muted}}>{description}</Text>:null}
   </View>
   <View testID={testID?`${testID}-track`:undefined} style={{width:40,height:24,borderRadius:12,padding:3,backgroundColor:checked?colors.action:fills.raised,alignItems:checked?'flex-end':'flex-start'}}><View style={{width:18,height:18,borderRadius:9,backgroundColor:checked?colors.onAction:colors.text}}/></View>
  </View>
 </SwitchRow>;
}
/** The card a setting sits in, as on web: 4 above and below the switch's own 48dp row, and 16 at the foot when content follows the switch (a channel's body, a signal's hint or error), 12 under the switch. Inside a list the cards share one rounded container, so they drop their own radius. */
export function SettingCard({children,joined,testID}:React.PropsWithChildren<{joined?:boolean;testID?:string}>){
 const fills=useFills();const extended=React.Children.toArray(children).length>1;
 return <View testID={testID} style={{gap:12,paddingTop:4,paddingBottom:extended?16:4,paddingHorizontal:20,borderRadius:joined?0:20,backgroundColor:fills.well}}>{children}</View>;
}
/** The shared header of a settings screen: Back on the leading edge, the title centred, a host control on the trailing edge. */
export {SettingHeader} from './setting-header.js';
