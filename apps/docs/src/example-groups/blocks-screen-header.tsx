// Generated from planning/examples.json.
import React,{useState} from 'react';
import {ScreenHeader} from '@bloxwap/hig/react/blocks/screen-header';
import {IconButton} from '@bloxwap/hig/react/button';
import {Text,Stack} from '@bloxwap/hig/react/surface';
const components={Stack,Text,ScreenHeader,IconButton};
export function Example({name,state='default'}:{name:string;state?:string;previewDialog?:typeof import('@bloxwap/hig/react/overlay').Dialog}){const C=components;const [message,setMessage]=useState('');
function preview(){switch(name){case "ScreenHeader":return state==="minimal"?<C.ScreenHeader title='Edit name'/>:state==="unavailable"?<C.ScreenHeader title='Close position' badge='Demo' backDisabled onBack={()=>setMessage('The host goes back')}/>:<C.ScreenHeader title='Edit name' onBack={()=>setMessage('The host goes back')} action={<C.IconButton intent='ghost' label='Done' onClick={()=>setMessage('The host saves the name')}>✓</C.IconButton>}/>;
default:return <C.Text>Platform example unavailable.</C.Text>;}}return <C.Stack>{preview()}{message&&<C.Text>{message}</C.Text>}</C.Stack>;}
