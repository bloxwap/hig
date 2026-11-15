"use client";
import React from 'react';
import {formatNumber} from '@bloxwap/hig/contracts';
import {useHIG} from '../provider.js';
import {Button} from '../button.js';
import {ScreenHeader} from './screen-header.js';
import {SettingSwitch} from './setting-switch.js';
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
export interface SoundHapticsBlockProps extends Omit<React.HTMLAttributes<HTMLElement>,'title'> {
 /** Heading: Sound & Haptics. */
 title:string;
 /** One card each, in order. A section's source, meter and volume show only while it is on. */
 sections:readonly SoundSection[];
 onBack?:()=>void;
 /** A control on the trailing edge of the header, usually an `IconButton`. */
 headerAction?:React.ReactNode;
}
const steps:readonly number[]=[0.25,0.5,0.75,1],percent={style:'percent',maximumFractionDigits:0} as const;
/** The share of the meter filled, from 0 to 1. Unknown and out-of-range levels are clamped. */
export const soundLevel=(level:number|null|undefined):number=>level==null||!Number.isFinite(level)?0:Math.min(1,Math.max(0,level));
/** The settings for what the app plays and feels like: each channel is a card with a switch, and a channel that is on can show the device it uses, a live input meter and its volume as fixed steps. */
export function SoundHapticsBlock({title,sections,onBack,headerAction,className,...rest}:SoundHapticsBlockProps){
 const {locale}=useHIG();
 return <section {...rest} className={`hig-settings-block${className?` ${className}`:''}`}>
  <ScreenHeader title={title} onBack={onBack} action={headerAction}/>
  {sections.length>0&&<div className='hig-setting-cards'>{sections.map(section=>{
   const {source,level,volume}=section,open=section.checked&&(!!source||level!==undefined||!!volume);
   return <div key={section.id} className='hig-setting-card'>
    <SettingSwitch label={section.label} description={section.description} checked={section.checked} disabled={section.disabled} onCheckedChange={section.onCheckedChange}/>
    {open&&<div className='hig-setting-body'>
     {source&&<span className='hig-setting-caption'>{source}</span>}
     {level!==undefined&&<div className='hig-setting-meter' aria-hidden='true'><span style={{width:`${soundLevel(level)*100}%`}}/></div>}
     {volume&&<div className='hig-setting-volume' role='group' aria-label={volume.label}>
      <span className='hig-setting-caption' aria-hidden='true'>{volume.label}</span>
      <div className='hig-setting-steps'>{(volume.options??steps).map(option=><Button key={option} fullWidth intent={option===volume.value?'primary':'secondary'} aria-pressed={option===volume.value} disabled={section.disabled} onClick={()=>volume.onValueChange(option)}>{formatNumber(option,locale,percent)}</Button>)}</div>
     </div>}
    </div>}
   </div>;
  })}</div>}
 </section>;
}
