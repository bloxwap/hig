// Generated from planning/examples.json.
import React,{useState} from 'react';
import {LiveStreamChatBlock} from '@bloxwap/hig/react/blocks';
import {Text,Stack} from '@bloxwap/hig/react/surface';
const components={Stack,Text,LiveStreamChatBlock};
export function Example({name}:{name:string;state?:string;previewDialog?:typeof import('@bloxwap/hig/react/overlay').Dialog}){const C=components;const [message,setMessage]=useState('');
function preview(){switch(name){case "LiveStreamChatBlock":return <C.LiveStreamChatBlock title='Chat' emptyLabel='No messages yet' messages={[{id:'1',username:'mira',source:'Twitch',platform:'twitch',text:'gm, what are we trading today?'},{id:'2',username:'okto',source:'Kick',platform:'kick',text:'Long or short on BTC?'},{id:'3',username:'sable',source:'YouTube',platform:'youtube',text:'First time here. This looks great.'},{id:'4',username:'vex',source:'𝕏',platform:'x',text:'That wick was wild'},{id:'5',username:'mira',source:'Twitch',platform:'twitch',text:'Watching the funding rate flip negative while open interest keeps climbing. Someone is about to get squeezed, and I would rather it not be me.'}]} onClose={()=>setMessage('The host closes the drawer')}/>;
default:return <C.Text>Platform example unavailable.</C.Text>;}}return <C.Stack>{preview()}{message&&<C.Text>{message}</C.Text>}</C.Stack>;}
