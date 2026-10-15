"use client";
import React,{useState} from 'react';
import * as en from '@bloxwap/hig-contracts/messages';
import {useHIG} from '../provider.js';
import {Button} from '../button.js';
import {Surface,Stack,Heading} from '../surface.js';
import {Field,AmountInput} from '../field.js';
import {Dialog} from '../dialog.js';
import {Alert} from '../status.js';
/** Host validates and submits. Opening review never submits a transaction. */
export function TradeEntry({asset,amount,onAmountChange,onConfirm,busy,error,available}: {asset:string;amount:string;onAmountChange:(v:string)=>void;onConfirm:()=>void;busy?:boolean;error?:string;available:string}){const {messages}=useHIG();const [review,setReview]=useState(false);return <Surface><Stack><Heading>{(messages.reviewAssetOrder??en.reviewAssetOrder)(asset)}</Heading><Field label={(messages.amountInAsset??en.amountInAsset)(asset)} description={(messages.availableAmount??en.availableAmount)(available)} error={error}><AmountInput value={amount} onChange={e=>onAmountChange(e.target.value)} readOnly={busy}/></Field><Button fullWidth disabled={!amount||!!error} busy={busy} onClick={()=>setReview(true)}>{messages.reviewOrder??en.reviewOrder}</Button><Dialog open={review} onOpenChange={setReview} title={messages.confirmOrder??en.confirmOrder} description={(messages.confirmOrderDescription??en.confirmOrderDescription)(amount,asset)}><Button busy={busy} disabled={!!error} onClick={onConfirm}>{messages.confirmOrder??en.confirmOrder}</Button>{error&&<Alert title={messages.orderUnavailable??en.orderUnavailable} severity='error'><p>{error}</p></Alert>}</Dialog></Stack></Surface>;}
