import React,{useState} from 'react';
import * as en from '@bloxwap/hig/contracts/messages';
import {useHIG} from './provider.js';
import {Button} from './button.js';
import {Surface,Stack,Heading,Text} from './surface.js';
import {Field,Input} from './field.js';
import {Dialog} from './overlay.js';
/** The call to action that closes a form sits a double step, 16dp, below it (the Stack gap is 12). */
const formAction={marginTop:4};
/** In a dialog the confirm action is 16dp below the content and 8dp above the dialog's own closing button, which adds 4dp itself. */
const dialogAction={marginTop:4,marginBottom:-8};
type TradeEntryProps={asset:string;amount:string;onAmountChange:(value:string)=>void;onConfirm:()=>void;busy?:boolean;error?:string;available:string};
type TradeReviewProps=Pick<TradeEntryProps,'asset'|'amount'|'onConfirm'|'busy'|'error'>&{open:boolean;trigger:React.RefObject<React.ComponentRef<typeof Button>|null>;onOpenChange:(open:boolean)=>void};
const TradeReview=React.memo(function TradeReview({open,onOpenChange,trigger,asset,amount,onConfirm,busy,error}:TradeReviewProps){
 const {messages}=useHIG();
 return <Dialog open={open} onOpenChange={onOpenChange} returnFocusRef={trigger} title={messages.confirmOrder??en.confirmOrder} description={(messages.confirmOrderDescription??en.confirmOrderDescription)(amount,asset)}>
  <Button busy={busy} disabled={!!error} style={dialogAction} onPress={onConfirm}>{messages.confirmOrder??en.confirmOrder}</Button>
  {error&&<Text accessibilityLiveRegion='polite'>{error}</Text>}
 </Dialog>;
},(previous,next)=>!previous.open&&!next.open);

export function TradeEntry({asset,amount,onAmountChange,onConfirm,busy,error,available}:TradeEntryProps){
 const {messages}=useHIG();
 const trigger=React.useRef<React.ComponentRef<typeof Button>>(null);
 // After first opening, keep the dialog mounted for dismissal and focus handling.
 const [review,setReview]=useState<boolean|null>(null);
 return <Surface><Stack>
  <Heading>{(messages.reviewAssetOrder??en.reviewAssetOrder)(asset)}</Heading>
  <Field label={(messages.amountInAsset??en.amountInAsset)(asset)} description={(messages.availableAmount??en.availableAmount)(available)} error={error}>
   <Input keyboardType='decimal-pad' value={amount} onChangeText={onAmountChange} editable={!busy}/>
  </Field>
  <Button ref={trigger} fullWidth style={formAction} onPress={()=>setReview(true)} disabled={!amount||!!error} busy={busy}>{messages.reviewOrder??en.reviewOrder}</Button>
  {review!==null&&<TradeReview open={review} trigger={trigger} onOpenChange={setReview} asset={asset} amount={amount} onConfirm={onConfirm} busy={busy} error={error}/>}
 </Stack></Surface>;
}
