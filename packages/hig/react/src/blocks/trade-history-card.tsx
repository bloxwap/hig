"use client";
import React from 'react';
import {formatNumber} from '@bloxwap/hig/contracts';
import {useHIG} from '../provider.js';
import {AnimatedNumberReadout} from '../animated-number.js';
import {BarPnl} from '../bar-pnl.js';
/** The words of the card. They are trading terms, so the host supplies them; HIG ships none. */
export interface TradeHistoryLabels {entry:string;exit:string;long:string;short:string}
export interface TradeHistoryCardProps extends Omit<React.HTMLAttributes<HTMLElement>,'title'|'onSelect'> {
 labels:TradeHistoryLabels;
 /** Ticker: AMZN. */
 symbol:string;
 side:'long'|'short';
 /** 20 reads `20×`. */
 leverage?:number;
 entry:number;exit:number;
 /** Net profit and loss in dollars, on the trailing edge of the title row. */
 pnl?:number|null;
 /** Format of the two prices. Defaults to US dollars. */
 priceOptions?:Intl.NumberFormatOptions;
 /** Set false to draw no card: no surface fill, padding or radius. Default `true`. */
 surface?:boolean;
 /** Makes the whole card a button, for example to open the trade's detail. */
 onSelect?:()=>void;
}
const pnlFormat={style:'currency',currency:'USD',signDisplay:'exceptZero',maximumFractionDigits:4} as const;
/** The card's heading: `AMZN · Short 20×`, or `AMZN · Short` without leverage. */
export const tradeHistoryTitle=({symbol,side,leverage,labels}:{symbol:string;side:'long'|'short';leverage?:number;labels:Pick<TradeHistoryLabels,'long'|'short'>},locale?:string):string=>`${symbol} · ${side==='long'?labels.long:labels.short}${leverage!=null?` ${formatNumber(leverage,locale)}×`:''}`;
/** One closed trade: the asset, side and leverage, the net profit and loss, and one bar from the entry price to the exit price, tinted by the result. */
export function TradeHistoryCard({labels,symbol,side,leverage,entry,exit,pnl,priceOptions,surface=true,onSelect,className,...rest}:TradeHistoryCardProps){
 const {locale}=useHIG();const title=tradeHistoryTitle({symbol,side,leverage,labels},locale);
 const tone=pnl==null||pnl===0?undefined:pnl>0?'up':'down';
 const bar=<BarPnl {...(onSelect?{}:rest)} className={onSelect?undefined:className} surface={surface} fit side={side} entry={entry} mark={exit} labels={{entry:labels.entry,mark:labels.exit,liquidation:''}} priceOptions={priceOptions} title={title} description={pnl===undefined?undefined:<span className='hig-trade-pnl' data-tone={tone}><AnimatedNumberReadout value={pnl} options={pnlFormat}/></span>}/>;
 if(!onSelect)return bar;
 // The button lies over the card and carries its name; the card's own text stays readable underneath.
 return <div {...rest} className={`hig-trade-history-card${className?` ${className}`:''}`}>{bar}<button type='button' className='hig-swap-hit' aria-label={pnl==null?title:`${title}, ${formatNumber(pnl,locale,pnlFormat)}`} onClick={onSelect}/></div>;
}
