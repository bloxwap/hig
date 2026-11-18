"use client";
import { ArrowDown } from '@bloxwap/icons/react/arrow-down';
import { ArrowUp } from '@bloxwap/icons/react/arrow-up';
import { ChevronRight } from '@bloxwap/icons/react/chevron-right';
import {RowWindow} from '../row-window.js';
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
function formatLeverageText(leverage:number|null|undefined,locale?:string){
 return leverage==null?'':`${formatNumber(leverage,locale)}×`;
}
function sideText(label:string,leverage:string,note?:string){
 return `${label}${leverage?' '+leverage:''}${note?' '+note:''}`;
}
/** How a row reads its side: `Short 20×`, or `Short` without leverage. */
export const tradeHistorySide=(trade:Pick<TradeHistoryItem,'side'|'leverage'>&{leverageNote?:string},labels:Pick<TradeHistoryListLabels,'long'|'short'>,locale?:string):string=>sideText(trade.side==='long'?labels.long:labels.short,formatLeverageText(trade.leverage,locale),trade.leverageNote);
const arrow=(side:'long'|'short')=>(side==='long'?<ArrowUp size={16}/>:<ArrowDown size={16}/>);
const chevron=<ChevronRight size={20} className='hig-trade-row-chevron'/>;
const TradeRow=React.memo(function TradeRow({trade,long,short,onSelect,pnlOptions}:{
 trade:TradeHistoryItem;long:string;short:string;onSelect?:TradeHistoryListBlockProps['onSelect'];pnlOptions:Intl.NumberFormatOptions;
}){
 const locale=useNumberLocale();const present=usePresentNumber();
 const pnl=trade.pnl;
  const result=trade.pnlOptions??pnlOptions;
  const tone=pnl==null||pnl===0?undefined:pnl>0?'up':'down';
  const formatKey=result===pnlFormat?undefined:JSON.stringify(result);
  const leverage=React.useMemo(()=>formatLeverageText(trade.leverage,locale),[trade.leverage,locale]);
  const interactive=!!onSelect;
  const spokenPnl=React.useMemo(()=>interactive?formatNumber(pnl,locale,present(result)):'',[interactive,pnl,locale,present,result,formatKey]);
  const amount=React.useMemo(()=><AnimatedNumberReadout value={pnl} options={result}/>,[pnl,result,formatKey]);
  const content=<>
   <span className='hig-asset-row-icon' aria-hidden='true'>{typeof trade.icon==='string'?<img src={trade.icon} alt=''/>:trade.icon??trade.symbol??trade.name.slice(0,3)}</span>
   <span className='hig-trade-row-identity'><strong>{trade.name}</strong><span className='hig-trade-row-side' data-side={trade.side}>{arrow(trade.side)}<span className='hig-sr-only'>{trade.side==='long'?long:short} </span>{leverage}{trade.leverageNote&&<span className='hig-trade-row-note'>{trade.leverageNote}</span>}</span></span>
   <span className='hig-trade-row-result'><strong className='hig-trade-pnl' data-tone={tone}>{amount}</strong>{trade.tag?<span className='hig-trade-row-meta'><span className='hig-trade-row-tag'>{trade.tag}</span>{trade.time&&<><span aria-hidden='true'>·</span><span>{trade.time}</span></>}</span>:trade.time&&<span>{trade.time}</span>}</span>
   {onSelect&&chevron}
  </>;
  return onSelect?<button type='button' className='hig-trade-row' aria-label={[trade.name,sideText(trade.side==='long'?long:short,leverage,trade.leverageNote),spokenPnl,trade.tag,trade.time].filter(Boolean).join(', ')} onClick={()=>onSelect(trade)}>{content}<PressDecoration kind='row'/></button>:<div className='hig-trade-row'>{content}</div>;
});
/** A history of closed trades as one screen: a header, then one row per trade with the asset, its side and leverage in the market direction colour, and the net result in the market direction colour over its age. */
export function TradeHistoryListBlock({labels,trades,onSelect,onBack,headerAction,pnlOptions=pnlFormat,loading,loadingLabel,error,notice,footer,stickyHeader,headingId,className,...rest}:TradeHistoryListBlockProps){
 const row=(trade:TradeHistoryItem)=><li key={trade.id}><TradeRow trade={trade} long={labels.long} short={labels.short} onSelect={onSelect} pnlOptions={pnlOptions}/></li>;
 const body=loading?<>{loadingLabel&&<p className='hig-sr-only' role='status'>{loadingLabel}</p>}<div className='hig-trade-rows' aria-busy='true'>{skeletons.map(index=><div key={index} className='hig-skeleton hig-trade-skeleton' aria-hidden='true'/>)}</div></>
  :error?<p className='hig-swap-empty hig-trade-error' role='alert'>{error}</p>
  :trades.length===0?<p className='hig-swap-empty' role='status'>{labels.emptyDescription?<><strong className='hig-trade-empty-title'>{labels.empty}</strong><span className='hig-trade-empty-description'>{labels.emptyDescription}</span></>:labels.empty}</p>
  :trades.length>50?<RowWindow items={trades} itemKey='id' className='hig-trade-rows' label={labels.title} rowHeight={56} gap={8} tabThrough={!!onSelect} renderRow={row}/>:<ul className='hig-trade-rows' aria-label={labels.title}>{trades.map(row)}</ul>;
 return <section {...rest} className={`hig-trade-history-list${className?` ${className}`:''}`}>
  <ScreenHeader title={labels.title} onBack={onBack} action={headerAction} headingId={headingId} stickyHeader={stickyHeader}/>
  {notice!=null&&notice!==false&&<div className='hig-trade-notice'>{notice}</div>}
  {body}
  {footer!=null&&footer!==false&&<div className='hig-trade-footer'>{footer}</div>}
 </section>;
}
