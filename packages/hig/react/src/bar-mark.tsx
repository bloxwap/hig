"use client";
import React,{useId} from 'react';
import {formatNumber} from '@bloxwap/hig/contracts';
import {useHIG} from './provider.js';
import {AnimatedNumberReadout} from './animated-number.js';
/** Colour roles a segment can take. They follow the token palette (and a host's market colours) like any other role. */
export type BarMarkTone='positive'|'info'|'warning'|'negative'|'muted'|'faint';
/** The order segments take tones in when they name neither a `tone` nor a `color`. */
export const barMarkTones:readonly BarMarkTone[]=['positive','info','warning','negative','muted','faint'];
/** A legend amount that can change while the bar is shown: formatted with `options` between `prefix` and `suffix`, and updated place by place. `null` reads as unknown. */
export interface BarMarkFigure {value:number|null;options?:Intl.NumberFormatOptions;prefix?:string;suffix?:string}
/** One part of the bar. `value` is in the host's own unit; only its share of the whole is drawn. `detail` is shown after the label: host-formatted text, such as `12.4 GB`, or a live figure. `color` is a host hex for a category outside the tone roles. */
export interface BarMarkElement {id?:string;label:string;value:number;tone?:BarMarkTone;color?:string;detail?:string|BarMarkFigure}
export interface BarMarkProps extends Omit<React.HTMLAttributes<HTMLElement>,'title'> {
 title:string;
 /** A line on the trailing edge of the title row, such as `59.2 GB of 64 GB used`. */
 description?:React.ReactNode;
 elements:readonly BarMarkElement[];
 /** The whole the elements are parts of. When it is larger than their sum the remainder stays empty track. Defaults to the sum. */
 total?:number;
 /** Set false to hide the legend; the labels and shares stay available to assistive technology. */
 legend?:boolean;
 /** `small` draws a 12-unit bar for a secondary breakdown under a main one. */
 size?:'default'|'small';
 /** Set false to draw no card: no surface fill, padding or radius. The title row, bar and legend keep their spacing. Default `true`. */
 surface?:boolean;
}
const amount=(value:number)=>Number.isFinite(value)&&value>0?value:0;
/** Shares of the whole for each element, and the empty remainder, as fractions of 1. Negative and non-finite values count as nothing. */
export function barMarkShares(elements:readonly BarMarkElement[],total?:number):{shares:number[];rest:number}{
 const values=elements.map(element=>amount(element.value)),sum=values.reduce((a,b)=>a+b,0),whole=Math.max(amount(total??0),sum);
 return whole>0?{shares:values.map(value=>value/whole),rest:(whole-sum)/whole}:{shares:values.map(()=>0),rest:1};
}
/** A one-dimensional stacked bar: a titled card whose single bar is divided among its elements, with a legend naming each part. */
export function BarMark({title,description,elements,total,legend=true,size='default',surface=true,className,...rest}:BarMarkProps){
 const {locale}=useHIG();const id=useId();const {shares,rest:remainder}=barMarkShares(elements,total);
 const paint=(element:BarMarkElement,index:number)=>element.color?{style:{'--hig-bar-mark-color':element.color} as React.CSSProperties}:{'data-tone':element.tone??barMarkTones[index%barMarkTones.length]};
 return <section {...rest} className={`${surface?'hig-surface ':''}hig-bar-mark${className?` ${className}`:''}`} data-surface={surface?undefined:'false'} data-size={size==='small'?size:undefined} aria-labelledby={id}>
  <div className='hig-bar-mark-header'><strong id={id} className='hig-bar-mark-title'>{title}</strong>{description!=null&&<span className='hig-bar-mark-description'>{description}</span>}</div>
  <div className='hig-bar-mark-bar' aria-hidden='true'>{elements.map((element,index)=>shares[index]>0&&<span key={element.id??index} className='hig-bar-mark-segment' {...paint(element,index)} style={{...paint(element,index).style,flexGrow:shares[index]}}/>)}{remainder>0&&<span className='hig-bar-mark-rest' style={{flexGrow:remainder}}/>}</div>
  <ul className={legend?'hig-bar-mark-legend':'hig-sr-only'}>{elements.map((element,index)=><li key={element.id??index}><span className='hig-bar-mark-dot' aria-hidden='true' {...paint(element,index)}/><span>{element.label}</span>{element.detail&&<span className='hig-bar-mark-detail'>{typeof element.detail==='string'?element.detail:<AnimatedNumberReadout value={element.detail.value} options={element.detail.options} prefix={element.detail.prefix} suffix={element.detail.suffix}/>}</span>}<span className='hig-sr-only'>{formatNumber(shares[index],locale,{style:'percent',maximumFractionDigits:1})}</span></li>)}</ul>
 </section>;
}
