"use client";
import {numericRange} from '@bloxwap/hig/contracts';
import React,{useId} from 'react';
import {useControllable} from './provider.js';

export function Slider({label,value,defaultValue=0,min=0,max=100,step=1,disabled,onValueChange}: {label:string;value?:number;defaultValue?:number;min?:number;max?:number;step?:number;disabled?:boolean;onValueChange?:(value:number)=>void}){
 const id=useId();
 const range=numericRange(min,max,step);const [stored,commit]=useControllable(value,defaultValue,onValueChange);const current=range.clamp(stored);const set=(next:number)=>commit(range.clamp(next));
 const fill=max>min?Math.min(100,Math.max(0,(current-min)/(max-min)*100)):0;
 return <div className='hig-field hig-slider'>
  <label htmlFor={id}>{label}: {current}</label>
  <input id={id} className='hig-range' style={{'--hig-range-fill':`${fill}%`} as React.CSSProperties} type='range' min={min} max={max} step={step} disabled={disabled} value={current} onChange={e=>set(e.target.valueAsNumber)}/>
 </div>;
}
