"use client";
import React,{useId} from 'react';
import {NumberFlow} from './animated-number.js';
export type BarPnlSide='long'|'short';
export type BarPnlResult='profit'|'loss'|'flat';
export type BarPnlKind='liquidation'|'mark'|'entry';
export interface BarPnlProps extends Omit<React.HTMLAttributes<HTMLElement>,'title'> {
 /** Price the position was opened at. */
 entry:number;
 /** Current mark price. `null` or omitted reads as unknown and draws no profit or loss. */
 mark?:number|null;
 /** Liquidation price. Omit it, or pass `null`, for a position that cannot be liquidated. */
 liquidation?:number|null;
 /** Direction of the position. Defaults to `long` when the liquidation price is below entry (or unknown) and `short` when it is above. */
 side?:BarPnlSide;
 /** Host text for the three prices, for example `{liquidation:'Liquidation',mark:'Mark',entry:'Entry'}`. HIG ships no trading terms of its own. */
 labels:Record<BarPnlKind,string>;
 /** Heading on the leading edge above the bar, such as `BTC Long 10×`. */
 title?:string;
 /** A line on the trailing edge of the title row, such as the profit or loss in dollars. */
 description?:React.ReactNode;
 /** Format of the three prices. Defaults to US dollars. */
 priceOptions?:Intl.NumberFormatOptions;
 /** Shortens the three prices for narrow screens: `$64,700` for `$64,700.00`, `$142.96`, `$0.4821`. Trailing zeros are dropped. Default `false`. */
 compact?:boolean;
 /** Scales the bar to the prices themselves, so the stretch from entry to mark fills it. For a finished trade, where the move is the whole story. Default `false`. */
 fit?:boolean;
 /** Set false to draw no card: no surface fill, padding or radius. The title row, bar and readouts keep their spacing. Default `true`. */
 surface?:boolean;
}
const usd={style:'currency',currency:'USD'} as const;
const finite=(value:number|null|undefined):value is number=>typeof value==='number'&&Number.isFinite(value);
/** Price format for `compact`: no fraction at 1,000 and above, at most two fraction digits from 1, and four significant digits below 1, with trailing zeros dropped. Host `priceOptions` (such as the currency) are kept. */
export function barPnlCompactOptions(value:number|null|undefined,base:Intl.NumberFormatOptions=usd):Intl.NumberFormatOptions{
 const size=finite(value)?Math.abs(value):0;
 return size>0&&size<1?{...base,minimumFractionDigits:undefined,maximumFractionDigits:undefined,maximumSignificantDigits:4}:{...base,minimumFractionDigits:0,maximumFractionDigits:size>=1000?0:2};
}
/**
 * Where each price sits on the bar, as a fraction of its width from the low-price edge, the readouts in price order, and
 * whether the position is in profit. With a liquidation price the bar runs from it to the same distance on the other side
 * of entry, so entry sits in the middle; a mark beyond either end stretches the bar. Without one the bar is centred on entry.
 */
export function barPnlLayout({entry,mark,liquidation,side,fit}:{entry:number;mark?:number|null;liquidation?:number|null;side?:BarPnlSide;fit?:boolean}):{side:BarPnlSide;result:BarPnlResult;positions:Partial<Record<BarPnlKind,number>>;order:BarPnlKind[]}{
 const liq=finite(liquidation)?liquidation:null;
 const direction=side??(liq!==null&&liq>entry?'short':'long');
 const result:BarPnlResult=!finite(entry)||!finite(mark)||mark===entry?'flat':(mark>entry)===(direction==='long')?'profit':'loss';
 if(!finite(entry))return {side:direction,result,positions:{},order:[]};
 const price=finite(mark)?mark:entry;
 const reach=liq!==null?Math.abs(entry-liq):Math.max(Math.abs(price-entry)*2,Math.abs(entry)*0.01,Number.MIN_VALUE);
 // `fit` scales the bar to the prices themselves, so the stretch from entry to mark fills it.
 const points=liq!==null?[entry,price,liq]:[entry,price];
 const low=fit?Math.min(...points):Math.min(entry-reach,price),high=fit?Math.max(...points):Math.max(entry+reach,price),span=high-low;
 const at=(value:number)=>span>0?Math.min(1,Math.max(0,(value-low)/span)):0.5;
 const positions:Partial<Record<BarPnlKind,number>>={entry:at(entry),mark:at(price)};
 if(liq!==null)positions.liquidation=at(liq);
 // Ties keep liquidation outermost and put mark on the side it would move to next.
 const rank:Record<BarPnlKind,number>={liquidation:direction==='long'?0:2,entry:1,mark:direction==='long'?(result==='loss'?0.5:1.5):(result==='loss'?1.5:0.5)};
 const values:Record<BarPnlKind,number>={liquidation:liq??0,entry,mark:price};
 const order=(Object.keys(positions) as BarPnlKind[]).sort((a,b)=>values[a]-values[b]||rank[a]-rank[b]);
 return {side:direction,result,positions,order};
}
/** A position's profit or loss as one bar: the stretch between entry and mark is filled solid in the result colour, a tick marks each price, and the liquidation, mark and entry prices read under the bar in price order, so mark and entry trade places as the position moves. */
export function BarPnl({entry,mark,liquidation,side,labels,title,description,priceOptions=usd,compact=false,fit=false,surface=true,className,...rest}:BarPnlProps){
 const id=useId();
 const {result,positions,order}=barPnlLayout({entry,mark,liquidation,side,fit});
 const from=Math.min(positions.entry??0.5,positions.mark??0.5),to=Math.max(positions.entry??0.5,positions.mark??0.5);
 const values:Record<BarPnlKind,number|null|undefined>={liquidation,mark,entry};
 return <section {...rest} className={`${surface?'hig-surface ':''}hig-bar-pnl${className?` ${className}`:''}`} data-surface={surface?undefined:'false'} data-result={result} aria-labelledby={title?id:undefined}>
  {(title||description!=null)&&<div className='hig-bar-mark-header'>{title&&<strong id={id} className='hig-bar-mark-title'>{title}</strong>}{description!=null&&<span className='hig-bar-mark-description'>{description}</span>}</div>}
  <div className='hig-bar-pnl-bar' aria-hidden='true'>
   <span className='hig-bar-pnl-rest' style={{flexGrow:from}}/>
   <span className='hig-bar-pnl-move' data-lead={(positions.mark??0)<(positions.entry??0)?'mark':'entry'} style={{flexGrow:to-from}}/>
   <span className='hig-bar-pnl-rest' style={{flexGrow:1-to}}/>
   {positions.liquidation!==undefined&&<span className='hig-bar-pnl-liquidation' style={{insetInlineStart:`${positions.liquidation*100}%`}}/>}
  </div>
  <dl className='hig-bar-pnl-readouts'>{order.map(kind=><div key={kind} data-kind={kind}><dt>{labels[kind]}</dt><dd><NumberFlow motion="slide" value={values[kind]} options={compact?barPnlCompactOptions(values[kind],priceOptions):priceOptions}/></dd></div>)}</dl>
 </section>;
}
