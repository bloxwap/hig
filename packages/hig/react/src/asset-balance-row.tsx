"use client";
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
 /** Makes the whole row a button. */
 onSelect?:()=>void;
}
const usd={style:'currency',currency:'USD'} as const,units={maximumFractionDigits:6} as const;
/** One holding in a list: round artwork, the asset's name over its symbol, and its dollar value over its units. Both numbers update place by place. */
export function AssetBalanceRow({name,symbol,icon,value,balance,balanceOptions=units,onSelect,className,...rest}:AssetBalanceRowProps){
 const content=<>
  <span className='hig-asset-row-icon' aria-hidden='true'>{typeof icon==='string'?<img src={icon} alt=''/>:icon??symbol.slice(0,3)}</span>
  <span className='hig-asset-row-identity'><strong>{name}</strong><span>{symbol}</span></span>
  <span className='hig-asset-row-amounts'><strong><AnimatedNumberReadout value={value} options={usd}/></strong>{balance!==undefined&&<span><AnimatedNumberReadout value={balance} options={balanceOptions}/></span>}</span>
 </>;
 const classes=`hig-asset-row${className?` ${className}`:''}`;
 return onSelect?<button type='button' {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)} className={classes} onClick={onSelect}>{content}<PressDecoration kind='row'/></button>:<div {...rest} className={classes}>{content}</div>;
}
