// Generated from planning/examples.json.
import React,{useState} from 'react';
import {Menu} from '@bloxwap/hig/react/overlay';
import {Text,Stack} from '@bloxwap/hig/react/surface';
const components={Stack,Text,Menu};
export function Example({name}:{name:string;state?:string;previewDialog?:typeof import('@bloxwap/hig/react/overlay').Dialog}){const C=components;const [message,setMessage]=useState('');
function preview(){switch(name){case "Menu":return <C.Menu label='Market actions' items={[{label:'Show details',onSelect:()=>setMessage('Details selected')},{label:'Unavailable action',disabled:true,onSelect:()=>{}}]}/>;
default:return <C.Text>Platform example unavailable.</C.Text>;}}return <C.Stack>{preview()}{message&&<C.Text>{message}</C.Text>}</C.Stack>;}
