"use client";
import React from 'react';
import {formatNumber} from '@bloxwap/hig/contracts';
import {useHIG} from '../provider.js';
import {Button} from '../button.js';
import {AnimatedNumberReadout} from '../animated-number.js';
import {BarPnl} from '../bar-pnl.js';
import type {AssetArtwork} from '../asset-balance-row.js';
import {ScreenHeader} from './screen-header.js';
import {SwapNumber} from './swap/shared.js';
/** The words of the card. They are trading terms, so the host supplies them; HIG ships none. */
export interface TradeHistoryDetailLabels {
 title:string;
 /** Names the figure for assistive technology: Net PnL. It is not drawn; the signed figure and the line under it carry the meaning on screen. */
 netPnl:string;
 /** Names of the two prices under the bar. Needed with `entry` and `exit`. */
 entry?:string;exit?:string;
 /** `+2.84% on margin`: receives the formatted percent. */
 onMargin:(percent:string)=>string;
 long:string;short:string;
}
/** One label and value row. A number is formatted with `options` between `prefix` and `suffix`; a string is drawn as given, for example a duration the host has already formatted. */
export interface TradeHistoryDetail {label:string;value:string|number;options?:Intl.NumberFormatOptions;prefix?:string;suffix?:string}
export interface TradeHistoryAction {id:string;label:string;onSelect:()=>void;intent?:'primary'|'secondary';disabled?:boolean;busy?:boolean}
export interface TradeHistoryDetailBlockProps extends Omit<React.HTMLAttributes<HTMLElement>,'title'> {
 labels:TradeHistoryDetailLabels;
 /** Asset name: Amazon. */
 name:string;icon?:AssetArtwork;
 side:'long'|'short';
 /** 20 reads `20×`. */
 leverage?:number;
 /** Net profit and loss in dollars. `null` reads as unknown. */
 pnl:number|null;
 /** Return on margin as a fraction: 0.0284 reads +2.84%. */
 pnlPercent?:number|null;
 /** Entry and exit prices. With both, one bar runs from entry to exit in the result colour, with the two prices under it, in place of two rows. */
 entry?:number;exit?:number;
 /** Format of the two prices. Defaults to US dollars. */
 priceOptions?:Intl.NumberFormatOptions;
 /** The trade's other figures in the order shown: size, notional, time held, fees, funding. They are drawn as a grid of small labels over values. */
 details:readonly TradeHistoryDetail[];
 /** Actions in one row under the details, such as Save image and Share. */
 actions?:readonly TradeHistoryAction[];
 onBack?:()=>void;
 /** A control on the trailing edge of the header, usually an `IconButton`. */
 headerAction?:React.ReactNode;
}
const pnlFormat={style:'currency',currency:'USD',signDisplay:'exceptZero',maximumFractionDigits:4} as const,percentFormat={style:'percent',minimumFractionDigits:2,maximumFractionDigits:2,signDisplay:'exceptZero'} as const;
/** The full record of one closed trade, drawn on the screen without cards because none of it is pressable: the asset with its side and leverage on one line, the net result as the headline figure, a bar from the entry price to the exit price, the other figures as a compact grid, and the host's actions. */
export function TradeHistoryDetailBlock({labels,name,icon,side,leverage,pnl,pnlPercent,entry,exit,priceOptions,details,actions=[],onBack,headerAction,className,...rest}:TradeHistoryDetailBlockProps){
 const {locale}=useHIG();const tone=pnl==null||pnl===0?undefined:pnl>0?'up':'down';
 return <section {...rest} className={`hig-trade-detail${className?` ${className}`:''}`}>
  <ScreenHeader title={labels.title} onBack={onBack} action={headerAction}/>
  <div className='hig-trade-summary'>
   <div className='hig-trade-result' data-tone={tone}>
    <div className='hig-trade-identity'>
     <span className='hig-trade-avatar' aria-hidden='true'>{typeof icon==='string'?<img src={icon} alt=''/>:icon??name.slice(0,3)}</span>
     <strong>{name}</strong>
     <span><span className='hig-position-side hig-trade-side' data-side={side}><span aria-hidden='true'>{side==='long'?'↑':'↓'} </span>{side==='long'?labels.long:labels.short}</span>{leverage!=null&&<> {formatNumber(leverage,locale)}×</>}</span>
    </div>
    <strong className='hig-trade-figure'><span className='hig-trade-caption hig-sr-only'>{labels.netPnl} </span><AnimatedNumberReadout value={pnl} options={pnlFormat}/></strong>
    {pnlPercent!==undefined&&<span className='hig-trade-return'>{pnlPercent===null?labels.onMargin('—'):<SwapNumber template={labels.onMargin} value={pnlPercent} options={percentFormat}/>}</span>}
   </div>
   {entry!=null&&exit!=null&&<BarPnl className='hig-trade-bar' surface={false} fit side={side} entry={entry} mark={exit} labels={{entry:labels.entry??'',mark:labels.exit??'',liquidation:''}} priceOptions={priceOptions}/>}
   {details.length>0&&<dl className='hig-trade-details'>{details.map(row=><div key={row.label}><dt>{row.label}</dt><dd>{typeof row.value==='number'?<SwapNumber value={row.value} options={row.options} prefix={row.prefix} suffix={row.suffix}/>:row.value}</dd></div>)}</dl>}
  </div>
  {actions.length>0&&<div className='hig-trade-actions'>{actions.map(action=><Button key={action.id} fullWidth intent={action.intent??'secondary'} disabled={action.disabled} busy={action.busy} onClick={action.onSelect}>{action.label}</Button>)}</div>}
 </section>;
}
