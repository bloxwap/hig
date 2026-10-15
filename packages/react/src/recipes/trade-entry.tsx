"use client";
import React,{useState} from 'react';
import {Button} from '../button.js';
import {Surface,Stack,Heading} from '../surface.js';
import {Field,AmountInput} from '../field.js';
import {Dialog} from '../dialog.js';
import {Alert} from '../status.js';
/** Host validates and submits. Opening review never submits a transaction. */
export function TradeEntry({asset,amount,onAmountChange,onConfirm,busy,error,available}: {asset:string;amount:string;onAmountChange:(v:string)=>void;onConfirm:()=>void;busy?:boolean;error?:string;available:string}){const [review,setReview]=useState(false);return <Surface><Stack><Heading>Review {asset} order</Heading><Field label={`Amount (${asset})`} description={`Available: ${available}`} error={error}><AmountInput value={amount} onChange={e=>onAmountChange(e.target.value)} readOnly={busy}/></Field><Button fullWidth disabled={!amount||!!error} busy={busy} onClick={()=>setReview(true)}>Review order</Button><Dialog open={review} onOpenChange={setReview} title='Confirm order' description={`Amount: ${amount} ${asset}. Verify the host-provided terms before submission.`}><Button busy={busy} disabled={!!error} onClick={onConfirm}>Confirm order</Button>{error&&<Alert title='Order unavailable' severity='error'><p>{error}</p></Alert>}</Dialog></Stack></Surface>;}
