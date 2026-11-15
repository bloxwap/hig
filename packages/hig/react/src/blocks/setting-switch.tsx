"use client";
import React,{useId,useRef} from 'react';
import {PressDecoration} from '../provider.js';
export interface SettingSwitchProps {label:string;description?:string;checked:boolean;onCheckedChange:(checked:boolean)=>void;disabled?:boolean}
/** One setting as a switch: the label over an optional description on the leading edge, the track on the trailing edge. The whole row is the `label.hig-choice` hit target, at least `--hig-control` tall, and toggles it; the label names the switch and the description describes it. */
export function SettingSwitch({label,description,checked,onCheckedChange,disabled}:SettingSwitchProps){
 const id=useId(),name=`${id}-label`,about=`${id}-description`;const input=useRef<HTMLInputElement>(null);
 return <label className='hig-choice hig-setting-switch' data-disabled={disabled||undefined}>
  <span className='hig-setting-switch-text'><span id={name}>{label}</span>{description&&<span id={about} className='hig-setting-switch-description'>{description}</span>}</span>
  <span className='hig-switch'><input ref={input} type='checkbox' role='switch' aria-labelledby={name} aria-describedby={description?about:undefined} checked={checked} disabled={disabled} onChange={event=>onCheckedChange(event.target.checked)}/></span>
  <PressDecoration kind='switch' disabled={!!disabled} input={input}/>
 </label>;
}
