// Generated from planning/examples.json.
import React,{useState} from 'react';
import {ConfirmBlock} from '@bloxwap/hig/react/blocks';
import {Text,Stack} from '@bloxwap/hig/react/surface';
const components={Stack,Text,ConfirmBlock};
export function Example({name,state='default'}:{name:string;state?:string;previewDialog?:typeof import('@bloxwap/hig/react/overlay').Dialog}){const C=components;const [message,setMessage]=useState('');
function preview(){switch(name){case "ConfirmBlock":return state==="busy"?<C.ConfirmBlock amount={2.5} symbol='HYPE' address='0x1111111111111111111111111111111111111111' network='HyperEVM' busy onBack={()=>setMessage('The host goes back')} onConfirm={()=>setMessage('The host signs and sends')} onCancel={()=>setMessage('The host closes the sheet')}/>:state==="fee"?<C.ConfirmBlock amount={2.5} symbol='HYPE' address='0x1111111111111111111111111111111111111111' network='HyperEVM' details={[{label:'Network fee',value:'0.0001 HYPE'}]} onBack={()=>setMessage('The host goes back')} onConfirm={()=>setMessage('The host signs and sends')} onCancel={()=>setMessage('The host closes the sheet')}/>:<C.ConfirmBlock amount={2.5} symbol='HYPE' address='0x1111111111111111111111111111111111111111' network='HyperEVM' onBack={()=>setMessage('The host goes back')} onConfirm={()=>setMessage('The host signs and sends')} onCancel={()=>setMessage('The host closes the sheet')}/>;
default:return <C.Text>Platform example unavailable.</C.Text>;}}return <C.Stack>{preview()}{message&&<C.Text>{message}</C.Text>}</C.Stack>;}
