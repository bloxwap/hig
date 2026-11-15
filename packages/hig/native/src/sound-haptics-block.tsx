import React from 'react';
import {View} from 'react-native';
import {formatNumber} from '@bloxwap/hig/contracts';
import {useColors,useFills,useHIG} from './provider.js';
import {Text} from './surface.js';
import {Button} from './button.js';
import {SettingCard,SettingHeader,SettingSwitch} from './setting-switch.js';
/** A volume as a few fixed steps. `value` and `options` are fractions: 0.25 reads 25%. */
export interface SoundVolume {
 /** Names the steps and is drawn above them: Volume. */
 label:string;
 /** Defaults to 25%, 50%, 75% and 100%. */
 options?:readonly number[];
 value:number;onValueChange:(value:number)=>void;
}
/** One feedback channel: sound effects, the microphone, haptics, the flash. Every word is host text. */
export interface SoundSection {
 id:string;label:string;description?:string;
 checked:boolean;onCheckedChange:(checked:boolean)=>void;disabled?:boolean;
 /** The device in use, under the switch: iPhone Microphone. */
 source?:string;
 /** A live input level from 0 to 1, drawn as a meter. `null` draws an empty meter. */
 level?:number|null;
 volume?:SoundVolume;
}
export interface SoundHapticsBlockProps {
 /** Heading: Sound & Haptics. */
 title:string;
 /** One card each, in order. A section's source, meter and volume show only while it is on. */
 sections:readonly SoundSection[];
 /** Shows Back on the leading edge of the header. */
 onBack?:()=>void;
 /** A control on the trailing edge of the header, usually an IconButton. */
 headerAction?:React.ReactNode;
 testID?:string;
}
const steps:readonly number[]=[0.25,0.5,0.75,1],percent:Intl.NumberFormatOptions={style:'percent',maximumFractionDigits:0};
const hidden={accessible:false,accessibilityElementsHidden:true,importantForAccessibility:'no-hide-descendants' as const};
/** The share of the meter filled, from 0 to 1. Unknown and out-of-range levels are clamped. */
export const soundLevel=(level:number|null|undefined):number=>level==null||!Number.isFinite(level)?0:Math.min(1,Math.max(0,level));
/** The settings for what the app plays and feels like, as a screen: each channel is a card with a switch, and a channel that is on can show the device it uses, a live input meter and its volume as fixed steps. */
export function SoundHapticsBlock({title,sections,onBack,headerAction,testID}:SoundHapticsBlockProps){
 const colors=useColors(),fills=useFills(),{direction,locale}=useHIG();
 const caption={fontSize:14,lineHeight:21,color:colors.muted} as const;
 const cards=sections.map(section=>{
  const {source,level,volume}=section,open=section.checked&&(!!source||level!==undefined||!!volume),id=`sound-${section.id}`;
  return <SettingCard key={section.id} testID={id}>
   <SettingSwitch testID={`${id}-switch`} label={section.label} description={section.description} checked={section.checked} disabled={section.disabled} onCheckedChange={section.onCheckedChange}/>
   {open?<View testID={`${id}-body`} style={{gap:8}}>
    {source?<Text testID={`${id}-source`} style={caption}>{source}</Text>:null}
    {level!==undefined?<View {...hidden} testID={`${id}-meter`} style={{direction,flexDirection:'row',height:4,borderRadius:2,backgroundColor:fills.raised,overflow:'hidden'}}><View testID={`${id}-level`} style={{width:`${soundLevel(level)*100}%`,borderRadius:2,backgroundColor:colors.action}}/></View>:null}
    {volume?<View testID={`${id}-volume`} accessibilityRole='radiogroup' accessibilityLabel={volume.label} style={{gap:8}}>
     <Text {...hidden} style={caption}>{volume.label}</Text>
     <View style={{direction,flexDirection:'row',gap:8}}>{(volume.options??steps).map(option=><Button key={option} testID={`${id}-volume-${option}`} intent={option===volume.value?'primary':'secondary'} accessibilityState={{selected:option===volume.value}} disabled={section.disabled} onPress={()=>volume.onValueChange(option)} style={{flex:1,alignSelf:'auto',paddingHorizontal:8}}>{formatNumber(option,locale,percent)}</Button>)}</View>
    </View>:null}
   </View>:null}
  </SettingCard>;
 });
 return <View testID={testID} style={{padding:16}}>
  <SettingHeader testID='sound' title={title} onBack={onBack} action={headerAction}/>
  {sections.length>0?<View testID='sound-sections' style={{gap:8,marginTop:16}}>{cards}</View>:null}
 </View>;
}
