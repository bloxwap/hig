// Generated from planning/examples.json.
import React,{useState} from 'react';
import {TradeEntry} from '@bloxwap/hig/react/blocks';
import {Text,Stack} from '@bloxwap/hig/react/surface';
const components={Stack,Text,TradeEntry};
export function Example({name,state='default'}:{name:string;state?:string;previewDialog?:typeof import('@bloxwap/hig/react/overlay').Dialog}){const C=components;const [amount,setAmount]=useState('0.01');
const [message,setMessage]=useState('');
const busy=state==='busy';
const error=state==='error'?'Data unavailable. Retry when connected.':undefined;
function preview(){switch(name){case "TradeEntry":return <C.TradeEntry asset='BTC' amount={amount} onAmountChange={setAmount} available='0.25 BTC' busy={busy} error={error} onConfirm={()=>setMessage('Demo confirmation accepted; no transaction submitted')}/>;
default:return <C.Text>Platform example unavailable.</C.Text>;}}return <C.Stack>{preview()}{message&&<C.Text>{message}</C.Text>}</C.Stack>;}
