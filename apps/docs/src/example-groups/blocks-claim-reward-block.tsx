// Generated from planning/examples.json.
import React,{useState} from 'react';
import {ConfirmBlock,ClaimRewardBlock} from '@bloxwap/hig/react/blocks';
import {Button} from '@bloxwap/hig/react/button';
import {Text,Stack} from '@bloxwap/hig/react/surface';
import {toast} from '@bloxwap/hig/react/toast';
const components={Stack,Text,Button,ConfirmBlock,toast,ClaimRewardBlock};
export function Example({name,previewDialog}:{name:string;state?:string;previewDialog?:typeof import('@bloxwap/hig/react/overlay').Dialog}){const C=components;const [checked,setChecked]=useState(false);
const [value,setValue]=useState('buy');
const [open,setOpen]=useState(Boolean(previewDialog));
function preview(){switch(name){case "ClaimRewardBlock":return checked?<C.Text>Base account wallet balance · 125 USDC</C.Text>:value==='dismissed'?<C.Button onClick={()=>setValue('available')}>View reward</C.Button>:open?<C.ConfirmBlock title="Confirm reward claim" amount={100} symbol="USDC" address="0x9e0fD0622874ca1cBf79DA087BaF4622Faf77688" network="Base" warning={false} confirmLabel="Confirm" cancelLabel="Cancel" onCancel={()=>setOpen(false)} onConfirm={()=>{setChecked(true);C.toast.success("100 USDC added to your Base account wallet");}}/>:<C.ClaimRewardBlock amount={100} symbol="USDC" walletAddress="0x9e0fD0622874ca1cBf79DA087BaF4622Faf77688" chain="Base" details={[{label:"Sweepstakes",value:"Weekly drawing"},{label:"Prize",value:"First place"}]} labels={{wallet:"Destination wallet",chain:"Chain",title:"You won the sweepstakes",claim:"Claim",cancel:"Cancel"}} onClaim={()=>setOpen(true)} onCancel={()=>setValue('dismissed')}/>;
default:return <C.Text>Platform example unavailable.</C.Text>;}}return <C.Stack>{preview()}</C.Stack>;}
