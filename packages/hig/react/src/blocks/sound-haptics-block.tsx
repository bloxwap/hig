"use client";
import React from 'react';
import {formatNumber} from '@bloxwap/hig/contracts';
import {useNumberLocale} from '../provider.js';
import {Button} from '../button.js';
import {RadioGroup,type Choice} from '../selection.js';
import {ScreenHeader} from './screen-header.js';
import {SettingSwitch,type SettingAction} from './setting-switch.js';
export type {SettingAction} from './setting-switch.js';
/** A volume as a few fixed steps. `value` and `options` are fractions: 0.25 reads 25%. */
export interface SoundVolume {
 /** Names the steps and is drawn above them: Volume. */
 label:string;
 /** Defaults to 25%, 50%, 75% and 100%. */
 options?:readonly number[];
 value:number;onValueChange:(value:number)=>void;
}
/** A choice of device under the source, such as which microphone to use. `label` names the group and is drawn above it. */
export interface SoundChoices {label:string;options:readonly Choice[];value:string;onValueChange:(value:string)=>void}
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
 /** A secondary action at the foot of the card, shown whether the channel is on or off: Open Settings. */
 action?:SettingAction;
}export interface SoundHapticsBlockProps extends Omit<React.HTMLAttributes<HTMLElement>,'title'> {
 /** Heading: Sound & Haptics. */
 title:string;
 /** A muted line under the header that explains the screen. */
 description?:string;
 /** One card each, in order. A section's source, choices and meter show only while it is on; its volume too unless `volumeWhenOff` is `disabled`. */
 sections:readonly SoundSection[];
 onBack?:()=>void;
 /** A control on the trailing edge of the header, usually an `IconButton`. */
 headerAction?:React.ReactNode;
 /** `id` of the header's heading, so a host dialog or sheet can name itself with `aria-labelledby`. */
 headingId?:string;
 /** Pins the header to the top of the nearest scrolling container, transparent at rest and filled with `--hig-sticky-header-background` once content scrolls under it. */
 stickyHeader?:boolean;
}
const steps:readonly number[]=[0.25,0.5,0.75,1],percent={style:'percent',maximumFractionDigits:0} as const;
/** The share of the meter filled, from 0 to 1. Unknown and out-of-range levels are clamped. */
export const soundLevel=(level:number|null|undefined):number=>level==null||!Number.isFinite(level)?0:Math.min(1,Math.max(0,level));
type VolumeStepsProps=Omit<SoundVolume,'label'>&{disabled:boolean;locale:string};
const VolumeSteps=React.memo(function VolumeSteps({options=steps,value,onValueChange,disabled,locale}:VolumeStepsProps){
 return <div className='hig-setting-steps'>{options.map(option=><Button key={option} fullWidth intent={option===value?'primary':'secondary'} aria-pressed={option===value} disabled={disabled} onClick={()=>onValueChange(option)}>{formatNumber(option,locale,percent)}</Button>)}</div>;
});
const SoundCard=React.memo(function SoundCard(section:SoundSection){
 const locale=useNumberLocale();
 const {source,choices,level,levelLabel,volume,action}=section,on=section.checked;
 const showVolume=!!volume&&(on||section.volumeWhenOff==='disabled'),volumeOff=!!section.disabled||!on;
 const share=soundLevel(level);
 const open=(on&&(!!source||!!choices||level!==undefined))||showVolume||!!action;
 return <div className='hig-setting-card'>
  <SettingSwitch label={section.label} description={section.description} checked={section.checked} disabled={section.disabled} onCheckedChange={section.onCheckedChange}/>
  {open&&<div className='hig-setting-body'>
   {on&&source&&<span className='hig-setting-caption'>{source}</span>}
   {on&&choices&&<div className='hig-setting-choices'><RadioGroup label={choices.label} options={choices.options} value={choices.value} disabled={section.disabled} onValueChange={choices.onValueChange}/></div>}
   {on&&level!==undefined&&(levelLabel?<div className='hig-setting-meter' role='meter' aria-label={levelLabel} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(share*100)} aria-valuetext={formatNumber(share,locale,percent)}><span style={{transform:`scaleX(${share})`}}/></div>
    :<div className='hig-setting-meter' aria-hidden='true'><span style={{transform:`scaleX(${share})`}}/></div>)}
   {showVolume&&volume&&<div className='hig-setting-volume' role='group' aria-label={volume.label}>
    <span className='hig-setting-caption' aria-hidden='true'>{volume.label}</span>
    <VolumeSteps options={volume.options} value={volume.value} onValueChange={volume.onValueChange} disabled={volumeOff} locale={locale}/>
   </div>}
   {action&&<Button className='hig-setting-action' intent='secondary' fullWidth disabled={action.disabled} suppressFeedback={action.feedback===false} onClick={action.onSelect}>{action.label}</Button>}
  </div>}
 </div>;
});
/** The settings for what the app plays and feels like: each channel is a card with a switch, and a channel that is on can show the device it uses, a choice of devices, a live input meter and its volume as fixed steps. */
export function SoundHapticsBlock({title,description,sections,onBack,headerAction,stickyHeader,headingId,className,...rest}:SoundHapticsBlockProps){
 return <section {...rest} className={`hig-settings-block${className?` ${className}`:''}`}>
  <ScreenHeader title={title} onBack={onBack} action={headerAction} headingId={headingId} stickyHeader={stickyHeader}/>
  {description&&<p className='hig-settings-description'>{description}</p>}
  {sections.length>0&&<div className='hig-setting-cards'>{sections.map(section=><SoundCard key={section.id} {...section}/>)}</div>}
 </section>;
}
