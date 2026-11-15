"use client";
import React,{useId} from 'react';
import {formatNumber} from '@bloxwap/hig/contracts';
import {PressDecoration,usePresentNumber,useHIG} from '../provider.js';
import {Badge} from '../status.js';
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
/** A number the host supplies as a number so it updates place by place: `{value:66000,options:{style:'currency',currency:'USD'}}`. `null` reads as unknown. */
export interface ManagePositionBlockFigure {value:number|null;options?:Intl.NumberFormatOptions;prefix?:string;suffix?:string}
export interface ManagePositionBlockAction {
 id:string;label:string;onSelect:()=>void;disabled?:boolean;
 /** Trailing value of the row, before the chevron: host text or a live figure, such as the price a resting trigger is set at. */
 value?:string|ManagePositionBlockFigure;
 /** Colours `value`. The default is the muted value colour. */
 tone?:'positive'|'negative'|'muted';
}
/** The position being managed, shown as the row under the actions. */
export interface ManagePositionBlockSummary {
 name:string;icon?:AssetArtwork;
 /** Host text after the name, drawn as a small `Badge`, such as a venue. */
 badge?:string;
 /** One line under the row, such as that the profit and loss is stale or estimated. */
 caption?:string;
 /** Makes the whole row a button, for example one that opens the market. Needs `label`. */
 onSelect?:()=>void;
 /** Accessible name of the row when it is a button: View Bitcoin. The figures are its description. */
 label?:string;
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
 /** Format of the position's profit and loss, merged over the default: signed US dollars with up to four decimals. */
 pnlOptions?:Intl.NumberFormatOptions;
 onBack?:()=>void;
 /** A control on the trailing edge of the header, usually an `IconButton`. */
 headerAction?:React.ReactNode;
 /** `id` of the heading, so a dialog or sheet can name itself with `aria-labelledby`. */
 headingId?:string;
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
export function ManagePositionBlock({labels,mode,side,entry,mark,liquidation,margin,notional,priceOptions,actions,position,pnlOptions,onBack,headerAction,headingId,className,...rest}:ManagePositionBlockProps){
 const {locale}=useHIG();const present=usePresentNumber();const corridor=positionCorridor({side,entry,mark,liquidation});
 const pnlTone=!known(position?.pnl)||position.pnl===0?undefined:position.pnl>0?'up':'down';
 const pnlFormat:Intl.NumberFormatOptions={...usd,signDisplay:'exceptZero',maximumFractionDigits:4,...pnlOptions};
 const content=(position:ManagePositionBlockSummary,ids?:{identity:string;amounts:string})=><>
  <span className='hig-asset-row-icon' aria-hidden='true'>{typeof position.icon==='string'?<img src={position.icon} alt=''/>:position.icon??position.name.slice(0,3)}</span>
  <span id={ids?.identity} className='hig-asset-row-identity'>{position.badge?<span className='hig-position-name'><strong>{position.name}</strong><Badge className='hig-position-badge'>{position.badge}</Badge></span>:<strong>{position.name}</strong>}<span><span className='hig-position-side' data-side={side} aria-hidden='true'>{side==='long'?'↑':'↓'}</span><span className='hig-sr-only'>{side==='long'?labels.long:labels.short}</span>{position.leverage!=null&&<span className='hig-position-side hig-position-leverage' data-side={side}> {formatNumber(position.leverage,locale)}×</span>}{known(position.size)&&<> · <AnimatedNumberReadout value={position.size} options={{maximumFractionDigits:6}}/></>}</span></span>
  <span id={ids?.amounts} className='hig-asset-row-amounts'><strong data-tone={pnlTone}><AnimatedNumberReadout value={position.pnl} options={pnlFormat}/></strong><span><AnimatedNumberReadout value={position.pnlPercent} options={{style:'percent',minimumFractionDigits:2,maximumFractionDigits:2,signDisplay:'exceptZero'}}/></span></span>
 </>;
 return <section {...rest} className={`hig-manage-position-block${className?` ${className}`:''}`}>
  <ScreenHeader title={labels.title} onBack={onBack} action={headerAction} headingId={headingId}/>
  <div className='hig-token-bars'>
   <BarMark surface={false} title={mode??labels.margin} description={corridor.share===null?labels.toLiquidation('—'):<SwapNumber template={labels.toLiquidation} value={Number((corridor.share*100).toFixed(1))} suffix='%' options={{maximumFractionDigits:1}}/>} elements={[{id:'margin',label:labels.margin,value:margin,detail:formatNumber(margin,locale,present(usd)),tone:'info'},{id:'notional',label:labels.notional,value:known(notional)?Math.max(notional-margin,0):0,detail:known(notional)?formatNumber(notional,locale,present(usd)):'—',tone:'positive'}]}/>
   <BarPnl surface={false} compact side={side} entry={entry} mark={mark} liquidation={liquidation} labels={{liquidation:labels.liquidation,mark:labels.mark,entry:labels.entry}} priceOptions={priceOptions}/>
  </div>
  {actions.length>0&&<ListGroup className='hig-manage-actions'>{actions.map(action=><ListRow key={action.id} label={action.label} disabled={action.disabled} onSelect={action.onSelect} value={action.value==null?undefined:<span className='hig-manage-action-value' data-tone={action.tone}>{typeof action.value==='string'?action.value:<AnimatedNumberReadout {...action.value}/>}</span>}/>)}</ListGroup>}
  {position&&(position.onSelect?<PositionButton position={position} content={content}/>:<div className='hig-asset-row hig-position-row'>{content(position)}</div>)}
  {position?.caption&&!position.onSelect&&<p className='hig-position-caption'>{position.caption}</p>}
 </section>;
}
/** The position row as a button: named by the host's label and described by what it shows and the caption. Without a label it is named by what it shows, so only the caption describes it, as on native. Its own component, so the ids it needs exist only when it is drawn. */
function PositionButton({position,content}:{position:ManagePositionBlockSummary;content:(position:ManagePositionBlockSummary,ids:{identity:string;amounts:string})=>React.ReactNode}){
 const identity=useId(),amounts=useId(),about=useId();
 return <>
  <button type='button' className='hig-asset-row hig-position-row' aria-label={position.label} aria-describedby={[position.label?identity:null,position.label?amounts:null,position.caption?about:null].filter(Boolean).join(' ')||undefined} onClick={position.onSelect}>{content(position,{identity,amounts})}<PressDecoration kind='row'/></button>
  {position.caption&&<p id={about} className='hig-position-caption'>{position.caption}</p>}
 </>;
}
