// Generated from planning/examples.json.
import React from 'react';
import {Usd} from '@bloxwap/hig/react/data';
import {Badge} from '@bloxwap/hig/react/status';
import {Text,Heading,Stack,Inline,Surface,Card,Separator} from '@bloxwap/hig/react/surface';
const components={Stack,Text,Heading,Usd,Inline,Badge,Surface,Card,Separator};
export function Example({name,state='default'}:{name:string;state?:string;previewDialog?:typeof import('@bloxwap/hig/react/overlay').Dialog}){const C=components;
function preview(){switch(name){case "Text":return state==="muted-caption"?<C.Text tone='muted' size='caption'>Cleared to balance in about 2 seconds.</C.Text>:<C.Text>Review the amount and asset before confirming.</C.Text>;
case "Heading":return <C.Heading>Order details</C.Heading>;
case "Stack":return <C.Stack><C.Text>Available balance</C.Text><C.Usd value={1250.45}/></C.Stack>;
case "Inline":return <C.Inline><C.Badge>Demo</C.Badge><C.Text>Updated just now</C.Text></C.Inline>;
case "Surface":return <C.Surface><C.Text>Keep related decisions together.</C.Text></C.Surface>;
case "Card":return <C.Card><C.Heading>Sample balance</C.Heading><C.Usd value={1250.45}/></C.Card>;
case "Separator":return <C.Stack><C.Text>Order amount</C.Text><C.Separator/><C.Text>Host-provided terms</C.Text></C.Stack>;
default:return <C.Text>Platform example unavailable.</C.Text>;}}return <C.Stack>{preview()}</C.Stack>;}
