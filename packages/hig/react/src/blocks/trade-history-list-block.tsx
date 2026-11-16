"use client";
import React from 'react';
import {formatNumber} from '@bloxwap/hig/contracts';
import {PressDecoration,usePresentNumber,useNumberLocale} from '../provider.js';
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
 /** A second line under `empty`, in the muted colour: Closed trades appear here. */
 emptyDescription?:string;
}
/** One closed trade. */
export interface TradeHistoryItem {
 id:string;
 /** Asset name: Amazon. */
 name:string;
 /** Short ticker for the fallback disc when there is no `icon`: BTC. Without it the disc shows the first letters of the name. */
 symbol?:string;
 /** Round artwork: an image URL or a host element. Without it the row shows `symbol` or the first letters of the name. */
 icon?:AssetArtwork;
 side:'long'|'short';
 /** 20 reads `20×`. */
 leverage?:number;
 /** A short muted qualifier after the leverage, read with it: current. Use it when the leverage was not recorded with the trade. */
 leverageNote?:string;
 /** Net profit and loss in dollars. `null` reads as unknown. */
 pnl:number|null;
 /** Host-formatted age or time of the close, shown under the result: `2d`. */
 time?:string;
 /** Small muted host text before the age, such as the wallet the trade came from: `0x22…22`. */
 tag?:string;
 /** Format of this trade's result, in place of the block's `pnlOptions`, for a host whose decimal ladder depends on the amount. */
 pnlOptions?:Intl.NumberFormatOptions;
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
 /** `id` of the header's heading, so a host dialog or sheet can name itself with `aria-labelledby`. */
 headingId?:string;
 /** Format of the result. Defaults to signed US dollars at four significant digits: `+$1.412`, `+$17.90`, `-$0.6878`. The provider's `numberFormat` is merged under it. */
 pnlOptions?:Intl.NumberFormatOptions;
 /** Draws rows of skeletons in place of the trades while the host loads them. */
 loading?:boolean;
 /** Host text that names the skeleton rows for assistive technology and announces them: Loading history. Without it they are only marked busy. */
 loadingLabel?:string;
 /** Why the trades could not load, in place of the rows, in the negative colour and announced. */
 error?:string;
 /** Host content under the header, above the rows: a partial-history notice or a mode banner. */
 notice?:React.ReactNode;
 /** Host content under the rows: paging, a spinner for the next page, a note. */
 footer?:React.ReactNode;
 /** Pins the header to the top of the nearest scrolling container, transparent at rest and filled with `--hig-sticky-header-background` once the rows scroll under it. */
 stickyHeader?:boolean;
}
const pnlFormat={style:'currency',currency:'USD',signDisplay:'exceptZero',minimumSignificantDigits:4,maximumSignificantDigits:4} as const;
const skeletons=[0,1,2,3];
/** How a row reads its side: `Short 20×`, or `Short` without leverage. */
export const tradeHistorySide=(trade:Pick<TradeHistoryItem,'side'|'leverage'>&{leverageNote?:string},labels:Pick<TradeHistoryListLabels,'long'|'short'>,locale?:string):string=>`${trade.side==='long'?labels.long:labels.short}${trade.leverage!=null?` ${formatNumber(trade.leverage,locale)}×`:''}${trade.leverageNote?` ${trade.leverageNote}`:''}`;
const arrow=(side:'long'|'short')=><svg aria-hidden='true' focusable='false' viewBox='0 0 16 16' width='16' height='16' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'>{side==='long'?<path d='M8 13V3.5M4 7.5l4-4 4 4'/>:<path d='M8 3v9.5M4 8.5l4 4 4-4'/>}</svg>;
const chevron=<svg className='hig-trade-row-chevron' aria-hidden='true' focusable='false' viewBox='0 0 20 20' width='20' height='20' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'><path d='m7.5 4.5 5.5 5.5-5.5 5.5'/></svg>;
/** A history of closed trades as one screen: a header, then one row per trade with the asset, its side and leverage in the market direction colour, and the net result in the market direction colour over its age. */
export function TradeHistoryListBlock({labels,trades,onSelect,onBack,headerAction,pnlOptions=pnlFormat,loading,loadingLabel,error,notice,footer,stickyHeader,headingId,className,...rest}:TradeHistoryListBlockProps){
 const locale=useNumberLocale();const present=usePresentNumber();
 const row=(trade:TradeHistoryItem)=>{
  const result=trade.pnlOptions??pnlOptions;
  const side=tradeHistorySide(trade,labels,locale),tone=trade.pnl==null||trade.pnl===0?undefined:trade.pnl>0?'up':'down';
  const content=<>
   <span className='hig-asset-row-icon' aria-hidden='true'>{typeof trade.icon==='string'?<img src={trade.icon} alt=''/>:trade.icon??trade.symbol??trade.name.slice(0,3)}</span>
   <span className='hig-trade-row-identity'><strong>{trade.name}</strong><span className='hig-trade-row-side' data-side={trade.side}>{arrow(trade.side)}<span className='hig-sr-only'>{trade.side==='long'?labels.long:labels.short} </span>{trade.leverage!=null&&`${formatNumber(trade.leverage,locale)}×`}{trade.leverageNote&&<span className='hig-trade-row-note'>{trade.leverageNote}</span>}</span></span>
   <span className='hig-trade-row-result'><strong className='hig-trade-pnl' data-tone={tone}><AnimatedNumberReadout value={trade.pnl} options={result}/></strong>{trade.tag?<span className='hig-trade-row-meta'><span className='hig-trade-row-tag'>{trade.tag}</span>{trade.time&&<><span aria-hidden='true'>·</span><span>{trade.time}</span></>}</span>:trade.time&&<span>{trade.time}</span>}</span>
   {onSelect&&chevron}
  </>;
  return <li key={trade.id}>{onSelect?<button type='button' className='hig-trade-row' aria-label={[trade.name,side,formatNumber(trade.pnl,locale,present(result)),trade.tag,trade.time].filter(Boolean).join(', ')} onClick={()=>onSelect(trade)}>{content}<PressDecoration kind='row'/></button>:<div className='hig-trade-row'>{content}</div>}</li>;
 };
 const body=loading?<>{loadingLabel&&<p className='hig-sr-only' role='status'>{loadingLabel}</p>}<div className='hig-trade-rows' aria-busy='true'>{skeletons.map(index=><div key={index} className='hig-skeleton hig-trade-skeleton' aria-hidden='true'/>)}</div></>
  :error?<p className='hig-swap-empty hig-trade-error' role='alert'>{error}</p>
  :trades.length===0?<p className='hig-swap-empty' role='status'>{labels.emptyDescription?<><strong className='hig-trade-empty-title'>{labels.empty}</strong><span className='hig-trade-empty-description'>{labels.emptyDescription}</span></>:labels.empty}</p>
  :<ul className='hig-trade-rows' aria-label={labels.title}>{trades.map(row)}</ul>;
 return <section {...rest} className={`hig-trade-history-list${className?` ${className}`:''}`}>
  <ScreenHeader title={labels.title} onBack={onBack} action={headerAction} headingId={headingId} stickyHeader={stickyHeader}/>
  {notice!=null&&notice!==false&&<div className='hig-trade-notice'>{notice}</div>}
  {body}
  {footer!=null&&footer!==false&&<div className='hig-trade-footer'>{footer}</div>}
 </section>;
}
