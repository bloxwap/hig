"use client";
import { Check } from '@bloxwap/icons/react/check';
import React from 'react';
import {AnimatedNumberReadout} from './animated-number.js';
import {PressDecoration} from './provider.js';
/** Artwork for an asset: an image URL, or an element the host draws. */
export type AssetArtwork=string|React.ReactElement;
export interface AssetBalanceRowProps extends Omit<React.HTMLAttributes<HTMLElement>,'onSelect'> {
 name:string;symbol:string;
 /** A missing icon falls back to the first letters of the symbol. */
 icon?:AssetArtwork;
 /** Dollar value of the holding. `null` reads as unknown. */
 value?:number|null;
 /** The holding in token units, shown under the value. Omit it to show the value alone, as for a dollar stablecoin. */
 balance?:number|null;
 /** Format of the units line. Defaults to at most six fraction digits. */
 balanceOptions?:Intl.NumberFormatOptions;
 /** Host text after the units figure, such as ` HYPE`. Drawn only when the units are known. */
 unitsSuffix?:string;
 /** `units` puts the units on the headline line in place of the value and draws no second line, for a holding with no dollar value. Defaults to `value`. */
 headline?:'value'|'units';
 /** `false` draws no figures at all, for a row that is just an item to pick, such as a method or a chain. Defaults to `true`. */
 amounts?:boolean;
 /** Short muted host text under the figures, such as the ledger a holding sits in. Read after them. */
 tag?:string;
 /** Host content on the trailing edge, after the figures. Inside a pressable row it must not be interactive. It is read in place, last. */
 trailing?:React.ReactNode;
 /** What assistive technology reads for `trailing`, in place of its content, for an icon or a figure whose text is not what should be heard. */
 trailingLabel?:string;
 /** Marks the row in use: a check on the trailing edge, and `aria-current` for assistive technology. */
 selected?:boolean;
 /** Dims the row and ignores presses. */
 disabled?:boolean;
 /** Makes the whole row a button. */
 onSelect?:()=>void;
}
const usd={style:'currency',currency:'USD'} as const,units={maximumFractionDigits:6} as const;
const check=<Check size={20} className='hig-asset-row-check'/>;
/** One holding in a list: round artwork, the asset's name over its symbol, and its dollar value over its units. Both numbers update place by place. */
export function AssetBalanceRow({name,symbol,icon,value,balance,balanceOptions=units,unitsSuffix,headline='value',amounts=true,tag,trailing,trailingLabel,selected,disabled,onSelect,className,...rest}:AssetBalanceRowProps){
 const unitsFirst=headline==='units';
 const figures=amounts&&<><strong>{unitsFirst?<AnimatedNumberReadout value={balance} options={balanceOptions} suffix={unitsSuffix}/>:<AnimatedNumberReadout value={value} options={usd}/>}</strong>{!unitsFirst&&balance!==undefined&&<span><AnimatedNumberReadout value={balance} options={balanceOptions} suffix={unitsSuffix}/></span>}</>;
 const content=<>
  <span className='hig-asset-row-icon' aria-hidden='true'>{typeof icon==='string'?<img src={icon} alt=''/>:icon??symbol.slice(0,3)}</span>
  <span className='hig-asset-row-identity'><strong>{name}</strong><span>{symbol}</span></span>
  {(amounts||tag)&&<span className='hig-asset-row-amounts'>{figures}{tag&&<small className='hig-asset-row-tag'>{tag}</small>}</span>}
  {trailing!=null&&trailing!==false&&<span className='hig-asset-row-trailing' aria-hidden={trailingLabel!==undefined||undefined}>{trailing}</span>}
  {trailingLabel!==undefined&&trailing!=null&&trailing!==false&&<span className='hig-sr-only hig-asset-row-trailing-label'>{trailingLabel}</span>}
  {selected&&check}
 </>;
 const classes=`hig-asset-row${className?` ${className}`:''}`;
 const state={'aria-current':selected?'true' as const:undefined,'data-selected':selected||undefined};
 return onSelect
  ?<button type='button' {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)} {...state} className={classes} disabled={disabled} onClick={onSelect}>{content}<PressDecoration kind='row' disabled={disabled}/></button>
  // A static row is a generic div, where aria-disabled is not read; disabled, it becomes a group, which carries the state.
  :<div role={disabled?'group':undefined} {...rest} {...state} aria-disabled={disabled||undefined} className={classes}>{content}</div>;
}
