"use client";
import React from 'react';
import {formatNumber} from '@bloxwap/hig/contracts';
import {useHIG} from '../provider.js';
import {Button} from '../button.js';
import {AnimatedNumberReadout} from '../animated-number.js';
import type {AssetArtwork} from '../asset-balance-row.js';
import {ScreenHeader} from './screen-header.js';
import {SwapNumber} from './swap/shared.js';
/** The words of the card. They are trading terms, so the host supplies them; HIG ships none. */
export interface TradeHistoryDetailLabels {
 title:string;
 /** Caption above the figure: NET PNL. */
 netPnl:string;
 /** `+2.84% on margin`: receives the formatted percent. */
 onMargin:(percent:string)=>string;
 long:string;short:string;
}
/** One label and value row. A number is formatted with `options` between `prefix` and `suffix`; a string is drawn as given, for example a duration the host has already formatted. */
export interface TradeHistoryDetail {label:string;value:string|number;options?:Intl.NumberFormatOptions;prefix?:string;suffix?:string}
export interface TradeHistoryAction {id:string;label:string;onSelect:()=>void;intent?:'primary'|'secondary';disabled?:boolean;busy?:boolean}
export interface TradeHistoryDetailCardProps extends Omit<React.HTMLAttributes<HTMLElement>,'title'> {
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
 /** The trade's figures in the order shown: entry, exit, size, notional, time held, fees, funding. */
 details:readonly TradeHistoryDetail[];
 /** Actions in one row under the details, such as Save image and Share. */
 actions?:readonly TradeHistoryAction[];
 onBack?:()=>void;
 /** A control on the trailing edge of the header, usually an `IconButton`. */
 headerAction?:React.ReactNode;
}
const pnlFormat={style:'currency',currency:'USD',signDisplay:'exceptZero',maximumFractionDigits:4} as const,percentFormat={style:'percent',minimumFractionDigits:2,maximumFractionDigits:2,signDisplay:'exceptZero'} as const;
/** The full record of one closed trade: the asset with its side and leverage, the net result as the headline figure, the trade's figures as rows, and the host's actions. */
export function TradeHistoryDetailCard({labels,name,icon,side,leverage,pnl,pnlPercent,details,actions=[],onBack,headerAction,className,...rest}:TradeHistoryDetailCardProps){
 const {locale}=useHIG();const tone=pnl==null||pnl===0?undefined:pnl>0?'up':'down';
 return <section {...rest} className={`hig-trade-detail${className?` ${className}`:''}`}>
  <ScreenHeader title={labels.title} onBack={onBack} action={headerAction}/>
  <div className='hig-trade-summary'>
   <div className='hig-asset-row hig-position-row'>
    <span className='hig-asset-row-icon' aria-hidden='true'>{typeof icon==='string'?<img src={icon} alt=''/>:icon??name.slice(0,3)}</span>
    <span className='hig-asset-row-identity'><strong>{name}</strong><span><span className='hig-position-side hig-trade-side' data-side={side}><span aria-hidden='true'>{side==='long'?'↑':'↓'} </span>{side==='long'?labels.long:labels.short}</span>{leverage!=null&&<> {formatNumber(leverage,locale)}×</>}</span></span>
   </div>
   <div className='hig-surface hig-trade-result' data-tone={tone}>
    <span className='hig-trade-caption'>{labels.netPnl}</span>
    <strong className='hig-trade-figure'><AnimatedNumberReadout value={pnl} options={pnlFormat}/></strong>
    {pnlPercent!==undefined&&<span className='hig-trade-return'>{pnlPercent===null?labels.onMargin('—'):<SwapNumber template={labels.onMargin} value={pnlPercent} options={percentFormat}/>}</span>}
   </div>
   {details.length>0&&<dl className='hig-surface hig-swap-details hig-trade-details'>{details.map(row=><div key={row.label}><dt>{row.label}</dt><dd>{typeof row.value==='number'?<SwapNumber value={row.value} options={row.options} prefix={row.prefix} suffix={row.suffix}/>:row.value}</dd></div>)}</dl>}
  </div>
  {actions.length>0&&<div className='hig-trade-actions'>{actions.map(action=><Button key={action.id} fullWidth intent={action.intent??'secondary'} disabled={action.disabled} busy={action.busy} onClick={action.onSelect}>{action.label}</Button>)}</div>}
 </section>;
}
