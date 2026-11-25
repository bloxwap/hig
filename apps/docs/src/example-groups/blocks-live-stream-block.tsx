// Generated from planning/examples.json.
import React,{useState} from 'react';
import {LiveStreamBlock} from '@bloxwap/hig/react/blocks';
import {Text,Stack} from '@bloxwap/hig/react/surface';
const components={Stack,Text,LiveStreamBlock};
export function Example({name}:{name:string;state?:string;previewDialog?:typeof import('@bloxwap/hig/react/overlay').Dialog}){const C=components;const [checked,setChecked]=useState(false);
const [message,setMessage]=useState('');
function preview(){switch(name){case "LiveStreamBlock":return <C.LiveStreamBlock title='Live streaming' description='Set up streaming and optional chat. Your device asks before broadcasting.' streaming={{title:'Streaming',endpointLabel:'Server link (RTMPS, RTMP, or SRT)',keyLabel:'Stream key'}} chat={{status:checked?'connected':'signedOut',onConnect:()=>setChecked(true),onDisconnect:()=>setChecked(false),labels:{title:'Chat',connect:'Sign in with Restream',disconnect:'Sign out',note:'Sign in with Restream to show your stream’s chat over the chart while you’re live.',status:s=>s==='connected'?'Connected':s==='connecting'?'Connecting…':s==='failed'?'Couldn’t connect':'Signed out'}}} appAudioLabel='Include app audio' microphoneLabel='Include microphone' saveLabel='Save' playLabel='Play' defaultSettings={{streaming:{endpoint:'rtmps://live.restream.io:1935/live',key:''},appAudio:true,microphone:true}} onPlay={()=>setMessage('Broadcast requested (demo)')}/>;
default:return <C.Text>Platform example unavailable.</C.Text>;}}return <C.Stack>{preview()}{message&&<C.Text>{message}</C.Text>}</C.Stack>;}
