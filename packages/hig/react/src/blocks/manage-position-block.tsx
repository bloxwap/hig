"use client";
import React from 'react';
import {formatNumber} from '@bloxwap/hig/contracts';
import {usePresentNumber,useHIG} from '../provider.js';
import {AnimatedNumberReadout} from '../animated-number.js';
import {BarMark} from '../bar-mark.js';
import {BarPnl} from '../bar-pnl.js';
import {ListGroup,ListRow} from '../list-group.js';
import type {AssetArtwork} from '../asset-balance-row.js';
import {ScreenHeader} from './screen-header.js';
import {SwapNumber} from './swap/shared.js';
/** The words of the block. They are trading terms, so the host supplies them in its own vocabulary and language; HIG ships none. */
export interface ManagePositionBlockLabels {
 title:string;margin:string;
 notional:string;
 liquidation:string;
 /** `99.8% to liquidation`: receives the formatted percent. */
 toLiquidation:(percent:string)=>string;
 mark:string;entry:string;
 /** Accessible words for the direction arrow. */
 long:string;short:string;
}
export interface ManagePositionBlockAction {id:string;label:string;onSelect:()=>void;disabled?:boolean}
/** The position being managed, shown as the row under the actions. */
export interface ManagePositionBlockSummary {
 name:string;icon?:AssetArtwork;
 /** 40 reads `40×`. */
 leverage?:number;
 /** Size in asset units. */
 size?:number|null;
 /** Profit and loss in dollars. */
 pnl?:number|null;
 /** Profit and loss as a fraction: -0.0025 reads -0.25%. */
 pnlPercent?:number|null;
}
export interface ManagePositionBlockProps extends Omit<React.HTMLAttributes<HTMLElement>,'title'> {
 labels:ManagePositionBlockLabels;
 /** Margin mode, the title of the first card: Demo, Cross, Isolated. Without it the title is the margin label. */
 mode?:string;
 side:'long'|'short';entry:number;mark?:number|null;liquidation?:number|null;margin:number;notional:number;
 /** Format of the three prices, such as another currency. They are drawn compact: no extra zeros. */
 priceOptions?:Intl.NumberFormatOptions;
 actions:readonly ManagePositionBlockAction[];
 position?:ManagePositionBlockSummary;
 onBack?:()=>void;
 /** A control on the trailing edge of the header, usually an `IconButton`. */
 headerAction?:React.ReactNode;
}
const usd={style:'currency',currency:'USD'} as const,known=(value:number|null|undefined):value is number=>value!=null&&Number.isFinite(value);
/** Distance left before liquidation. `total` is the span from entry to liquidation, `buffer` what remains of it between the mark and liquidation (the whole span while in profit, nothing once past liquidation), `drawdown` the rest, and `share` the buffer as a fraction. Unknown prices, or a liquidation price on the wrong side of entry, give an empty corridor. */
export function positionCorridor({side,entry,mark,liquidation}:{side:'long'|'short';entry:number;mark?:number|null;liquidation?:number|null}):{total:number;buffer:number;drawdown:number;share:number|null}{
 if(!known(mark)||!known(liquidation))return {total:0,buffer:0,drawdown:0,share:null};
 const span=side==='long'?entry-liquidation:liquidation-entry;if(!(span>0))return {total:0,buffer:0,drawdown:0,share:null};
 const traveled=side==='long'?entry-mark:mark-entry,buffer=Math.max(0,Math.min(span,span-traveled));
 return {total:span,buffer,drawdown:span-buffer,share:buffer/span};
}
/** Manage one open position: margin against notional (with the share left before liquidation) as a `BarMark` and the liquidation, mark and entry prices as a `BarPnl`, both drawn without a card because they are read-only, the host's actions as one `ListGroup` of rows, and the position itself underneath. */
export function ManagePositionBlock({labels,mode,side,entry,mark,liquidation,margin,notional,priceOptions,actions,position,onBack,headerAction,className,...rest}:ManagePositionBlockProps){
 const {locale}=useHIG();const present=usePresentNumber();const corridor=positionCorridor({side,entry,mark,liquidation});
 const pnlTone=!known(position?.pnl)||position.pnl===0?undefined:position.pnl>0?'up':'down';
 return <section {...rest} className={`hig-manage-position-block${className?` ${className}`:''}`}>
  <ScreenHeader title={labels.title} onBack={onBack} action={headerAction}/>
  <div className='hig-token-bars'>
   <BarMark surface={false} title={mode??labels.margin} description={corridor.share===null?labels.toLiquidation('—'):<SwapNumber template={labels.toLiquidation} value={Number((corridor.share*100).toFixed(1))} suffix='%' options={{maximumFractionDigits:1}}/>} elements={[{id:'margin',label:labels.margin,value:margin,detail:formatNumber(margin,locale,present(usd)),tone:'info'},{id:'notional',label:labels.notional,value:known(notional)?Math.max(notional-margin,0):0,detail:known(notional)?formatNumber(notional,locale,present(usd)):'—',tone:'positive'}]}/>
   <BarPnl surface={false} compact side={side} entry={entry} mark={mark} liquidation={liquidation} labels={{liquidation:labels.liquidation,mark:labels.mark,entry:labels.entry}} priceOptions={priceOptions}/>
  </div>
  {actions.length>0&&<ListGroup className='hig-manage-actions'>{actions.map(action=><ListRow key={action.id} label={action.label} disabled={action.disabled} onSelect={action.onSelect}/>)}</ListGroup>}
  {position&&<div className='hig-asset-row hig-position-row'>
   <span className='hig-asset-row-icon' aria-hidden='true'>{typeof position.icon==='string'?<img src={position.icon} alt=''/>:position.icon??position.name.slice(0,3)}</span>
   <span className='hig-asset-row-identity'><strong>{position.name}</strong><span><span className='hig-position-side' data-side={side} aria-hidden='true'>{side==='long'?'↑':'↓'}</span><span className='hig-sr-only'>{side==='long'?labels.long:labels.short}</span>{position.leverage!=null&&<span className='hig-position-side hig-position-leverage' data-side={side}> {formatNumber(position.leverage,locale)}×</span>}{known(position.size)&&<> · <AnimatedNumberReadout value={position.size} options={{maximumFractionDigits:6}}/></>}</span></span>
   <span className='hig-asset-row-amounts'><strong data-tone={pnlTone}><AnimatedNumberReadout value={position.pnl} options={{...usd,signDisplay:'exceptZero',maximumFractionDigits:4}}/></strong><span><AnimatedNumberReadout value={position.pnlPercent} options={{style:'percent',minimumFractionDigits:2,maximumFractionDigits:2,signDisplay:'exceptZero'}}/></span></span>
  </div>}
 </section>;
}
