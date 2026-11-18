// Generated from planning/examples.json.
import React,{useState} from 'react';
import {Field,Label,Input,TextArea,SearchInput} from '@bloxwap/hig/react/field';
import {Text,Stack} from '@bloxwap/hig/react/surface';
const components={Stack,Text,Field,Input,Label,TextArea,SearchInput};
export function Example({name,state='default'}:{name:string;state?:string;previewDialog?:typeof import('@bloxwap/hig/react/overlay').Dialog}){const C=components;const [amount,setAmount]=useState('0.01');
const disabled=state==='disabled';
const error=state==='error'?'Data unavailable. Retry when connected.':undefined;
function preview(){switch(name){case "Field":return <C.Field label='Amount (BTC)' description='Available: 0.25 BTC' error={error}><C.Input type='text' inputMode='decimal' value={amount} onChange={e=>setAmount(e.target.value)} disabled={disabled}/></C.Field>;
case "Label":return <C.Stack><C.Label htmlFor='sample-amount'>Amount</C.Label><C.Input id='sample-amount' value={amount} onChange={e=>setAmount(e.target.value)}/></C.Stack>;
case "Input":return <C.Field label='Asset search' error={error}><C.Input value={amount} onChange={e=>setAmount(e.target.value)} disabled={disabled}/></C.Field>;
case "TextArea":return <C.Field label='Note' description='Optional, kept by the host'><C.TextArea value={amount} onChange={e=>setAmount(e.target.value)} disabled={disabled}/></C.Field>;
case "SearchInput":return state==="clear"?<C.Field label='Search markets'><C.SearchInput value={amount} onChange={e=>setAmount(e.target.value)} onClear={()=>setAmount('')}/></C.Field>:<C.Field label='Search markets'><C.SearchInput value={amount} onChange={e=>setAmount(e.target.value)} disabled={disabled}/></C.Field>;
default:return <C.Text>Platform example unavailable.</C.Text>;}}return <C.Stack>{preview()}</C.Stack>;}
