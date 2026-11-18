import React from 'react';
import {View,type ScrollViewProps} from 'react-native';
import {formatNumber} from './number-format.js';
import {useColors,useFills,useLayoutDirection,useNumberLocale} from './provider.js';
import {Text} from './surface.js';
import {Button} from './button.js';
import {SettingCard,SettingHeader,SettingSwitch,type SettingAction} from './setting-switch.js';
import {StickyHeaderLayout} from './sticky-header.js';
export type {SettingAction} from './setting-switch.js';
import {RadioGroup} from './radio-group.js';
import type {Choice} from './selection-types.js';
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
 /** A choice between devices, as radios under the source: Automatic, iPhone Microphone, AirPods. Shown while the channel is on. */
 choices?:SoundChoices;
 /** A live input level from 0 to 1, drawn as a meter. `null` draws an empty meter. */
 level?:number|null;
 /** Names the meter for assistive technology, which then reads the level as a percentage. Without it the meter is decorative. */
 levelLabel?:string;
 volume?:SoundVolume;
 /** What the volume does while the channel is off: `hidden` (the default) leaves it out, `disabled` keeps it in place and unavailable. */
 volumeWhenOff?:'hidden'|'disabled';
 /** A secondary action at the foot of the card, shown whether the channel is on or off: Open Settings. `feedback: false` keeps the provider's press feedback off it. */
 action?:SettingAction;
}
/** A choice of device under the source, such as which microphone to use. `label` names the group and is drawn above it. */
export interface SoundChoices {label:string;options:readonly Choice[];value:string;onValueChange:(value:string)=>void}
export interface SoundHapticsBlockProps {
 /** Heading: Sound & Haptics. */
 title:string;
 /** A muted line under the header that explains the screen. */
 description?:string;
 /** One card each, in order. A section's source, choices and meter show only while it is on; its volume too unless `volumeWhenOff` is `disabled`. */
 sections:readonly SoundSection[];
 /** Shows Back on the leading edge of the header. */
 onBack?:()=>void;
 /** A control on the trailing edge of the header, usually an IconButton. */
 headerAction?:React.ReactNode;
 /** Keeps the header pinned while the cards scroll: the block becomes its own scroll view with the header as its sticky first child, transparent at rest and filled once content scrolls under it. Place it in a bounded container. */
 stickyHeader?:boolean;
 /** Fill behind the pinned header once content scrolls under it. Defaults to the background role; in a sheet pass the sheet's fill. */
 stickyHeaderBackground?:string;
 /** The scroll view used with `stickyHeader`, such as a sheet library's own. */
 scrollComponent?:React.ComponentType<ScrollViewProps>;
 testID?:string;
}
const steps:readonly number[]=[0.25,0.5,0.75,1],percent:Intl.NumberFormatOptions={style:'percent',maximumFractionDigits:0};
const hidden={accessible:false,accessibilityElementsHidden:true,importantForAccessibility:'no-hide-descendants' as const};
/** The share of the meter filled, from 0 to 1. Unknown and out-of-range levels are clamped. */
export const soundLevel=(level:number|null|undefined):number=>level==null||!Number.isFinite(level)?0:Math.min(1,Math.max(0,level));
type VolumeStepsProps=Omit<SoundVolume,'label'>&{id:string;disabled:boolean;locale:string;direction:'ltr'|'rtl'};
const VolumeSteps=React.memo(function VolumeSteps({id,options=steps,value,onValueChange,disabled,locale,direction}:VolumeStepsProps){
 return <View style={{direction,flexDirection:'row',gap:8}}>{options.map(option=><Button key={option} testID={`${id}-volume-${option}`} intent={option===value?'primary':'secondary'} accessibilityState={{selected:option===value}} disabled={disabled} onPress={()=>onValueChange(option)} style={{flex:1,alignSelf:'auto',paddingHorizontal:8}}>{formatNumber(option,locale,percent)}</Button>)}</View>;
});
const SoundCard=React.memo(function SoundCard(section:SoundSection){
 const colors=useColors(),fills=useFills(),direction=useLayoutDirection(),locale=useNumberLocale();
 const caption={fontSize:14,lineHeight:21,color:colors.muted} as const;
  const {source,choices,level,levelLabel,volume,action}=section,on=section.checked,id=`sound-${section.id}`;
  const showVolume=!!volume&&(on||section.volumeWhenOff==='disabled');
  const open=(on&&(!!source||!!choices||level!==undefined))||showVolume||!!action;
  const share=soundLevel(level);
  const fill=<View testID={`${id}-level`} style={{width:'100%',transform:[{scaleX:share}],transformOrigin:direction==='rtl'?'right center':'left center',borderRadius:2,backgroundColor:colors.action}}/>,track={direction,flexDirection:'row',height:4,borderRadius:2,backgroundColor:fills.raised,overflow:'hidden'} as const;
  return <SettingCard testID={id}>
   <SettingSwitch testID={`${id}-switch`} label={section.label} description={section.description} checked={section.checked} disabled={section.disabled} onCheckedChange={section.onCheckedChange}/>
   {open?<View testID={`${id}-body`} style={{gap:8}}>
    {on&&source?<Text testID={`${id}-source`} style={caption}>{source}</Text>:null}
    {on&&choices?<View testID={`${id}-choices`}><RadioGroup label={choices.label} options={choices.options} value={choices.value} disabled={section.disabled} onValueChange={choices.onValueChange}/></View>:null}
    {on&&level!==undefined?(levelLabel?<View testID={`${id}-meter`} accessible accessibilityRole='progressbar' accessibilityLabel={levelLabel} accessibilityValue={{min:0,max:100,now:Math.round(share*100),text:formatNumber(share,locale,percent)}} style={track}>{fill}</View>
     :<View {...hidden} testID={`${id}-meter`} style={track}>{fill}</View>):null}
    {showVolume&&volume?<View testID={`${id}-volume`} accessibilityRole='radiogroup' accessibilityLabel={volume.label} style={{gap:8}}>
     <Text {...hidden} style={caption}>{volume.label}</Text>
     <VolumeSteps id={id} options={volume.options} value={volume.value} onValueChange={volume.onValueChange} disabled={!on||!!section.disabled} locale={locale} direction={direction}/>
    </View>:null}
    {action?<View style={{marginTop:on&&(source||choices||level!==undefined)||showVolume?8:0}}><Button testID={`${id}-action`} intent='secondary' fullWidth disabled={action.disabled} suppressFeedback={action.feedback===false} onPress={action.onSelect}>{action.label}</Button></View>:null}
   </View>:null}
  </SettingCard>;
});
/** The settings for what the app plays and feels like, as a screen: each channel is a card with a switch, and a channel that is on can show the device it uses, a live input meter and its volume as fixed steps. */
export function SoundHapticsBlock({title,description,sections,onBack,headerAction,stickyHeader,stickyHeaderBackground,scrollComponent,testID}:SoundHapticsBlockProps){
 const colors=useColors();
 const caption={fontSize:14,lineHeight:21,color:colors.muted} as const;
 const header=<SettingHeader testID='sound' title={title} onBack={onBack} action={headerAction}/>;
 const body=<>
  {description?<Text testID='sound-description' style={{...caption,marginTop:16,paddingHorizontal:4}}>{description}</Text>:null}
  {sections.length>0?<View testID='sound-sections' style={{gap:8,marginTop:16}}>{sections.map(section=><SoundCard key={section.id} {...section}/>)}</View>:null}
 </>;
 if(stickyHeader)return <StickyHeaderLayout testID={testID} headerTestID='sound-sticky-header' header={header} background={stickyHeaderBackground} scrollComponent={scrollComponent}>{body}</StickyHeaderLayout>;
 return <View testID={testID} style={{padding:16}}>
  {header}
  {body}
 </View>;
}
