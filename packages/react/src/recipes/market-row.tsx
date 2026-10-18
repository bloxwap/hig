"use client";
import React from 'react';
import {Button} from '../button.js';
import {Usd,Percent} from '../data.js';
interface MarketRowContent {symbol:string;name:string;price:number|null;change:number|null;/** Intl display options, including a decimal style when the host omits a currency symbol. */priceOptions?:Intl.NumberFormatOptions;/** Optional host-rendered market icon, favourite indicator/control and formatted volume. */icon?:React.ReactNode;favorite?:React.ReactNode;volume?:React.ReactNode;className?:string;style?:React.CSSProperties}
export type MarketRowProps=MarketRowContent&({/** Default: HIG owns the name button and its accepted activation. */mode?:'action';onSelect:()=>void}|{/** Host owns selection/keyboard semantics, for example a cmdk option. HIG adds no action or tab stop. */mode:'presentation';onSelect?:never});
export function MarketRow({symbol,name,price,change,onSelect,priceOptions,mode='action',icon,favorite,volume,className,style}:MarketRowProps){
 const identity=<>{favorite!==undefined&&<span className='hig-market-favorite'>{favorite}</span>}{icon!==undefined&&<span className='hig-market-icon'>{icon}</span>}{mode==='presentation'?<span className='hig-market-name'>{name} ({symbol})</span>:<Button intent='ghost' onClick={onSelect}>{name} ({symbol})</Button>}</>;
 return <div className={`hig-row hig-market-row${className?` ${className}`:''}`} style={style} data-mode={mode} data-has-volume={volume!==undefined||undefined}><div className='hig-market-identity'>{identity}</div><span className='hig-market-price'><Usd value={price} options={priceOptions}/></span><span className='hig-market-change'><Percent value={change}/></span>{volume!==undefined&&<span className='hig-market-volume'>{volume}</span>}</div>;
}
