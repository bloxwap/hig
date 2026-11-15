"use client";
import React from 'react';
import {formatNumber} from '@bloxwap/hig/contracts';
import {useHIG} from '../provider.js';
import {AnimatedNumberReadout} from '../animated-number.js';
import type {AssetArtwork} from '../asset-balance-row.js';
import {ScreenHeader} from './screen-header.js';
/** The words of the card. They are trading terms, so the host supplies them; HIG ships none. */
export interface TradeHistoryListLabels {
 /** Heading of the screen: History. */
 title:string;
 long:string;short:string;
 /** Shown in place of the rows when there are no trades. */
 empty:string;
}
/** One closed trade. */
export interface TradeHistoryItem {
 id:string;
 /** Asset name: Amazon. */
 name:string;
 /** Round artwork: an image URL or a host element. Without it the row shows the first letters of the name. */
 icon?:AssetArtwork;
 side:'long'|'short';
 /** 20 reads `20×`. */
 leverage?:number;
 /** Net profit and loss in dollars. `null` reads as unknown. */
 pnl:number|null;
 /** Host-formatted age or time of the close, shown under the result: `2d`. */
 time?:string;
}
export interface TradeHistoryListBlockProps extends Omit<React.HTMLAttributes<HTMLElement>,'title'|'onSelect'> {
 labels:TradeHistoryListLabels;
 /** Closed trades, in the order shown. The host sorts and pages them. */
 trades:readonly TradeHistoryItem[];
 /** Makes each row a button that reports its trade, usually to open its detail, and shows the disclosure chevron. */
 onSelect?:(trade:TradeHistoryItem)=>void;
 /** Shows Back on the leading edge of the header. */
 onBack?:()=>void;
 /** A control on the trailing edge of the header, usually an `IconButton`. */
 headerAction?:React.ReactNode;
 /** Format of the result. Defaults to signed US dollars at four significant digits: `+$1.412`, `+$17.90`, `-$0.6878`. */
 pnlOptions?:Intl.NumberFormatOptions;
}
const pnlFormat={style:'currency',currency:'USD',signDisplay:'exceptZero',minimumSignificantDigits:4,maximumSignificantDigits:4} as const;
/** How a row reads its side: `Short 20×`, or `Short` without leverage. */
export const tradeHistorySide=(trade:Pick<TradeHistoryItem,'side'|'leverage'>,labels:Pick<TradeHistoryListLabels,'long'|'short'>,locale?:string):string=>`${trade.side==='long'?labels.long:labels.short}${trade.leverage!=null?` ${formatNumber(trade.leverage,locale)}×`:''}`;
const arrow=(side:'long'|'short')=><svg aria-hidden='true' focusable='false' viewBox='0 0 16 16' width='16' height='16' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'>{side==='long'?<path d='M8 13V3.5M4 7.5l4-4 4 4'/>:<path d='M8 3v9.5M4 8.5l4 4 4-4'/>}</svg>;
const chevron=<svg className='hig-trade-row-chevron' aria-hidden='true' focusable='false' viewBox='0 0 20 20' width='20' height='20' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'><path d='m7.5 4.5 5.5 5.5-5.5 5.5'/></svg>;
/** A history of closed trades as one screen: a header, then one row per trade with the asset, its side and leverage in the direction colour, and the net result in the result colour over its age. */
export function TradeHistoryListBlock({labels,trades,onSelect,onBack,headerAction,pnlOptions=pnlFormat,className,...rest}:TradeHistoryListBlockProps){
 const {locale}=useHIG();
 const row=(trade:TradeHistoryItem)=>{
  const side=tradeHistorySide(trade,labels,locale),tone=trade.pnl==null||trade.pnl===0?undefined:trade.pnl>0?'up':'down';
  const content=<>
   <span className='hig-asset-row-icon' aria-hidden='true'>{typeof trade.icon==='string'?<img src={trade.icon} alt=''/>:trade.icon??trade.name.slice(0,3)}</span>
   <span className='hig-trade-row-identity'><strong>{trade.name}</strong><span className='hig-trade-row-side' data-side={trade.side}>{arrow(trade.side)}<span className='hig-sr-only'>{trade.side==='long'?labels.long:labels.short} </span>{trade.leverage!=null&&`${formatNumber(trade.leverage,locale)}×`}</span></span>
   <span className='hig-trade-row-result'><strong className='hig-trade-pnl' data-tone={tone}><AnimatedNumberReadout value={trade.pnl} options={pnlOptions}/></strong>{trade.time&&<span>{trade.time}</span>}</span>
   {onSelect&&chevron}
  </>;
  return <li key={trade.id}>{onSelect?<button type='button' className='hig-trade-row' aria-label={[trade.name,side,formatNumber(trade.pnl,locale,pnlOptions),trade.time].filter(Boolean).join(', ')} onClick={()=>onSelect(trade)}>{content}</button>:<div className='hig-trade-row'>{content}</div>}</li>;
 };
 return <section {...rest} className={`hig-trade-history-list${className?` ${className}`:''}`}>
  <ScreenHeader title={labels.title} onBack={onBack} action={headerAction}/>
  {trades.length===0?<p className='hig-swap-empty' role='status'>{labels.empty}</p>:<ul className='hig-trade-rows' aria-label={labels.title}>{trades.map(row)}</ul>}
 </section>;
}
