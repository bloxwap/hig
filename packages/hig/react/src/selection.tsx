"use client";
import { Check } from '@bloxwap/icons/react/check';
import {assertUniqueKeys} from '@bloxwap/hig/contracts/invariants';
import React,{useId,useRef} from 'react';
import {PressDecoration,useControllable} from './provider.js';
export interface Choice {value:string;label:string;disabled?:boolean}
interface CheckedProps {label:string;checked?:boolean;defaultChecked?:boolean;disabled?:boolean;onCheckedChange?:(value:boolean)=>void}
export function Checkbox({label,checked,defaultChecked=false,disabled,onCheckedChange}:CheckedProps){const [value,set]=useControllable(checked,defaultChecked,onCheckedChange);return <label className='hig-choice'><input type='checkbox' checked={value} disabled={disabled} onChange={e=>set(e.target.checked)}/><span>{label}</span></label>;}
export interface SwitchProps extends CheckedProps {/** Draws the track alone: `label` still names the switch for assistive technology but is not shown, for a switch whose row already shows its name. */hideLabel?:boolean}
export function Switch({label,checked,defaultChecked=false,disabled,hideLabel,onCheckedChange}:SwitchProps){const [value,set]=useControllable(checked,defaultChecked,onCheckedChange);const input=useRef<HTMLInputElement>(null);return <label className='hig-choice hig-switch'><input ref={input} role='switch' type='checkbox' checked={value} disabled={disabled} onChange={e=>set(e.target.checked)}/><span className={hideLabel?'hig-sr-only':undefined}>{label}</span><PressDecoration kind='switch' disabled={!!disabled} input={input}/></label>;}
export interface ChoicesProps {label:string;options:readonly Choice[];value?:string;defaultValue?:string;disabled?:boolean;onValueChange?:(value:string)=>void}
/** One segment. `testID` becomes the `data-testid` of the segment's radio, in place of `<group testID>-<value>`. */
export interface SegmentedControlOption extends Choice {testID?:string}
export interface SegmentedControlProps extends Omit<ChoicesProps,'options'> {options:readonly SegmentedControlOption[];/** Keeps `label` as the group's accessible name but does not draw it, for a control whose heading or row already names it. */hideLabel?:boolean;/** The group's `data-testid`; each segment's radio then takes `<testID>-<value>` unless the option sets its own `testID`, as on native. Omitted, only options with a `testID` set one. */testID?:string}
/** One segment: a label around its radio, with the provider's press decoration aimed at that radio. */
const Segment=React.memo(function Segment({name,option,checked,blocked,testID,selection}:{name:string;option:Choice;checked:boolean;blocked:boolean;testID?:string;selection:React.RefObject<(value:string)=>void>}){
 const input=useRef<HTMLInputElement>(null);
 return <label className='hig-segment'><input ref={input} type='radio' name={name} value={option.value} checked={checked} disabled={option.disabled} data-testid={testID} onChange={()=>{if(!blocked)selection.current(option.value);}}/><span>{option.label}</span><PressDecoration kind='segment' disabled={blocked} input={input}/></label>;
});
export function RadioGroup({label,options,value,defaultValue='',disabled,onValueChange}:ChoicesProps){
 const name=useId();
 const [current,set]=useControllable(value,defaultValue,onValueChange);
 const rows=React.useMemo(()=>{
  assertUniqueKeys(options,option=>option.value,'Choices');
  return options.map(option=><label key={option.value} className='hig-choice'><input type='radio' name={name} value={option.value} checked={current===option.value} disabled={option.disabled} onChange={()=>set(option.value)}/><span>{option.label}</span></label>);
 },[options,current,name,set]);
 return <fieldset className='hig-group' disabled={disabled}><legend>{label}</legend>{rows}</fieldset>;
}
export function SegmentedControl({label,options,value,defaultValue='',disabled,hideLabel,testID,onValueChange}:SegmentedControlProps){
 const name=useId();const [current,set]=useControllable(value,defaultValue,onValueChange);
 const selection=useRef(set);
 React.useLayoutEffect(()=>{selection.current=set;},[set]);
 const segments=React.useMemo(()=>{
  assertUniqueKeys(options,option=>option.value,'Choices');
  return options.map(option=><Segment key={option.value} name={name} option={option} checked={current===option.value} blocked={!!disabled||!!option.disabled}
   testID={option.testID??(testID===undefined?undefined:`${testID}-${option.value}`)} selection={selection}/>);
 },[options,current,disabled,name,testID]);
 const selected=React.useMemo(()=>options.findIndex(option=>option.value===current),[options,current]);
 return <fieldset className='hig-group hig-segmented-control' disabled={disabled} data-testid={testID}><legend className={hideLabel?'hig-sr-only':undefined}>{label}</legend>
  <div className='hig-segments' style={{'--hig-segment-count':Math.max(1,options.length),'--hig-segment-index':selected} as React.CSSProperties}>
   {selected>=0&&<span className='hig-segment-indicator' aria-hidden='true' data-disabled={disabled||options[selected].disabled||undefined}/>}
   {segments}
  </div>
 </fieldset>;
}
export interface FilterOption extends Choice {/** Image URL shown in the option's circle until it is selected. */icon?:string}
export interface FilterProps {/** Accessible name of the group; not drawn. */label:string;options:readonly FilterOption[];value?:string;defaultValue?:string;disabled?:boolean;onValueChange?:(value:string)=>void;/** Pixels the row scrolls out past its container on each side (`--hig-filter-bleed`), so the capsules are cut by the container's edge, while the first and last capsule rest this far in: pass the container's side padding. Default 0, or what an ancestor sets in `--hig-filter-bleed`. */bleed?:number}
const FilterChip=React.memo(function FilterChip({name,option,checked,blocked,selection}:{
 name:string;option:FilterOption;checked:boolean;blocked:boolean;selection:React.RefObject<(value:string)=>void>;
}){
 return <label className='hig-filter-chip'>
  <input type='radio' name={name} value={option.value} checked={checked} disabled={blocked} onChange={()=>{if(!blocked)selection.current(option.value);}}/>
  <span className='hig-filter-mark' aria-hidden='true'>{option.icon&&<img src={option.icon} alt='' loading='lazy'/>}<Check size={16}/></span>
  <span>{option.label}</span>
 </label>;
});
/** One row of filter capsules that scrolls sideways. Single choice with radio semantics; the chosen capsule inverts and a check scales into its circle. */
export function Filter({label,options,value,defaultValue='',disabled,onValueChange,bleed}:FilterProps){assertUniqueKeys(options,option=>option.value,'Choices');
 const name=useId();const [current,set]=useControllable(value,defaultValue,onValueChange);
 const selection=useRef(set);
 React.useLayoutEffect(()=>{selection.current=set;},[set]);
 return <div className='hig-filter' role='radiogroup' aria-label={label} aria-disabled={disabled||undefined} style={bleed==null?undefined:{'--hig-filter-bleed':`${bleed}px`} as React.CSSProperties}>
  {options.map(option=><FilterChip key={option.value} name={name} option={option} checked={current===option.value} blocked={!!disabled||!!option.disabled} selection={selection}/>)}
 </div>;
}
export {Select} from './select.js';
export {Slider} from './slider.js';
export {PresetGroup,type PresetGroupProps,type PresetOption} from './preset-group.js';
