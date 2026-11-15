"use client";
import React from 'react';
import * as en from '@bloxwap/hig/contracts/messages';
import {useHIG} from '../provider.js';
import {Switch} from '../selection.js';
import {ListGroup,ListRow} from '../list-group.js';
import {AnimatedNumberReadout} from '../animated-number.js';
import {ScreenHeader} from './screen-header.js';
import {SwapIcon} from './swap/shared.js';
/** A number the host supplies as a number so it updates place by place: `{value:0.53,options:{style:'currency',currency:'USD'}}`. `null` reads as unknown. */
export interface PositionCardFigure {value:number|null;options?:Intl.NumberFormatOptions;prefix?:string;suffix?:string}
/** One line of the summary: Notional, Fee, Liquidation. `value` is host text (`2% of profit`) or a live figure. `tone` colours the value; the default is the text colour. */
export interface PositionCardDetail {id?:string;label:string;value:string|PositionCardFigure;tone?:'positive'|'negative'|'muted'}
/** One setting of the position: Size, Leverage, Stop Loss. With `onSelect` the row opens the host's own view and shows a chevron. */
export interface PositionCardRow {id:string;label:string;value?:string;onSelect?:()=>void;disabled?:boolean}
/** The paper trading switch. The host supplies its name, because HIG ships no trading terms. */
export interface PositionCardFlag {label:string;checked:boolean;onCheckedChange:(checked:boolean)=>void;disabled?:boolean}
export interface PositionCardProps extends Omit<React.HTMLAttributes<HTMLElement>,'title'> {
 /** Heading: Position. */
 title:string;
 /** The summary under the header, in order. */
 details:readonly PositionCardDetail[];
 /** One sentence under the summary, such as the minimum margin. */
 note?:string;
 /** Shows the paper trading switch as a row of its own above the settings. */
 paperTrade?:PositionCardFlag;
 /** The settings, as groups of rows. Each group is one rounded container. */
 groups:readonly (readonly PositionCardRow[])[];
 /** Shows Close on the trailing edge of the header. */
 onClose?:()=>void;
 onBack?:()=>void;
 /** A control on the trailing edge of the header in place of Close. */
 headerAction?:React.ReactNode;
}
/** The position being opened or edited: a summary of what it costs and where it ends, an optional paper trading switch, and its settings as grouped rows that open the host's own views. */
export function PositionCard({title,details,note,paperTrade,groups,onClose,onBack,headerAction,className,...rest}:PositionCardProps){
 const {messages}=useHIG();
 return <section {...rest} className={`hig-position-card${className?` ${className}`:''}`}>
  <ScreenHeader title={title} onBack={onBack} action={headerAction??(onClose&&<button type='button' className='hig-swap-back' aria-label={messages.close??en.close} onClick={onClose}><SwapIcon name='close'/></button>)}/>
  {details.length>0&&<dl className='hig-position-details'>{details.map((detail,index)=><div key={detail.id??index} data-tone={detail.tone}><dt>{detail.label}</dt><dd className='hig-number'>{typeof detail.value==='string'?detail.value:<AnimatedNumberReadout {...detail.value}/>}</dd></div>)}</dl>}
  {note&&<p className='hig-position-note'>{note}</p>}
  {(paperTrade||groups.some(group=>group.length>0))&&<div className='hig-position-groups'>
   {paperTrade&&<ListGroup className='hig-position-flag'><ListRow label={paperTrade.label} disabled={paperTrade.disabled} trailing={<Switch label={paperTrade.label} checked={paperTrade.checked} disabled={paperTrade.disabled} onCheckedChange={paperTrade.onCheckedChange}/>}/></ListGroup>}
   {groups.map((group,index)=>group.length>0&&<ListGroup key={index}>{group.map(row=><ListRow key={row.id} label={row.label} value={row.value} onSelect={row.onSelect} disabled={row.disabled}/>)}</ListGroup>)}
  </div>}
 </section>;
}
