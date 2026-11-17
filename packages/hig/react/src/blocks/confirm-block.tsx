"use client";
import React from 'react';
import * as en from '@bloxwap/hig/contracts/messages';
import {useHIG} from '../provider.js';
import {Button} from '../button.js';
import {AnimatedNumberReadout} from '../animated-number.js';
import {ScreenHeader} from './screen-header.js';
/** One more line under Network, such as a fee: host text on both edges. */
export interface ConfirmDetail {label:string;value:React.ReactNode;
 /** What a `value` that is not text reads as. */
 valueLabel?:string}
/** A full-width action under Cancel and Confirm, such as “Delete anyway”: a ghost button, in the negative colour with `tone='destructive'`. */
export interface ConfirmTertiaryAction {label:string;onSelect:()=>void;tone?:'destructive';disabled?:boolean}
export interface ConfirmBlockProps extends Omit<React.HTMLAttributes<HTMLElement>,'title'> {
 /** The amount being sent, in token units. `null` reads as unknown. Leave it out, with `symbol`, `address` and `network`, for a confirmation that is not a send, such as signing out: the block then draws only the header, `children`, the notice and the actions. */
 amount?:number|null;
 /** The token's ticker, after the amount: HYPE. */
 symbol?:string;
 /** Format of the amount. Defaults to at most six fraction digits. */
 amountOptions?:Intl.NumberFormatOptions;
 /** What the amount is read as before the figure, such as “Amount” (“Amount: 2.5”, then the ticker). Without it the figure is read alone. */
 amountLabel?:string;
 /** The destination address, shown in full beside “To”, always as two rows, with the first 4 characters (6 with a `0x` prefix) and the last 4 emphasised and the rest muted. */
 address?:string;
 /** The network the send moves on: HyperEVM. */
 network?:string;
 /** What is being confirmed, drawn as given under the header (and under the amount and lines of a send): usually a muted `Text`, a `List` of consequences, an `Alert` or a `ListGroup`. */
 children?:React.ReactNode;
 /** A bulleted list under `children`, in the muted colour, such as what deleting an account loses. */
 points?:readonly React.ReactNode[];
 /** The confirming action's intent: `primary` (the default) or `destructive`, for an action that deletes or ends something. */
 confirmIntent?:'primary'|'destructive';
 /** A full-width action under Cancel and Confirm, such as “Delete anyway”. Unavailable while `busy`. */
 tertiaryAction?:ConfirmTertiaryAction;
 /** More lines under Network, such as a fee. */
 details?:readonly ConfirmDetail[];
 /** Draws the Network line and each of `details` on one line: the label keeps its width and the value truncates with an ellipsis instead of wrapping. A value that is not text should be inline content, such as a span, for the ellipsis to show. The address keeps its two rows. Off by default. */
 oneLineDetails?:boolean;
 /** Heading. Defaults to the built-in “Confirm Send”. */
 title?:string;
 /** Heading of the warning. Defaults to the built-in “Double-check the address.” */
 warningTitle?:string;
 /** Body of the warning. Defaults to the built-in sentence naming the token and network when `address` is given, and to none otherwise; `null` or `false` draws no warning. */
 warning?:React.ReactNode;
 /** A notice between the warning and the actions, drawn as given, such as an error `Alert` when a fee cannot be read or the send failed. Nothing by default. */
 notice?:React.ReactNode;
 /** Called when the user confirms. The host signs and sends. */
 onConfirm:()=>void;
 /** Text of the confirming action. Defaults to the built-in “Confirm Send”. */
 confirmLabel?:string;
 /** The send is in progress: the confirming action shows a spinner and ignores presses, and Cancel is unavailable. */
 busy?:boolean;
 /** Draws the confirming action unavailable, for example while a quote refreshes. */
 confirmDisabled?:boolean;
 /** Keeps Back, Cancel and the tertiary action available while `busy`, for a wait the user may walk away from, such as a wallet signature the host can abandon. Off by default. */
 cancelWhileBusy?:boolean;
 /** Shows Cancel on the leading side of the confirming action, the two sharing the row equally. Without it the confirming action takes the full width. */
 onCancel?:()=>void;
 /** Text of Cancel. Defaults to the built-in “Cancel”. */
 cancelLabel?:string;
 /** Shows Back on the leading edge of the header. */
 onBack?:()=>void;
 /** A control on the trailing edge of the header, usually an `IconButton`. */
 headerAction?:React.ReactNode;
 /** Pins the header to the top of the nearest scroller: transparent at rest, filled once content scrolls under it, and still when it starts to stick. See Pinned headers. */
 stickyHeader?:boolean;
 /** `id` of the header's heading, so a host dialog or sheet can name itself with `aria-labelledby`. */
 headingId?:string;
}
const amountFormat={maximumFractionDigits:6} as const;
/** The address as the two rows the block draws: split at the middle, with `anchor` on the characters people compare, the first 4 (6 when it starts with `0x`) and the last 4. An address too short to have a middle is all anchor. */
export function confirmAddressRows(address:string):{text:string;anchor:boolean}[][]{
 const characters=Array.from(address),head=address.startsWith('0x')?6:4,tail=characters.length-4,split=Math.ceil(characters.length/2);
 return [characters.slice(0,split),characters.slice(split)].map((row,rowIndex)=>{const parts:{text:string;anchor:boolean}[]=[];
  row.forEach((character,index)=>{const position=rowIndex*split+index,anchor=position<head||position>=tail,last=parts[parts.length-1];if(last&&last.anchor===anchor)last.text+=character;else parts.push({text:character,anchor});});
  return parts;});
}
/** The last look before a send: the amount as the headline, where it goes and on which network, a warning that it cannot be taken back, then Cancel and Confirm side by side. Without an amount, address or network it confirms anything else, such as signing out or deleting an account: the header, `children`, then the actions. */
export function ConfirmBlock({amount,symbol,amountOptions=amountFormat,amountLabel,address,network,details,oneLineDetails,children,points,confirmIntent='primary',tertiaryAction,title,warningTitle,warning,notice,onConfirm,confirmLabel,busy,confirmDisabled,cancelWhileBusy,onCancel,cancelLabel,onBack,headerAction,stickyHeader,headingId,className,...rest}:ConfirmBlockProps){
 const {messages}=useHIG();
 // What busy holds besides the confirming action: Back, Cancel and the tertiary action, unless the host lets them leave the wait.
 const held=!!busy&&!cancelWhileBusy;
 const heading=title??messages.confirmSend??en.confirmSend;
 const body=warning===undefined?(address!==undefined?(messages.sendWarning??en.sendWarning)(symbol??'',network??''):null):warning;
 const hasLines=address!==undefined||network!==undefined||!!details?.length;
 return <section {...rest} className={`hig-confirm${className?` ${className}`:''}`}>
  <ScreenHeader title={heading} onBack={onBack} backDisabled={held} action={headerAction} headingId={headingId} stickyHeader={stickyHeader}/>
  {amount!==undefined&&<p className='hig-confirm-amount'><AnimatedNumberReadout value={amount} options={amountOptions} label={amountLabel}/>{symbol?<> <span className='hig-confirm-symbol'>{symbol}</span></>:null}</p>}
  {hasLines&&<dl className='hig-confirm-details' data-one-line={oneLineDetails||undefined}>
   {address!==undefined&&<div><dt>{messages.sendTo??en.sendTo}</dt><dd><span className='hig-confirm-address' dir='ltr' translate='no'><span className='hig-sr-only'>{address}</span><span aria-hidden='true'>{confirmAddressRows(address).map((row,index)=><span key={index}>{row.map((part,offset)=><span key={offset} data-anchor={part.anchor||undefined}>{part.text}</span>)}</span>)}</span></span></dd></div>}
   {network!==undefined&&<div><dt>{messages.sendNetwork??en.sendNetwork}</dt><dd>{network}</dd></div>}
   {details?.map(detail=><div key={detail.label}><dt>{detail.label}</dt><dd>{detail.valueLabel?<><span className='hig-sr-only'>{detail.valueLabel}</span><span aria-hidden='true'>{detail.value}</span></>:detail.value}</dd></div>)}
  </dl>}
  {(children!=null&&children!==false||!!points?.length)&&<div className='hig-confirm-body'>{children}{points?.length?<ul className='hig-confirm-points'>{points.map((point,index)=><li key={index}>{point}</li>)}</ul>:null}</div>}
  {body!=null&&body!==false&&<div className='hig-confirm-warning' role='note'><strong>{warningTitle??messages.sendWarningTitle??en.sendWarningTitle}</strong><p>{body}</p></div>}
  {notice}
  <div className='hig-confirm-actions'>
   {onCancel&&<Button intent='secondary' disabled={held} onClick={onCancel}>{cancelLabel??messages.cancel??en.cancel}</Button>}
   <Button intent={confirmIntent} busy={busy} disabled={confirmDisabled} onClick={onConfirm}>{confirmLabel??messages.confirmSend??en.confirmSend}</Button>
  </div>
  {tertiaryAction&&<Button className='hig-confirm-tertiary' data-tone={tertiaryAction.tone} intent='ghost' fullWidth disabled={held||tertiaryAction.disabled} onClick={tertiaryAction.onSelect}>{tertiaryAction.label}</Button>}
 </section>;
}
