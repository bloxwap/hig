"use client";
import React from 'react';
import * as en from '@bloxwap/hig/contracts/messages';
import {PressDecoration,useHIG} from '../provider.js';
import {Button} from '../button.js';
import {Switch} from '../selection.js';
import {ListGroup,ListRow} from '../list-group.js';
import {AnimatedNumberReadout} from '../animated-number.js';
import {ScreenHeader} from './screen-header.js';
import {SwapIcon} from './swap/shared.js';
/** A number the host supplies as a number so it updates place by place: `{value:0.53,options:{style:'currency',currency:'USD'}}`. `null` reads as unknown. */
export interface PositionBlockFigure {value:number|null;options?:Intl.NumberFormatOptions;prefix?:string;suffix?:string}
/** One line of the summary: Notional, Fee, Liquidation. `value` is host text (`2% of profit`) or a live figure. `tone` colours the value; the default is the text colour. */
export interface PositionBlockDetail {
 id?:string;label:string;value:string|PositionBlockFigure;tone?:'positive'|'negative'|'muted';
 /** Draws the value struck through, for a charge that does not apply, and reads this host text after it: Waived. */
 struck?:string;
 /** Host content right after the label, such as a badge that explains the line. It may be interactive. */
 labelAccessory?:React.ReactNode;
}
/** One setting of the position: Size, Leverage, Stop Loss. With `onSelect` the row opens the host's own view and shows a chevron; with `onCheckedChange` the row is a switch. */
export interface PositionBlockRow {
 id:string;label:string;
 /** Host text on the trailing edge, or a live figure that updates place by place. */
 value?:string|PositionBlockFigure;
 onSelect?:()=>void;disabled?:boolean;
 /** With `onCheckedChange`, the row is a switch named by its label, and the whole row toggles it. */
 checked?:boolean;onCheckedChange?:(checked:boolean)=>void;
}
/** An action on the paper trading row's card, under the switch, such as collecting what the paper position earned. */
export interface PositionBlockFlagAction {label:string;onSelect:()=>void;intent?:'primary'|'secondary'|'destructive';busy?:boolean;disabled?:boolean}
/** The paper trading switch. The host supplies its name, because HIG ships no trading terms. */
export interface PositionBlockFlag {
 label:string;checked:boolean;onCheckedChange:(checked:boolean)=>void;disabled?:boolean;
 /** A button on the row's card, under the switch. */
 action?:PositionBlockFlagAction;
}
export interface PositionBlockProps extends Omit<React.HTMLAttributes<HTMLElement>,'title'> {
 /** Heading: Position. */
 title:string;
 /** The summary under the header, in order. */
 details:readonly PositionBlockDetail[];
 /** One sentence under the summary, such as the minimum margin. */
 note?:string;
 /** Shows the paper trading switch as a row of its own above the settings. The whole row toggles it. */
 paperTrade?:PositionBlockFlag;
 /** The settings, as groups of rows. Each group is one rounded container. */
 groups:readonly (readonly PositionBlockRow[])[];
 /** Shows Close on the trailing edge of the header. */
 onClose?:()=>void;
 onBack?:()=>void;
 /** A control on the trailing edge of the header in place of Close. */
 headerAction?:React.ReactNode;
 /** `id` of the heading, so a dialog or sheet can name itself with `aria-labelledby`. */
 headingId?:string;
 /** Set true to pin the header to the top of the nearest scrolling container while the rest scrolls under it. */
 stickyHeader?:boolean;
}
const figure=(value:string|PositionBlockFigure)=>typeof value==='string'?value:<AnimatedNumberReadout {...value}/>;
/** A press anywhere on a switch row that is not on a control toggles the row's switch, through the switch itself so its change and feedback run once. */
function toggleRow(event:React.MouseEvent<HTMLElement>){
 if((event.target as Element).closest('a,button,input,label,select,textarea'))return;
 const input=event.currentTarget.querySelector<HTMLInputElement>('input[role="switch"]');if(input&&!input.disabled)input.click();
}
/** The position being opened or edited: a summary of what it costs and where it ends, an optional paper trading switch, and its settings as grouped rows that open the host's own views. */
export function PositionBlock({title,details,note,paperTrade,groups,onClose,onBack,headerAction,headingId,stickyHeader,className,...rest}:PositionBlockProps){
 const {messages}=useHIG();
 const flag=paperTrade&&<ListRow label={paperTrade.label} disabled={paperTrade.disabled} onClick={toggleRow} trailing={<Switch label={paperTrade.label} checked={paperTrade.checked} disabled={paperTrade.disabled} onCheckedChange={paperTrade.onCheckedChange}/>}/>;
 return <section {...rest} className={`hig-position-block${className?` ${className}`:''}`} data-sticky-header={stickyHeader||undefined}>
  <ScreenHeader title={title} onBack={onBack} headingId={headingId} action={headerAction??(onClose&&<button type='button' className='hig-swap-back' aria-label={messages.close??en.close} onClick={onClose}><SwapIcon name='close'/><PressDecoration kind='back'/></button>)}/>
  {details.length>0&&<dl className='hig-position-details'>{details.map((detail,index)=><div key={detail.id??index} data-tone={detail.tone}><dt>{detail.label}{detail.labelAccessory!=null&&<span className='hig-position-label-accessory'>{detail.labelAccessory}</span>}</dt><dd className='hig-number'>{detail.struck?<><span className='hig-position-struck'>{figure(detail.value)}</span><span className='hig-sr-only'> {detail.struck}</span></>:figure(detail.value)}</dd></div>)}</dl>}
  {note&&<p className='hig-position-note'>{note}</p>}
  {(paperTrade||groups.some(group=>group.length>0))&&<div className='hig-position-groups'>
   {paperTrade&&<ListGroup className='hig-position-flag'>{paperTrade.action?<div className='hig-position-flag-card'>{flag}<div className='hig-position-flag-action'><Button fullWidth intent={paperTrade.action.intent??'primary'} busy={paperTrade.action.busy} disabled={paperTrade.action.disabled} onClick={paperTrade.action.onSelect}>{paperTrade.action.label}</Button></div></div>:flag}</ListGroup>}
   {groups.map((group,index)=>group.length>0&&<ListGroup key={index}>{group.map(row=>row.onCheckedChange?<ListRow key={row.id} label={row.label} value={row.value==null?undefined:figure(row.value)} disabled={row.disabled} onClick={toggleRow} trailing={<Switch label={row.label} checked={!!row.checked} disabled={row.disabled} onCheckedChange={row.onCheckedChange}/>}/>:<ListRow key={row.id} label={row.label} value={row.value==null||typeof row.value==='string'?row.value:figure(row.value)} onSelect={row.onSelect} disabled={row.disabled}/>)}</ListGroup>)}
  </div>}
 </section>;
}
