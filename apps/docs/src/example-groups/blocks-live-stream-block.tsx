// Generated from planning/examples.json.
import React,{useState} from 'react';
import {LiveStreamBlock} from '@bloxwap/hig/react/blocks';
import {Text,Stack} from '@bloxwap/hig/react/surface';
const components={Stack,Text,LiveStreamBlock};
export function Example({name}:{name:string;state?:string;previewDialog?:typeof import('@bloxwap/hig/react/overlay').Dialog}){const C=components;const [message,setMessage]=useState('');
function preview(){switch(name){case "LiveStreamBlock":return <C.LiveStreamBlock title='Live streaming' description='Set up streaming and optional chat. Your device asks before broadcasting.' streaming={{title:'Streaming',endpointLabel:'Server link (RTMPS, RTMP, or SRT)',keyLabel:'Stream key'}} chat={{title:'Chat',endpointLabel:'Chat link or channel',keyLabel:'Chat key'}} appAudioLabel='Include app audio' microphoneLabel='Include microphone' saveLabel='Save' playLabel='Play' defaultSettings={{streaming:{endpoint:'rtmps://live.restream.io:1935/live',key:''},chat:{endpoint:'',key:''},appAudio:true,microphone:true}} onPlay={()=>setMessage('Broadcast requested (demo)')}/>;
default:return <C.Text>Platform example unavailable.</C.Text>;}}return <C.Stack>{preview()}{message&&<C.Text>{message}</C.Text>}</C.Stack>;}
