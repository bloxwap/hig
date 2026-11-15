import React from 'react';
import {View} from 'react-native';
import {useColors,useFills,useHIG} from './provider.js';
import {Text} from './surface.js';
import {SwitchRow} from './switch-row.js';
export interface SettingSwitchProps {
 label:string;description?:string;checked:boolean;onCheckedChange:(checked:boolean)=>void;disabled?:boolean;testID?:string;
 /** Always on and not changeable: the switch shows on at full strength and is read as unavailable. Presses do nothing. */
 locked?:boolean;
 /** Host content after the label, such as a badge. It is drawn only: the switch is read by `label`, so put any meaning it carries in the label or description. */
 labelAccessory?:React.ReactNode;
}
/** One setting as a switch: the label over an optional description on the leading edge, the track on the trailing edge. The whole row is the switch; the label names it and the description is its hint. */
export function SettingSwitch({label,description,checked:requested,onCheckedChange,disabled,locked,labelAccessory,testID}:SettingSwitchProps){
 const colors=useColors(),fills=useFills(),{direction}=useHIG();const checked=locked?true:requested;
 const name=<Text style={{fontSize:16,lineHeight:24,color:colors.text}}>{label}</Text>;
 return <SwitchRow testID={testID} label={label} accessibilityHint={description} checked={checked} disabled={locked?true:disabled} onCheckedChange={onCheckedChange} style={{minHeight:32,opacity:disabled?0.5:1}}>
  <View style={{direction,flex:1,flexDirection:'row',alignItems:'flex-start',gap:12}}>
   <View style={{flex:1,minWidth:0,gap:2}}>
    {labelAccessory!=null&&labelAccessory!==false?<View testID={testID?`${testID}-label`:undefined} style={{direction,flexDirection:'row',alignItems:'center',flexWrap:'wrap',gap:8}}>{name}{labelAccessory}</View>:name}
    {description?<Text style={{fontSize:14,lineHeight:21,color:colors.muted}}>{description}</Text>:null}
   </View>
   <View testID={testID?`${testID}-track`:undefined} style={{width:40,height:24,borderRadius:12,padding:3,backgroundColor:checked?colors.action:fills.raised,alignItems:checked?'flex-end':'flex-start'}}><View style={{width:18,height:18,borderRadius:9,backgroundColor:checked?colors.onAction:colors.text}}/></View>
  </View>
 </SwitchRow>;
}
/** The card a setting sits in. Inside a list the cards share one rounded container, so they drop their own radius. */
export function SettingCard({children,joined,testID}:React.PropsWithChildren<{joined?:boolean;testID?:string}>){
 const fills=useFills();
 return <View testID={testID} style={{gap:12,paddingVertical:12,paddingHorizontal:20,borderRadius:joined?0:20,backgroundColor:fills.well}}>{children}</View>;
}
/** The shared header of a settings screen: Back on the leading edge, the title centred, a host control on the trailing edge. */
export {SettingHeader} from './setting-header.js';
