"use client";
import React,{useState} from 'react';
import {Button} from '../button.js';
import {Surface,Stack,Heading} from '../surface.js';
import {Field,AmountInput} from '../field.js';
import {Dialog} from '../dialog.js';
import {Alert} from '../status.js';
import {useMessages} from '../provider.js';
import * as en from '@bloxwap/hig-contracts/messages';
/** Host validates and submits. Opening review never submits a transaction. */
export function TradeEntry({asset,amount,onAmountChange,onConfirm,busy,error,available}: {asset:string;amount:string;onAmountChange:(v:string)=>void;onConfirm:()=>void;busy?:boolean;error?:string;available:string}){const [review,setReview]=useState(false);const messages=useMessages();return <Surface><Stack><Heading>{(messages.tradeHeading??en.tradeHeading)(asset)}</Heading><Field label={(messages.amountLabel??en.amountLabel)(asset)} description={(messages.availableBalance??en.availableBalance)(available)} error={error}><AmountInput value={amount} onChange={e=>onAmountChange(e.target.value)} readOnly={busy}/></Field><Button fullWidth disabled={!amount||!!error} busy={busy} onClick={()=>setReview(true)}>{(messages.reviewOrder??en.reviewOrder)}</Button><Dialog open={review} onOpenChange={setReview} title={(messages.confirmOrderTitle??en.confirmOrderTitle)} description={(messages.confirmOrderDescription??en.confirmOrderDescription)(amount,asset)}><Button busy={busy} disabled={!!error} onClick={onConfirm}>{(messages.confirmOrder??en.confirmOrder)}</Button>{error&&<Alert title={(messages.orderUnavailable??en.orderUnavailable)} severity='error'><p>{error}</p></Alert>}</Dialog></Stack></Surface>;}
