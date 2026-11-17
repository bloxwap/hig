"use client";
import {assertUniqueKeys} from '@bloxwap/hig/contracts';
import React from 'react';
import {useControllable} from './provider.js';
import {Button} from './button.js';
/** One quick choice. `testID` becomes the chip's `data-testid`. */
export interface PresetOption<T extends string|number=string> {value:T;label:string;disabled?:boolean;testID?:string}
export interface PresetGroupProps<T extends string|number=string> {
 /** Accessible name of the group; not drawn, so a heading or row above it names it on screen. */
 label?:string;
 options:readonly PresetOption<T>[];
 /** The selected choice; `null` selects none. Omit it, with `defaultValue`, to let the group keep its own selection. */
 value?:T|null;
 defaultValue?:T|null;
 /** Called with the choice taken. A press on the selected chip, or on a dimmed one, does nothing. */
 onValueChange?:(value:T)=>void;
 /** Chips per row. Defaults to every option in one row; with fewer columns the chips wrap onto equal-width rows. */
 columns?:number;
 /** Fill of the selected chip. Defaults to `primary`; TargetBlock passes `destructive` for a stop loss. */
 selectedIntent?:'primary'|'destructive'|'up'|'down';
 disabled?:boolean;
 /** Keeps the provider's `selection` feedback off this group, for a host that plays its own cue. By default a new choice plays it like a SegmentedControl. */
 suppressFeedback?:boolean;
 className?:string;
 /** The group's `data-testid`. */
 testID?:string;
}
/** A set of quick choices as chips in an equal-width grid, such as order sizes or leverage steps. Single choice, or none; each chip is a toggle button that reads pressed when selected, at least 44px tall, in the interface face. TargetBlock draws its presets with it. */
export function PresetGroup<T extends string|number=string>({label,options,value,defaultValue=null,onValueChange,columns,selectedIntent='primary',disabled,suppressFeedback,className,testID}:PresetGroupProps<T>){assertUniqueKeys(options,option=>option.value,'Choices');
 const [current,set]=useControllable<T|null>(value,defaultValue,onValueChange as ((value:T|null)=>void)|undefined,suppressFeedback?null:'selection');
 const count=Math.max(1,Math.floor(columns??options.length)||1);
 return <div role='group' aria-label={label} aria-disabled={disabled||undefined} className={`hig-preset-group${className?` ${className}`:''}`} data-testid={testID} style={{'--hig-preset-columns':count} as React.CSSProperties}>
  {options.map(option=>{const selected=current!==null&&Object.is(current,option.value),blocked=!!disabled||!!option.disabled;return <Button key={String(option.value)} data-testid={option.testID} fullWidth intent={selected?selectedIntent:'secondary'} aria-pressed={selected} disabled={blocked} suppressFeedback onClick={()=>{if(!blocked&&!selected)set(option.value);}}>{option.label}</Button>;})}
 </div>;
}
