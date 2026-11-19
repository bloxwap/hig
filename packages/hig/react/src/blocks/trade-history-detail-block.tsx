"use client";
import React from 'react';
import {formatNumber} from '@bloxwap/hig/contracts/format';
import {useNumberLocale} from '../provider.js';
import {Button} from '../button.js';
import {NumberFlow} from '../animated-number.js';
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
export interface TradeHistoryDetail {label:string;value:string|number;options?:Intl.NumberFormatOptions;prefix?:string;suffix?:string;
 /** With a number `value`: host-formatted text drawn and read in place of Intl's, still moving place by place. */
 formattedValue?:string}
export interface TradeHistoryAction {id:string;label:string;onSelect:()=>void;intent?:'primary'|'secondary';disabled?:boolean;busy?:boolean}
export interface TradeHistoryDetailBlockProps extends Omit<React.HTMLAttributes<HTMLElement>,'title'> {
 labels:TradeHistoryDetailLabels;
 /** Asset name: Amazon. */
 name:string;icon?:AssetArtwork;
 /** Short ticker for the fallback disc when there is no `icon`: BTC. Without it the disc shows the first letters of the name. */
 symbol?:string;
 side:'long'|'short';
 /** 20 reads `20×`. */
 leverage?:number;
 /** A short muted qualifier after the leverage, read with it: current. */
 leverageNote?:string;
 /** Net profit and loss in dollars. `null` reads as unknown. */
 pnl:number|null;
 /** Format of the headline result. Defaults to signed US dollars with up to four decimals. The provider's `numberFormat` is merged under it. */
 pnlOptions?:Intl.NumberFormatOptions;
 /** Return on margin as a fraction: 0.0284 reads +2.84%. */
 pnlPercent?:number|null;
 /** Format of the return on margin. Defaults to a signed percent with two decimals. */
 percentOptions?:Intl.NumberFormatOptions;
 /** Entry and exit prices. With both, one bar runs from entry to exit in the result colour, with the two prices under it, in place of two rows. */
 entry?:number;exit?:number;
 /** Format of the two prices. Defaults to US dollars. */
 priceOptions?:Intl.NumberFormatOptions;
 /** The trade's other figures in the order shown: size, notional, time held, fees, funding. They are drawn as a grid of small labels over values. */
 details:readonly TradeHistoryDetail[];
 /** One muted sentence under the details, such as that part of the record is missing. */
 note?:string;
 /** Short host text in a badge beside the title: Demo. */
 badge?:string;
 /** Actions in one row under the details, such as Save image and Share. */
 actions?:readonly TradeHistoryAction[];
 onBack?:()=>void;
 /** A control on the trailing edge of the header, usually an `IconButton`. */
 headerAction?:React.ReactNode;
 /** `id` of the header's heading, so a host dialog or sheet can name itself with `aria-labelledby`. */
 headingId?:string;
 /** Ref to the summary (the asset line, the headline figure and the return), for a host that captures it as an image. */
 summaryRef?:React.Ref<HTMLDivElement>;
 /** Fills the summary, so an image captured from `summaryRef` is not transparent: `true` for the background role, or a CSS colour such as `var(--hig-overlay)` in a sheet. */
 summaryBackground?:boolean|string;
 /** Pins the header to the top of the nearest scrolling container, transparent at rest and filled with `--hig-sticky-header-background` once content scrolls under it. */
 stickyHeader?:boolean;
}
const pnlFormat={style:'currency',currency:'USD',signDisplay:'exceptZero',maximumFractionDigits:4} as const,percentFormat={style:'percent',minimumFractionDigits:2,maximumFractionDigits:2,signDisplay:'exceptZero'} as const;
/** The full record of one closed trade, drawn on the screen without cards because none of it is pressable: the asset with its side and leverage on one line, the net result as the headline figure, a bar from the entry price to the exit price, the other figures as a compact grid, and the host's actions. */
export function TradeHistoryDetailBlock({labels,name,icon,symbol,side,leverage,leverageNote,pnl,pnlOptions=pnlFormat,pnlPercent,percentOptions=percentFormat,entry,exit,priceOptions,details,note,badge,actions=[],onBack,headerAction,summaryRef,summaryBackground,stickyHeader,headingId,className,...rest}:TradeHistoryDetailBlockProps){
 const locale=useNumberLocale();const tone=pnl==null||pnl===0?undefined:pnl>0?'up':'down';
 const fill=summaryBackground===true?'var(--hig-background)':typeof summaryBackground==='string'&&summaryBackground?summaryBackground:undefined;
 return <section {...rest} className={`hig-trade-detail${className?` ${className}`:''}`}>
  <ScreenHeader title={labels.title} onBack={onBack} action={headerAction} badge={badge} headingId={headingId} stickyHeader={stickyHeader}/>
  <div className='hig-trade-summary'>
   <div ref={summaryRef} className='hig-trade-result' data-tone={tone} style={fill?{background:fill}:undefined}>
    <div className='hig-trade-identity'>
     <span className='hig-trade-avatar' aria-hidden='true'>{typeof icon==='string'?<img src={icon} alt=''/>:icon??symbol??name.slice(0,3)}</span>
     <strong>{name}</strong>
     <span><span className='hig-position-side hig-trade-side' data-side={side}><span aria-hidden='true'>{side==='long'?'↑':'↓'} </span>{side==='long'?labels.long:labels.short}</span>{leverage!=null&&<> {formatNumber(leverage,locale)}×</>}{leverageNote&&<> <span className='hig-trade-leverage-note'>{leverageNote}</span></>}</span>
    </div>
    <strong className='hig-trade-figure'><span className='hig-trade-caption hig-sr-only'>{labels.netPnl} </span><NumberFlow value={pnl} options={pnlOptions}/></strong>
    {pnlPercent!==undefined&&<span className='hig-trade-return'>{pnlPercent===null?labels.onMargin('—'):<SwapNumber template={labels.onMargin} value={pnlPercent} options={percentOptions}/>}</span>}
   </div>
   {entry!=null&&exit!=null&&<BarPnl className='hig-trade-bar' surface={false} fit side={side} entry={entry} mark={exit} labels={{entry:labels.entry??'',mark:labels.exit??'',liquidation:''}} priceOptions={priceOptions}/>}
   {details.length>0&&<dl className='hig-trade-details'>{details.map(row=><div key={row.label}><dt>{row.label}</dt><dd>{typeof row.value==='number'?<SwapNumber value={row.value} options={row.options} prefix={row.prefix} suffix={row.suffix} formattedValue={row.formattedValue} animateFormatted={!!row.formattedValue}/>:row.value}</dd></div>)}</dl>}
   {note&&<p className='hig-trade-note'>{note}</p>}
  </div>
  {actions.length>0&&<div className='hig-trade-actions'>{actions.map(action=><Button key={action.id} fullWidth intent={action.intent??'secondary'} disabled={action.disabled} busy={action.busy} onClick={action.onSelect}>{action.label}</Button>)}</div>}
 </section>;
}
