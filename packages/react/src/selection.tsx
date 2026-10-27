"use client";
import React,{useId} from 'react';
import {useControllable} from './provider.js';
export interface Choice {value:string;label:string;disabled?:boolean}
interface CheckedProps {label:string;checked?:boolean;defaultChecked?:boolean;disabled?:boolean;onCheckedChange?:(value:boolean)=>void}
export function Checkbox({label,checked,defaultChecked=false,disabled,onCheckedChange}:CheckedProps){const [value,set]=useControllable(checked,defaultChecked,onCheckedChange);return <label className='hig-choice'><input type='checkbox' checked={value} disabled={disabled} onChange={e=>set(e.target.checked)}/><span>{label}</span></label>;}
export function Switch({label,checked,defaultChecked=false,disabled,onCheckedChange}:CheckedProps){const [value,set]=useControllable(checked,defaultChecked,onCheckedChange);return <label className='hig-choice hig-switch'><input role='switch' type='checkbox' checked={value} disabled={disabled} onChange={e=>set(e.target.checked)}/><span>{label}</span></label>;}
export interface ChoicesProps {label:string;options:readonly Choice[];value?:string;defaultValue?:string;disabled?:boolean;onValueChange?:(value:string)=>void}
export function RadioGroup({label,options,value,defaultValue='',disabled,onValueChange}:ChoicesProps){const name=useId();const [current,set]=useControllable(value,defaultValue,onValueChange);return <fieldset className='hig-group' disabled={disabled}><legend>{label}</legend>{options.map(o=><label key={o.value} className='hig-choice'><input type='radio' name={name} value={o.value} checked={current===o.value} disabled={o.disabled} onChange={()=>set(o.value)}/><span>{o.label}</span></label>)}</fieldset>;}
export function SegmentedControl({label,options,value,defaultValue='',disabled,onValueChange}:ChoicesProps){
 const name=useId();const [current,set]=useControllable(value,defaultValue,onValueChange);
 const selected=options.findIndex(option=>option.value===current);
 return <fieldset className='hig-group hig-segmented-control' disabled={disabled}><legend>{label}</legend>
  <div className='hig-segments' style={{'--hig-segment-count':Math.max(1,options.length),'--hig-segment-index':selected} as React.CSSProperties}>
   {selected>=0&&<span className='hig-segment-indicator' aria-hidden='true' data-disabled={disabled||options[selected].disabled||undefined}/>}
   {options.map(o=><label key={o.value} className='hig-segment'><input type='radio' name={name} value={o.value} checked={current===o.value} disabled={o.disabled} onChange={()=>{if(!disabled&&!o.disabled)set(o.value);}}/><span>{o.label}</span></label>)}
  </div>
 </fieldset>;
}
export {Select} from './select.js';
export {Slider} from './slider.js';
