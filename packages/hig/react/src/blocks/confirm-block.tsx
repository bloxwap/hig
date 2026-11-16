"use client";
import React from 'react';
import * as en from '@bloxwap/hig/contracts/messages';
import {useHIG} from '../provider.js';
import {Button} from '../button.js';
import {AnimatedNumberReadout} from '../animated-number.js';
import {ListGroup,ListRow} from '../list-group.js';
import {ScreenHeader} from './screen-header.js';
/** One more row under Network, such as a fee: host text on both edges. */
export interface ConfirmDetail {label:string;value:React.ReactNode;
 /** What a `value` that is not text reads as. */
 valueLabel?:string}
export interface ConfirmBlockProps extends Omit<React.HTMLAttributes<HTMLElement>,'title'> {
 /** The amount being sent, in token units. `null` reads as unknown. */
 amount:number|null;
 /** The token's ticker, after the amount: HYPE. */
 symbol:string;
 /** Format of the amount. Defaults to at most six fraction digits. */
 amountOptions?:Intl.NumberFormatOptions;
 /** The destination address, shown in full under “To” so it can be checked character by character. */
 address:string;
 /** The network the send moves on: HyperEVM. */
 network:string;
 /** More rows under Network, such as a fee. */
 details?:readonly ConfirmDetail[];
 /** Heading. Defaults to the built-in “Confirm send”. */
 title?:string;
 /** Heading of the warning. Defaults to the built-in “Double-check the address.” */
 warningTitle?:string;
 /** Body of the warning. Defaults to the built-in sentence naming the token and network; `null` or `false` draws no warning. */
 warning?:React.ReactNode;
 /** Called when the user confirms. The host signs and sends. */
 onConfirm:()=>void;
 /** Text of the confirming action. Defaults to the built-in “Confirm send”. */
 confirmLabel?:string;
 /** The send is in progress: the confirming action shows a spinner and ignores presses, and Cancel is unavailable. */
 busy?:boolean;
 /** Draws the confirming action unavailable, for example while a quote refreshes. */
 confirmDisabled?:boolean;
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
/** The last look before a send: the amount as the headline, where it goes and on which network, a warning that it cannot be taken back, then Cancel and Confirm side by side. */
export function ConfirmBlock({amount,symbol,amountOptions=amountFormat,address,network,details,title,warningTitle,warning,onConfirm,confirmLabel,busy,confirmDisabled,onCancel,cancelLabel,onBack,headerAction,stickyHeader,headingId,className,...rest}:ConfirmBlockProps){
 const {messages}=useHIG();
 const heading=title??messages.confirmSend??en.confirmSend;
 const body=warning===undefined?(messages.sendWarning??en.sendWarning)(symbol,network):warning;
 return <section {...rest} className={`hig-confirm${className?` ${className}`:''}`}>
  <ScreenHeader title={heading} onBack={onBack} backDisabled={busy} action={headerAction} headingId={headingId} stickyHeader={stickyHeader}/>
  <p className='hig-confirm-amount'><AnimatedNumberReadout value={amount} options={amountOptions}/> <span className='hig-confirm-symbol'>{symbol}</span></p>
  <ListGroup>
   <ListRow label={messages.sendTo??en.sendTo} description={address}/>
   <ListRow label={messages.sendNetwork??en.sendNetwork} value={network}/>
   {details?.map(detail=><ListRow key={detail.label} label={detail.label} value={detail.value} valueLabel={detail.valueLabel}/>)}
  </ListGroup>
  {body!=null&&body!==false&&<div className='hig-confirm-warning' role='note'><strong>{warningTitle??messages.sendWarningTitle??en.sendWarningTitle}</strong><p>{body}</p></div>}
  <div className='hig-confirm-actions'>
   {onCancel&&<Button intent='secondary' disabled={busy} onClick={onCancel}>{cancelLabel??messages.cancel??en.cancel}</Button>}
   <Button busy={busy} disabled={confirmDisabled} onClick={onConfirm}>{confirmLabel??messages.confirmSend??en.confirmSend}</Button>
  </div>
 </section>;
}
