import React from 'react';
import {View} from 'react-native';
import {useColors,useHIG} from './provider.js';
import {Text} from './surface.js';
import {SwapCapsule} from './swap-parts.js';
import {SeverityIcon} from './icons.js';
import {SettingCard,SettingHeader,SettingSwitch} from './setting-switch.js';
/** One signal the viewer can turn on. */
export interface SignalsItem {
 id:string;label:string;description?:string;checked:boolean;onCheckedChange:(checked:boolean)=>void;disabled?:boolean;
 /** Always on and not changeable: shown on at full strength and read as unavailable. */
 locked?:boolean;
 /** Host content after the label, such as a badge. It is drawn only; the switch is read by `label`. */
 labelAccessory?:React.ReactNode;
 /** A neutral line under the switch, announced when it changes: Needs this device's permission. */
 hint?:string;
 /** A failure under the switch, in the negative role and announced. */
 error?:string;
}
/** A family of signals under one heading: Trend, Swing. Every word is host text. */
export interface SignalsGroup {
 id:string;title:string;
 /** Shows the verified mark after the title. */
 verified?:boolean;
 /** A small pill on the trailing edge of the heading: How it works. The host opens its own explanation. `ref` reaches the pill, so the host can move accessibility focus back to it when the explanation closes. */
 help?:{label:string;onSelect:()=>void;ref?:React.Ref<View>};
 items:readonly SignalsItem[];
}
export interface SignalsBlockProps {
 /** Heading: Signals. */
 title:string;
 /** A muted line under the header that explains the screen. */
 description?:string;
 groups:readonly SignalsGroup[];
 /** Words for the verified mark, read after the group title. */
 verifiedLabel?:string;
 /** Host artwork in place of the built-in verified mark. */
 verifiedMark?:React.ReactNode;
 /** Shows Back on the leading edge of the header. */
 onBack?:()=>void;
 /** A control on the trailing edge of the header, usually an IconButton. */
 headerAction?:React.ReactNode;
 testID?:string;
}
/** The 32dp help pill keeps a 48dp touch target: 8dp beyond each edge, clear of the switches 8dp below the 44dp heading row. */
const helpSlop={top:8,bottom:8,left:8,right:8};
/** The signals the viewer receives, as a screen, in groups: each group has a heading with an optional verified mark and a small help pill, and its signals as switches with a line of explanation, sharing one rounded container. */
export function SignalsBlock({title,description,groups,verifiedLabel,verifiedMark,onBack,headerAction,testID}:SignalsBlockProps){
 const colors=useColors(),{direction}=useHIG();
 const note={fontSize:14,lineHeight:21} as const;
 const sections=groups.map(group=>{
  const id=`signals-${group.id}`;
  return <View key={group.id} testID={id} style={{gap:8,marginTop:16}}>
   <View style={{direction,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12,minHeight:44,paddingStart:4}}>
    <View accessible accessibilityRole='header' accessibilityLabel={[group.title,group.verified&&verifiedLabel?verifiedLabel:null].filter(Boolean).join(', ')} testID={`${id}-title`} style={{flexDirection:'row',alignItems:'center',gap:6,flexShrink:1}}>
     <Text accessible={false} numberOfLines={1} style={{flexShrink:1,fontSize:16,lineHeight:24,fontWeight:'500',color:colors.muted}}>{group.title}</Text>
     {group.verified?(verifiedMark!=null?<View testID={`${id}-verified`}>{verifiedMark}</View>:<View testID={`${id}-verified`} style={{transform:[{scale:0.8}]}}><SeverityIcon kind='success' color={colors.warning}/></View>):null}
    </View>
    {group.help?<SwapCapsule ref={group.help.ref} testID={`${id}-help`} hitSlop={helpSlop} onPress={group.help.onSelect}><Text style={{fontSize:14,lineHeight:20,fontWeight:'500',color:colors.muted}}>{group.help.label}</Text></SwapCapsule>:null}
   </View>
   {group.items.length>0?<View testID={`${id}-items`} style={{gap:2,borderRadius:20,overflow:'hidden'}}>{group.items.map(item=><SettingCard key={item.id} joined testID={`${id}-${item.id}`}>
    <SettingSwitch testID={`${id}-${item.id}-switch`} label={item.label} description={item.description} checked={item.checked} disabled={item.disabled} locked={item.locked} labelAccessory={item.labelAccessory} onCheckedChange={item.onCheckedChange}/>
    {item.hint||item.error?<View style={{gap:4}}>
     {item.hint?<Text testID={`${id}-${item.id}-hint`} accessibilityLiveRegion='polite' style={{...note,color:colors.muted}}>{item.hint}</Text>:null}
     {item.error?<Text testID={`${id}-${item.id}-error`} accessibilityRole='alert' accessibilityLiveRegion='polite' style={{...note,color:colors.negative}}>{item.error}</Text>:null}
    </View>:null}
   </SettingCard>)}</View>:null}
  </View>;
 });
 return <View testID={testID} style={{padding:16}}>
  <SettingHeader testID='signals' title={title} onBack={onBack} action={headerAction}/>
  {description?<Text testID='signals-description' style={{...note,color:colors.muted,marginTop:16,paddingHorizontal:4}}>{description}</Text>:null}
  {sections}
 </View>;
}
