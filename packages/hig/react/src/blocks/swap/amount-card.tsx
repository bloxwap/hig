"use client";
import React from 'react';
import {AnimatedNumberReadout} from '../../animated-number.js';

export interface SwapAmountCardProps {
 /** Asset name, drawn in the slot. */
 name:string;
 /** Asset symbol; its first letters stand in when there is no `icon`. */
 symbol:string;
 /** Asset artwork: an image URL, or a node the host draws. */
 icon?:string|React.ReactNode;
 /** Chain or venue artwork, stacked above the asset. */
 chainIcon?:string;
 /** Line above the name: the chain, venue or account the amount comes from. */
 context?:React.ReactNode;
 /** Capsule actions on the trailing edge, such as Max. Use `SwapPill`. */
 actions?:React.ReactNode;
 /** Supporting line under the actions, such as the available balance. */
 meta?:React.ReactNode;
 /** The entered amount. */
 value:number;
 /** Accessible name of the amount. */
 amountLabel:string;
 /** Text before the amount, such as a currency sign. */
 prefix?:string;
 /** Text after the amount, such as a percent sign. */
 suffix?:string;
 /** Decimal places typed so far, so `1.50` keeps its zero. */
 fractionDigits?:number;
 /** Set while the entry ends with a decimal point that has no digits after it yet. */
 trailingDot?:boolean;
 /** Most decimal places the amount can show. */
 maximumFractionDigits?:number;
 /** Capsule under the amount, such as the converted value. Use `SwapPill`. */
 conversion?:React.ReactNode;
 /** Makes the slot a button that chooses the asset. Requires `selectLabel`. */
 onSelect?:()=>void;
 selectLabel?:string;
 className?:string;
 style?:React.CSSProperties;
}
/** The swap panel's From card on its own: the asset with its actions and balance in the slot, the entered amount under it. The host owns the entry, the keypad and what the amount means. */
export function SwapAmountCard({name,symbol,icon,chainIcon,context,actions,meta,value,amountLabel,prefix='',suffix='',fractionDigits=0,trailingDot=false,maximumFractionDigits=8,conversion,onSelect,selectLabel,className,style}:SwapAmountCardProps){
 return <div className={`hig-swap-card${className?` ${className}`:''}`} style={style} data-side='from'>
  <div className='hig-swap-slot'>
   {onSelect&&<button type='button' className='hig-swap-hit' aria-label={selectLabel} onClick={onSelect}/>}
   <div className='hig-swap-slot-content'><div className='hig-swap-selected'>
    <span className='hig-swap-stack' aria-hidden='true'>{chainIcon&&<img src={chainIcon} alt=''/>}{typeof icon==='string'?<img src={icon} alt=''/>:icon??<span className='hig-swap-initials'>{symbol.slice(0,3)}</span>}</span>
    <span className='hig-swap-identity'>{context!=null&&<span>{context}</span>}<strong>{name}</strong></span>
    {(actions!=null||meta!=null)&&<span className='hig-swap-meta'>{actions!=null&&<span className='hig-swap-pills'>{actions}</span>}{meta!=null&&<span className='hig-number'>{meta}</span>}</span>}
   </div></div>
  </div>
  <div className='hig-swap-amount-area'><div className='hig-swap-amount-content'>
   <div className='hig-swap-amount' role='textbox' tabIndex={0} aria-readonly='true' aria-label={amountLabel}>
    <AnimatedNumberReadout value={value} prefix={prefix} suffix={(trailingDot?'.':'')+suffix} options={{minimumFractionDigits:Math.min(fractionDigits,maximumFractionDigits),maximumFractionDigits,useGrouping:false}}/>
   </div>
   {conversion}
  </div></div>
 </div>;
}
