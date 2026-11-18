// Generated from planning/examples.json.
import React,{useState} from 'react';
import {Button} from '@bloxwap/hig/react/button';
import {Text,Stack} from '@bloxwap/hig/react/surface';
const components={Stack,Text,Button};
export function Example({name,state='default'}:{name:string;state?:string;previewDialog?:typeof import('@bloxwap/hig/react/overlay').Dialog}){const C=components;const [message,setMessage]=useState('');
function preview(){switch(name){case "FeedbackBlock":return state==="return"?<C.Stack><C.Text>What stopped you last time?</C.Text><C.Text>Optional · one tap</C.Text>{['It was confusing','Too slow','I hit an error','Just looking','Something else'].map(answer=><C.Button key={answer} intent='secondary' onClick={()=>setMessage('Thanks, that helps. Answer: '+answer)}>{answer}</C.Button>)}</C.Stack>:<C.Stack><C.Text>That didn't work. What got in the way?</C.Text><C.Text>Optional · one tap</C.Text>{['It was confusing','Too slow','I hit an error','Just looking','Something else'].map(answer=><C.Button key={answer} intent='secondary' onClick={()=>setMessage('Thanks, that helps. Answer: '+answer)}>{answer}</C.Button>)}</C.Stack>;
default:return <C.Text>Platform example unavailable.</C.Text>;}}return <C.Stack>{preview()}{message&&<C.Text>{message}</C.Text>}</C.Stack>;}
