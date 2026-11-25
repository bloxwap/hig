// Generated from planning/examples.json.
import React from 'react';
import {LiveStreamFeedBlock} from '@bloxwap/hig/react/blocks';
import {Text,Stack} from '@bloxwap/hig/react/surface';
const components={Stack,Text,LiveStreamFeedBlock};
export function Example({name}:{name:string;state?:string;previewDialog?:typeof import('@bloxwap/hig/react/overlay').Dialog}){const C=components;
function preview(){switch(name){case "LiveStreamFeedBlock":return <div style={{position:'relative',width:'100%',height:200}}><C.LiveStreamFeedBlock label='Live chat' messages={[{id:'1',username:'mira',source:'Twitch',text:'gm, what are we trading today?'},{id:'2',username:'okto',source:'Kick',text:'Long or short on BTC?'},{id:'3',username:'sable',source:'YouTube',text:'First time here. This looks great.'}]}/></div>;
default:return <C.Text>Platform example unavailable.</C.Text>;}}return <C.Stack>{preview()}</C.Stack>;}
