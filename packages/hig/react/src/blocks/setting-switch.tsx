"use client";
import React,{useId,useRef} from 'react';
import {PressDecoration} from '../provider.js';
/** A secondary button under a setting, such as Open Settings. `feedback: false` keeps the provider's press feedback off this one button, for a host that plays its own cue for it; by default it plays like any `Button`. */
export interface SettingAction {label:string;onSelect:()=>void;disabled?:boolean;feedback?:boolean}
export interface SettingSwitchProps {
 label:string;description?:string;checked:boolean;onCheckedChange:(checked:boolean)=>void;disabled?:boolean;
 /** Always on and not changeable: the switch shows on at full strength and is read as unavailable. Presses do nothing. */
 locked?:boolean;
 /** Host content after the label, such as a badge. It is part of the switch's name, read after the label and a pause, so give artwork a text alternative or hide it. */
 labelAccessory?:React.ReactNode;
 /** Host words for the `labelAccessory`, read after the label and a pause in place of the accessory's own content, which is then hidden from assistive technology: `Feed, New`. Same prop on native. */
 labelAccessoryLabel?:string;
}
/** One setting as a switch: the label over an optional description on the leading edge, the track on the trailing edge. The whole row is the `label.hig-choice` hit target, at least `--hig-control` tall, and toggles it; the label names the switch and the description describes it. */
export function SettingSwitch({label,description,checked,onCheckedChange,disabled,locked,labelAccessory,labelAccessoryLabel}:SettingSwitchProps){
 const id=useId(),name=`${id}-label`,about=`${id}-description`,spoken=`${id}-name`;const input=useRef<HTMLInputElement>(null);
 const accessory=labelAccessory!=null&&labelAccessory!==false,worded=accessory&&!!labelAccessoryLabel;
 // The comma is read, not drawn, so the name pauses between the label and the accessory instead of running them together.
 // With host words the name is one hidden text node: a visually hidden span beside the label is laid out apart, and Chromium and WebKit read a space before its comma (`Swing notifications , Genesis`).
 return <label className='hig-choice hig-setting-switch' data-disabled={disabled||undefined} data-locked={locked||undefined}>
  <span className='hig-setting-switch-text'><span id={name}>{label}{accessory&&<>{!worded&&<span className='hig-sr-only'>, </span>}<span className='hig-setting-switch-accessory' aria-hidden={worded||undefined}>{labelAccessory}</span></>}</span>{worded&&<span id={spoken} hidden>{`${label}, ${labelAccessoryLabel}`}</span>}{description&&<span id={about} className='hig-setting-switch-description'>{description}</span>}</span>
  <span className='hig-switch'><input ref={input} type='checkbox' role='switch' aria-labelledby={worded?spoken:name} aria-describedby={description?about:undefined} aria-disabled={locked||undefined} checked={locked?true:checked} disabled={disabled} onChange={event=>{if(!locked)onCheckedChange(event.target.checked);}}/></span>
  <PressDecoration kind='switch' disabled={!!disabled||!!locked} input={input}/>
 </label>;
}
