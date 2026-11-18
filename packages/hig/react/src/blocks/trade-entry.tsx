"use client";
import React,{useState} from 'react';
import * as en from '@bloxwap/hig/contracts/messages';
import {useHIG} from '../provider.js';
import {Button} from '../button.js';
import {Surface,Stack,Heading} from '../surface.js';
import {Field,Input} from '../field.js';
import {Alert} from '../status.js';
type DialogComponent=typeof import('../dialog.js').Dialog;
const loadDialog=()=>import('../dialog.js');
function prepareDialog(){void loadDialog().catch(()=>{});}
type TradeEntryProps={asset:string;amount:string;onAmountChange:(value:string)=>void;onConfirm:()=>void;busy?:boolean;error?:string;available:string};
type TradeReviewProps=Pick<TradeEntryProps,'asset'|'amount'|'onConfirm'|'busy'|'error'>&{Dialog:DialogComponent;open:boolean;trigger:React.RefObject<HTMLButtonElement|null>;onOpenChange:(open:boolean)=>void};
const TradeReview=React.memo(function TradeReview({Dialog,open,onOpenChange,trigger,asset,amount,onConfirm,busy,error}:TradeReviewProps){
 const {messages}=useHIG();
 return <Dialog open={open} onOpenChange={onOpenChange} contentProps={{onCloseAutoFocus:event=>{event.preventDefault();trigger.current?.focus();}}} title={messages.confirmOrder??en.confirmOrder} description={(messages.confirmOrderDescription??en.confirmOrderDescription)(amount,asset)}>
  <Button busy={busy} disabled={!!error} onClick={onConfirm}>{messages.confirmOrder??en.confirmOrder}</Button>
  {error&&<Alert title={messages.orderUnavailable??en.orderUnavailable} severity='error'><p>{error}</p></Alert>}
 </Dialog>;
},(previous,next)=>!previous.open&&!next.open);

/** Host validates and submits. Opening review never submits a transaction. */
export function TradeEntry({asset,amount,onAmountChange,onConfirm,busy,error,available}:TradeEntryProps){
 const {messages}=useHIG();
 const trigger=React.useRef<HTMLButtonElement>(null);
 // After first opening, keep the dialog mounted for dismissal and focus handling.
 const [Dialog,setDialog]=useState<DialogComponent|null>(null);
 const [review,setReview]=useState(false);
 const [loadError,setLoadError]=useState<Error|null>(null);
 if(loadError)throw loadError;
 function openReview(){
  if(Dialog){setReview(true);return;}
  loadDialog().then(module=>{
   setDialog(()=>module.Dialog);
   setReview(true);
  },reason=>setLoadError(reason instanceof Error?reason:new Error(String(reason))));
 }
 return <Surface><Stack>
  <Heading>{(messages.reviewAssetOrder??en.reviewAssetOrder)(asset)}</Heading>
  <Field label={(messages.amountInAsset??en.amountInAsset)(asset)} description={(messages.availableAmount??en.availableAmount)(available)} error={error}>
   <Input type='text' inputMode='decimal' value={amount} onChange={e=>onAmountChange(e.target.value)} readOnly={busy}/>
  </Field>
  <Button ref={trigger} fullWidth className='hig-form-action' onFocus={prepareDialog} onPointerEnter={prepareDialog} onClick={openReview} disabled={!amount||!!error} busy={busy}>{messages.reviewOrder??en.reviewOrder}</Button>
  {Dialog&&<TradeReview Dialog={Dialog} open={review} trigger={trigger} onOpenChange={setReview} asset={asset} amount={amount} onConfirm={onConfirm} busy={busy} error={error}/>}
 </Stack></Surface>;
}
