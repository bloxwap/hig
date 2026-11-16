"use client";
import React,{useId,useRef} from 'react';
import {PressDecoration,useControllable} from './provider.js';
export interface Choice {value:string;label:string;disabled?:boolean}
interface CheckedProps {label:string;checked?:boolean;defaultChecked?:boolean;disabled?:boolean;onCheckedChange?:(value:boolean)=>void}
export function Checkbox({label,checked,defaultChecked=false,disabled,onCheckedChange}:CheckedProps){const [value,set]=useControllable(checked,defaultChecked,onCheckedChange);return <label className='hig-choice'><input type='checkbox' checked={value} disabled={disabled} onChange={e=>set(e.target.checked)}/><span>{label}</span></label>;}
export interface SwitchProps extends CheckedProps {/** Draws the track alone: `label` still names the switch for assistive technology but is not shown, for a switch whose row already shows its name. */hideLabel?:boolean}
export function Switch({label,checked,defaultChecked=false,disabled,hideLabel,onCheckedChange}:SwitchProps){const [value,set]=useControllable(checked,defaultChecked,onCheckedChange);const input=useRef<HTMLInputElement>(null);return <label className='hig-choice hig-switch'><input ref={input} role='switch' type='checkbox' checked={value} disabled={disabled} onChange={e=>set(e.target.checked)}/><span className={hideLabel?'hig-sr-only':undefined}>{label}</span><PressDecoration kind='switch' disabled={!!disabled} input={input}/></label>;}
export interface ChoicesProps {label:string;options:readonly Choice[];value?:string;defaultValue?:string;disabled?:boolean;onValueChange?:(value:string)=>void}
export interface SegmentedControlProps extends ChoicesProps {/** Keeps `label` as the group's accessible name but does not draw it, for a control whose heading or row already names it. */hideLabel?:boolean}
/** One segment: a label around its radio, with the provider's press decoration aimed at that radio. */
function Segment({name,option,checked,blocked,onSelect}:{name:string;option:Choice;checked:boolean;blocked:boolean;onSelect:()=>void}){
 const input=useRef<HTMLInputElement>(null);
 return <label className='hig-segment'><input ref={input} type='radio' name={name} value={option.value} checked={checked} disabled={option.disabled} onChange={()=>{if(!blocked)onSelect();}}/><span>{option.label}</span><PressDecoration kind='segment' disabled={blocked} input={input}/></label>;
}
export function RadioGroup({label,options,value,defaultValue='',disabled,onValueChange}:ChoicesProps){const name=useId();const [current,set]=useControllable(value,defaultValue,onValueChange);return <fieldset className='hig-group' disabled={disabled}><legend>{label}</legend>{options.map(o=><label key={o.value} className='hig-choice'><input type='radio' name={name} value={o.value} checked={current===o.value} disabled={o.disabled} onChange={()=>set(o.value)}/><span>{o.label}</span></label>)}</fieldset>;}
export function SegmentedControl({label,options,value,defaultValue='',disabled,hideLabel,onValueChange}:SegmentedControlProps){
 const name=useId();const [current,set]=useControllable(value,defaultValue,onValueChange);
 const selected=options.findIndex(option=>option.value===current);
 return <fieldset className='hig-group hig-segmented-control' disabled={disabled}><legend className={hideLabel?'hig-sr-only':undefined}>{label}</legend>
  <div className='hig-segments' style={{'--hig-segment-count':Math.max(1,options.length),'--hig-segment-index':selected} as React.CSSProperties}>
   {selected>=0&&<span className='hig-segment-indicator' aria-hidden='true' data-disabled={disabled||options[selected].disabled||undefined}/>}
   {options.map(o=><Segment key={o.value} name={name} option={o} checked={current===o.value} blocked={!!disabled||!!o.disabled} onSelect={()=>set(o.value)}/>)}
  </div>
 </fieldset>;
}
export interface FilterOption extends Choice {/** Image URL shown in the option's circle until it is selected. */icon?:string}
export interface FilterProps {/** Accessible name of the group; not drawn. */label:string;options:readonly FilterOption[];value?:string;defaultValue?:string;disabled?:boolean;onValueChange?:(value:string)=>void;/** Pixels the row scrolls out past its container on each side (`--hig-filter-bleed`), so the capsules are cut by the container's edge, while the first and last capsule rest this far in: pass the container's side padding. Default 0, or what an ancestor sets in `--hig-filter-bleed`. */bleed?:number}
/** One row of filter capsules that scrolls sideways. Single choice with radio semantics; the chosen capsule inverts and a check draws into its circle. */
export function Filter({label,options,value,defaultValue='',disabled,onValueChange,bleed}:FilterProps){
 const name=useId();const [current,set]=useControllable(value,defaultValue,onValueChange);
 return <div className='hig-filter' role='radiogroup' aria-label={label} aria-disabled={disabled||undefined} style={bleed==null?undefined:{'--hig-filter-bleed':`${bleed}px`} as React.CSSProperties}>
  {options.map(o=><label key={o.value} className='hig-filter-chip'><input type='radio' name={name} value={o.value} checked={current===o.value} disabled={disabled||o.disabled} onChange={()=>{if(!disabled&&!o.disabled)set(o.value);}}/><span className='hig-filter-mark' aria-hidden='true'>{o.icon&&<img src={o.icon} alt='' loading='lazy'/>}<svg viewBox='0 0 16 16' focusable='false'><path pathLength='1' d='m3.75 8.5 2.75 2.75 5.75-6.25'/></svg></span><span>{o.label}</span></label>)}
 </div>;
}
export {Select} from './select.js';
export {Slider} from './slider.js';
export {PresetGroup,type PresetGroupProps,type PresetOption} from './preset-group.js';
