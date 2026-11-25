// Generated from planning/examples.json.
import React,{useState} from 'react';
import {LiveStreamChatBlock} from '@bloxwap/hig/react/blocks';
import {Text,Stack} from '@bloxwap/hig/react/surface';
const components={Stack,Text,LiveStreamChatBlock};
export function Example({name}:{name:string;state?:string;previewDialog?:typeof import('@bloxwap/hig/react/overlay').Dialog}){const C=components;const [message,setMessage]=useState('');
function preview(){switch(name){case "LiveStreamChatBlock":return <C.LiveStreamChatBlock title='Chat' emptyLabel='No messages yet' messages={[{id:'1',username:'mira',source:'Twitch',text:'gm, what are we trading today?'},{id:'2',username:'okto',source:'Kick',text:'Long or short on BTC?'},{id:'3',username:'sable',source:'YouTube',text:'First time here. This looks great.'}]} onClose={()=>setMessage('The host closes the drawer')}/>;
default:return <C.Text>Platform example unavailable.</C.Text>;}}return <C.Stack>{preview()}{message&&<C.Text>{message}</C.Text>}</C.Stack>;}
